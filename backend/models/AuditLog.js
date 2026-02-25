import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action (null for unauthenticated attempts)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    action: {
      type: String,
      required: [true, 'Action is required'],
      // e.g. 'LOGIN', 'LOGOUT', 'ROOM_CREATED', 'TENANT_ALLOCATED', etc.
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      // Human-readable: "Admin allocated Room 101 to tenant Rohith"
    },

    // IP address of the request
    ipAddress: {
      type: String,
      default: null,
    },

    // Browser/device info
    userAgent: {
      type: String,
      default: null,
    },

    // Was this a successful or failed action?
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },

    // Extra data (flexible — store any relevant metadata)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt = exact time of the event
  }
);

// ── TTL Index: auto-delete logs older than 90 days ─────────
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ── Index: query logs by user quickly ─────────────────────
auditLogSchema.index({ user: 1, action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
