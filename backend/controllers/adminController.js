import User from '../models/User.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import Complaint from '../models/Complaint.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { generateRentReceipt } from '../utils/pdfService.js';
import { sendPaymentConfirmationEmail, sendComplaintUpdateEmail } from '../utils/emailService.js';

// ════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════

// @desc  Get dashboard analytics
// @route GET /api/admin/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const [totalRooms, occupiedRooms, totalTenants, openComplaints, totalRevenue] =
      await Promise.all([
        Room.countDocuments(),
        Room.countDocuments({ status: 'occupied' }),
        User.countDocuments({ role: 'tenant' }),
        Complaint.countDocuments({ status: 'open' }),
        Payment.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    // Monthly revenue for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        totalTenants,
        openComplaints,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════
//  ROOMS
// ════════════════════════════════════════════

// @route GET /api/admin/rooms
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find().populate('occupiedBy', 'name email phone');
    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/rooms
export const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);

    await AuditLog.create({
      user: req.user._id,
      action: 'ROOM_CREATED',
      description: `Admin created Room ${room.roomNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/rooms/:id
export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) { res.status(404); throw new Error('Room not found'); }

    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/rooms/:id
export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) { res.status(404); throw new Error('Room not found'); }
    if (room.status === 'occupied') {
      res.status(400);
      throw new Error('Cannot delete an occupied room');
    }
    await room.deleteOne();
    res.status(200).json({ success: true, message: 'Room deleted' });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/rooms/:id/allocate
export const allocateRoom = async (req, res, next) => {
  try {
    const { tenantId } = req.body;
    const room = await Room.findById(req.params.id);
    const tenant = await User.findById(tenantId);

    if (!room) { res.status(404); throw new Error('Room not found'); }
    if (!tenant) { res.status(404); throw new Error('Tenant not found'); }
    if (room.status === 'occupied') { res.status(400); throw new Error('Room is already occupied'); }
    if (tenant.allocatedRoom) { res.status(400); throw new Error('Tenant already has a room'); }

    // Update both room and tenant
    room.occupiedBy = tenant._id;
    room.status = 'occupied';
    tenant.allocatedRoom = room._id;

    await Promise.all([room.save(), tenant.save()]);

    await AuditLog.create({
      user: req.user._id,
      action: 'ROOM_ALLOCATED',
      description: `Admin allocated Room ${room.roomNumber} to tenant ${tenant.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { roomId: room._id, tenantId: tenant._id },
    });

    await Notification.create({
      recipient: tenantId,
      title: 'Room Allocated',
      message: `You have been allocated to Room ${room.roomNumber}.`,
      type: 'success',
    });

    res.status(200).json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/rooms/:id/unallocate
export const unallocateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) { res.status(404); throw new Error('Room not found'); }
    if (room.status !== 'occupied') { res.status(400); throw new Error('Room is not occupied'); }

    const tenantId = room.occupiedBy;
    const tenant = await User.findById(tenantId);
    
    room.occupiedBy = undefined;
    room.status = 'available';

    if (tenant) {
      tenant.allocatedRoom = undefined;
      await tenant.save();
    }
    await room.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'ROOM_UNALLOCATED',
      description: `Admin unallocated Room ${room.roomNumber}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { roomId: room._id, tenantId },
    });

    if (tenant) {
      await Notification.create({
        recipient: tenant._id,
        title: 'Room Vacated',
        message: `You have been removed from Room ${room.roomNumber}.`,
        type: 'info',
      });
    }

    res.status(200).json({ success: true, message: 'Room unallocated successfully' });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════
//  TENANTS
// ════════════════════════════════════════════

// @route GET /api/admin/tenants
export const getTenants = async (req, res, next) => {
  try {
    const tenants = await User.find({ role: 'tenant' }).populate('allocatedRoom', 'roomNumber type floor');
    res.status(200).json({ success: true, count: tenants.length, data: tenants });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/tenants/:id  (activate/deactivate)
export const updateTenant = async (req, res, next) => {
  try {
    const tenant = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!tenant) { res.status(404); throw new Error('Tenant not found'); }
    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/tenants/:id
export const deleteTenant = async (req, res, next) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) { res.status(404); throw new Error('Tenant not found'); }
    if (tenant.isActive) {
      res.status(400);
      throw new Error('Cannot delete an active tenant. Deactivate them first.');
    }
    if (tenant.allocatedRoom) {
      res.status(400);
      throw new Error('Cannot delete a tenant who is still allocated to a room. Unallocate them first.');
    }

    // Clean up related records
    await Payment.deleteMany({ tenant: tenant._id });
    await Complaint.deleteMany({ tenant: tenant._id });

    // Actually delete
    await tenant.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      action: 'TENANT_DELETED',
      description: `Admin deleted tenant account for ${tenant.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════
//  PAYMENTS
// ════════════════════════════════════════════

// @route GET /api/admin/payments
export const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('tenant', 'name email')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/payments/:id  (mark as paid manually)
export const markPaymentPaid = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenant')
      .populate('room');

    if (!payment) { res.status(404); throw new Error('Payment not found'); }

    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    // Generate PDF receipt
    const filename = await generateRentReceipt(payment.tenant, payment.room, payment);
    payment.receiptFilename = filename;
    await payment.save();

    // Email tenant
    sendPaymentConfirmationEmail(payment.tenant, payment).catch(console.error);

    await AuditLog.create({
      user: req.user._id,
      action: 'PAYMENT_MARKED_PAID',
      description: `Admin marked payment as paid for ${payment.tenant.name} — ${payment.monthLabel}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════
//  COMPLAINTS
// ════════════════════════════════════════════

// @route GET /api/admin/complaints
export const getComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find()
      .populate('tenant', 'name email')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/complaints/:id  (update status / resolve)
export const updateComplaint = async (req, res, next) => {
  try {
    const { status, priority, adminRemarks } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('tenant');

    if (!complaint) { res.status(404); throw new Error('Complaint not found'); }

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (adminRemarks) complaint.adminRemarks = adminRemarks;
    if (status === 'resolved') complaint.resolvedAt = new Date();

    await complaint.save();

    // Fire-and-forget email and notification
    try {
      sendComplaintUpdateEmail(complaint.tenant, complaint);

      await Notification.create({
        recipient: complaint.tenant._id,
        title: `Complaint ${status === 'resolved' ? 'Resolved' : 'Updated'}`,
        message: `Your complaint "${complaint.title}" is now ${status}.`,
        type: status === 'resolved' ? 'success' : 'info',
      });
    } catch (e) {
      console.error('Failed to send complaint update:', e);
    }
    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════
//  AUDIT LOGS
// ════════════════════════════════════════════

// @route GET /api/admin/audit-logs
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};
