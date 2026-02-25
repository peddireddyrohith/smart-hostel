import User from '../models/User.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import { createCashfreeOrder, verifyCashfreeWebhook, getCashfreeOrderStatus } from '../utils/cashfreeService.js';
import { generateRentReceipt } from '../utils/pdfService.js';
import { sendPaymentConfirmationEmail } from '../utils/emailService.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ════════════════════════════════════════════
//  PROFILE
// ════════════════════════════════════════════

// @route GET /api/tenant/profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('allocatedRoom');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════
//  ROOM
// ════════════════════════════════════════════

// @route GET /api/tenant/room
export const getMyRoom = async (req, res, next) => {
  try {
    if (!req.user.allocatedRoom) {
      return res.status(200).json({ success: true, data: null, message: 'No room allocated yet' });
    }
    const room = await Room.findById(req.user.allocatedRoom);
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════
//  PAYMENTS
// ════════════════════════════════════════════

// @route GET /api/tenant/payments
export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ tenant: req.user._id })
      .populate('room', 'roomNumber type')
      .sort({ year: -1, month: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tenant/payments/current
export const getCurrentPayment = async (req, res, next) => {
  try {
    const now = new Date();
    const payment = await Payment.findOne({
      tenant: req.user._id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }).populate('room', 'roomNumber type rent');

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tenant/payments/initiate
// Initiates a Cashfree payment order
export const initiatePayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('allocatedRoom');

    if (!user.allocatedRoom) {
      res.status(400);
      throw new Error('No room allocated. Cannot initiate payment.');
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Check if already paid this month
    const existing = await Payment.findOne({ tenant: user._id, month, year });
    if (existing && existing.status === 'paid') {
      res.status(400);
      throw new Error('Rent already paid for this month');
    }

    const orderId = `ORDER-${uuidv4().slice(0, 8).toUpperCase()}`;
    const amount = user.allocatedRoom.rent;

    // Create order on Cashfree
    const cashfreeData = await createCashfreeOrder({
      orderId,
      amount,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '9999999999',
    });

    // Create or update pending payment record
    await Payment.findOneAndUpdate(
      { tenant: user._id, month, year },
      {
        tenant: user._id,
        room: user.allocatedRoom._id,
        amount,
        month,
        year,
        status: 'pending',
        cashfreeOrderId: orderId,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      orderId,
      paymentSessionId: cashfreeData.payment_session_id,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tenant/payments/simulate  (DEV ONLY — bypasses Cashfree)
export const simulatePayment = async (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403); throw new Error('Only available in development mode');
  }
  try {
    const user = await User.findById(req.user._id).populate('allocatedRoom');
    if (!user.allocatedRoom) { res.status(400); throw new Error('No room allocated'); }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const payment = await Payment.findOneAndUpdate(
      { tenant: user._id, month, year },
      {
        tenant: user._id,
        room: user.allocatedRoom._id,
        amount: user.allocatedRoom.rent,
        month, year,
        status: 'paid',
        cashfreeOrderId: `SIM-${Date.now()}`,
        cashfreePaymentId: `SIM-PAY-${Date.now()}`,
        paidAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Payment simulated successfully', data: payment });
  } catch (error) { next(error); }
};

// @route POST /api/tenant/payments/webhook
// Cashfree webhook — called by Cashfree after payment
export const cashfreeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);

    const isValid = verifyCashfreeWebhook(rawBody, signature, timestamp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { order_id, order_status, cf_payment_id } = req.body.data?.order || {};

    if (order_status === 'PAID') {
      const payment = await Payment.findOne({ cashfreeOrderId: order_id })
        .populate('tenant')
        .populate('room');

      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.cashfreePaymentId = cf_payment_id;
        payment.paidAt = new Date();
        await payment.save();

        // Generate PDF receipt
        const filename = await generateRentReceipt(payment.tenant, payment.room, payment);
        payment.receiptFilename = filename;
        await payment.save();

        // Email tenant
        sendPaymentConfirmationEmail(payment.tenant, payment).catch(console.error);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tenant/payments/:id/receipt
// Download PDF receipt
export const downloadReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, tenant: req.user._id });
    if (!payment || !payment.receiptFilename) {
      res.status(404);
      throw new Error('Receipt not found');
    }

    const filePath = path.join(__dirname, '..', 'receipts', payment.receiptFilename);
    res.download(filePath, payment.receiptFilename);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tenant/payments/verify/:orderId
// Verifies payment status with Cashfree and marks as paid if successful
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const orderData = await getCashfreeOrderStatus(orderId);

    if (orderData.order_status === 'PAID') {
      const payment = await Payment.findOneAndUpdate(
        { cashfreeOrderId: orderId, tenant: req.user._id },
        {
          status: 'paid',
          cashfreePaymentId: orderData.cf_order_id || orderId,
          paidAt: new Date(),
        },
        { new: true }
      ).populate('tenant').populate('room');

      if (payment && !payment.receiptFilename) {
        try {
          const filename = await generateRentReceipt(payment.tenant, payment.room, payment);
          payment.receiptFilename = filename;
          await payment.save();
          sendPaymentConfirmationEmail(payment.tenant, payment).catch(console.error);

          // Notify admins
          const admins = await User.find({ role: 'admin' }).select('_id');
          await Promise.all(admins.map(admin => 
            Notification.create({
              recipient: admin._id,
              title: 'Rent Paid',
              message: `${payment.tenant.name} paid ₹${payment.amount} for ${payment.month}/${payment.year}.`,
              type: 'success',
            })
          ));
        } catch (e) { console.error('Receipt/Notification error:', e.message); }
      }

      return res.status(200).json({ success: true, status: 'paid', data: payment });
    }

    res.status(200).json({ success: true, status: orderData.order_status?.toLowerCase() || 'pending' });
  } catch (error) { next(error); }
};


// ════════════════════════════════════════════

// @route GET /api/tenant/complaints
export const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ tenant: req.user._id })
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tenant/complaints
export const submitComplaint = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    const complaint = await Complaint.create({
      tenant: req.user._id,
      room: req.user.allocatedRoom || undefined, // optional
      title,
      description,
      category,
    });

    // Notify admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map(admin => 
      Notification.create({
        recipient: admin._id,
        title: 'New Complaint',
        message: `${req.user.name} submitted a new complaint: ${title}`,
        type: 'warning',
      })
    ));

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};
