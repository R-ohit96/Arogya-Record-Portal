import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const recordSchema = new mongoose.Schema({
  patientId: String,
  title: String,
  date: String,
  doctorName: String,
  hospitalName: String,
  category: String,
  uploaderType: String,
  uploaderId: String,
  fileData: String,
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', recordSchema);

async function dump() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');
    const records = await MedicalRecord.find({});
    console.log('Total records in database:', records.length);
    console.log(JSON.stringify(records, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dump();
