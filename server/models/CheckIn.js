import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  doctorId: { type: String, required: true }, // Doctor or Hospital ID
  patientId: { type: String, required: true }, // Aadhaar
  patientName: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'OPENED', 'COMPLETED'], default: 'PENDING' },
  scannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-expire check-ins after 30 minutes to keep the queue fresh
checkInSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const CheckIn = mongoose.model('CheckIn', checkInSchema);
export default CheckIn;
