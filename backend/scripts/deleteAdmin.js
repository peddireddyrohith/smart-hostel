import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const emailToDelete = process.argv[2];

if (!emailToDelete) {
  console.error('Please provide the email of the admin to delete.');
  console.error('Usage: node deleteAdmin.js <email>');
  process.exit(1);
}

const deleteAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const result = await User.deleteOne({ email: emailToDelete, role: 'admin' });

    if (result.deletedCount > 0) {
      console.log(`✅ Success: Admin ${emailToDelete} deleted.`);
    } else {
      console.log(`❌ Error: No admin found with email ${emailToDelete}.`);
    }

    process.exit();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

deleteAdmin();
