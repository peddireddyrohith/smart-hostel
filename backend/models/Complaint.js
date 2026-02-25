import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    // Who submitted the complaint
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant is required'],
    },

    // Which room the complaint is about
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },

    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['maintenance', 'noise', 'cleanliness', 'security', 'other'],
    },

    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open',
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    // Admin's response/resolution note
    adminRemarks: {
      type: String,
      trim: true,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null, // null until status becomes 'resolved'
    },
  },
  {
    timestamps: true, // createdAt = when complaint was submitted
  }
);

// ── Index: fetch complaints by tenant quickly ──────────────
complaintSchema.index({ tenant: 1, status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
