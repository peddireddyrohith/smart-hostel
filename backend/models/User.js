import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned in queries by default
    },

    role: {
      type: String,
      enum: ['admin', 'tenant'],
      default: 'tenant',
    },

    phone: {
      type: String,
      trim: true,
    },

    // Reference to the room allocated to this tenant (null for admin)
    allocatedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },

    // For JWT refresh token rotation
    refreshToken: {
      type: String,
      select: false, // Never returned in queries by default
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ── Pre-save Hook: Hash password before saving ─────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was modified (not on other updates)
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Method: Compare entered password with hash ────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
