import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: ['single', 'double', 'triple'],
    },

    floor: {
      type: Number,
      default: 1,
    },

    rent: {
      type: Number,
      required: [true, 'Rent amount is required'],
      min: [0, 'Rent cannot be negative'],
    },

    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },

    // Reference to the tenant currently in this room
    occupiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    amenities: {
      type: [String], // e.g. ['wifi', 'ac', 'attached bathroom']
      default: [],
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ── Compound Index: faster queries by status + type ────────
roomSchema.index({ status: 1, type: 1 });

// ── Virtual: is this room currently occupied? ──────────────
roomSchema.virtual('isOccupied').get(function () {
  return this.status === 'occupied';
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
