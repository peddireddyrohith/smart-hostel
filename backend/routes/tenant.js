import express from 'express';
import {
  getProfile,
  getMyRoom,
  getMyPayments,
  getCurrentPayment,
  initiatePayment,
  verifyPayment,
  cashfreeWebhook,
  downloadReceipt,
  getMyComplaints,
  submitComplaint,
} from '../controllers/tenantController.js';
import { protect, authorize } from '../middleware/auth.js';
import { complaintRules, validate } from '../middleware/validate.js';

const router = express.Router();

// All tenant routes require: valid JWT + tenant role
// Exception: webhook (called by Cashfree, no JWT)
router.post('/payments/webhook', cashfreeWebhook);

// Apply auth to all routes below
router.use(protect, authorize('tenant'));

// ── Profile ────────────────────────────────────────────────
router.get('/profile', getProfile);

// ── Room ───────────────────────────────────────────────────
router.get('/room', getMyRoom);

// ── Payments ───────────────────────────────────────────────
router.get('/payments',           getMyPayments);
router.get('/payments/current',   getCurrentPayment);
router.post('/payments/initiate',        initiatePayment);
router.get('/payments/verify/:orderId',  verifyPayment);
router.get('/payments/:id/receipt',      downloadReceipt);

// ── Complaints ─────────────────────────────────────────────
router.route('/complaints')
  .get(getMyComplaints)
  .post(complaintRules, validate, submitComplaint);

export default router;
