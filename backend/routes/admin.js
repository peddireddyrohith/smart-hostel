import express from 'express';
import {
  getDashboard,
  getRooms, createRoom, updateRoom, deleteRoom, allocateRoom, unallocateRoom,
  getTenants, updateTenant, deleteTenant,
  getPayments, markPaymentPaid,
  getComplaints, updateComplaint,
  getAuditLogs,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { roomRules, validate } from '../middleware/validate.js';

const router = express.Router();

// All admin routes require: valid JWT + admin role
router.use(protect, authorize('admin'));

// ── Dashboard ──────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ── Rooms ──────────────────────────────────────────────────
router.route('/rooms')
  .get(getRooms)
  .post(roomRules, validate, createRoom);

router.route('/rooms/:id')
  .put(updateRoom)
  .delete(deleteRoom);

router.put('/rooms/:id/allocate', allocateRoom);
router.put('/rooms/:id/unallocate', unallocateRoom);

// ── Tenants ────────────────────────────────────────────────
router.get('/tenants', getTenants);
router.route('/tenants/:id')
  .put(updateTenant)
  .delete(deleteTenant);

// ── Payments ───────────────────────────────────────────────
router.get('/payments', getPayments);
router.put('/payments/:id', markPaymentPaid);

// ── Complaints ─────────────────────────────────────────────
router.get('/complaints', getComplaints);
router.put('/complaints/:id', updateComplaint);

// ── Audit Logs ─────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);

export default router;
