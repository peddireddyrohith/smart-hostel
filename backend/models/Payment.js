import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    // Who paid
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant is required'],
    },

    // Which room the payment is for
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    // Which month/year this payment covers (e.g. Feb 2026)
    month: {
      type: Number, // 1–12
      required: [true, 'Payment month is required'],
    },

    year: {
      type: Number,
      required: [true, 'Payment year is required'],
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },

    // Cashfree payment details
    cashfreeOrderId: {
      type: String,
      default: null,
    },

    cashfreePaymentId: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null, // null until payment is confirmed
    },

    // PDF receipt filename
    receiptFilename: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Compound Index: prevent duplicate payment for same month ─
paymentSchema.index({ tenant: 1, month: 1, year: 1 }, { unique: true });

// ── Virtual: human-readable month label ───────────────────
paymentSchema.virtual('monthLabel').get(function () {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[this.month - 1]} ${this.year}`;
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
