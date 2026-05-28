import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from "path";

// Routes
import authRoutes from './server/routes/authRoutes.js';
import otpRoutes from './server/routes/otpRoutes.js';
import recordRoutes from './server/routes/recordRoutes.js';
import checkInRoutes from './server/routes/checkInRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import accessLogRoutes from './server/routes/accessLogRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection 
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));



// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api', otpRoutes); // Mounts /api/send-sms-otp, etc.
app.use('/api/records', recordRoutes);
app.use('/api/check-in', checkInRoutes);
app.use('/api/users', userRoutes);
app.use('/api/access-logs', accessLogRoutes);

app.use(express.static(path.join(process.cwd(), "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
