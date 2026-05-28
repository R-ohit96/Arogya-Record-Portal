import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Aadhaar
  title: { type: String, required: true },
  date: { type: String, required: true },
  doctorName: { type: String, required: true },
  hospitalName: { type: String, required: true },
  category: { type: String, required: true },
  uploaderType: { type: String, enum: ['PATIENT', 'HOSPITAL'], required: true },
  uploaderId: { type: String, required: true },
  fileData: { type: String }, // Base64 or URL
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', recordSchema);
export default MedicalRecord;
