import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const [email, password, name] = process.argv.slice(2);

if (!email || !password || !name) {
  console.error('Usage: node createAdmin.js <email> <password> "<Full Name>"');
  process.exit(1);
}

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const adminExists = await User.findOne({ email });

    if (adminExists) {
      console.log(`❌ Admin already exists with email: ${email}`);
      process.exit(1);
    }

    await User.create({
      name,
      email,
      password,
      role: 'admin',
      phone: '0000000000',
    });

    console.log(`✅ Success: Admin ${name} created with email ${email}`);

    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
