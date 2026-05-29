import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  aadhaarNumber: String,
  id: String,
  name: String,
  role: String,
  email: String,
  mobile: String
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function dump() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');
    const users = await User.find({});
    console.log('Total users in database:', users.length);
    console.log(users.map(u => ({ id: u.id, aadhaarNumber: u.aadhaarNumber, name: u.name, role: u.role, email: u.email, mobile: u.mobile })));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dump();
