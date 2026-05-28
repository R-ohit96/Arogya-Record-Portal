import mongoose from 'mongoose';

const accessLogSchema = new mongoose.Schema({
  patientAadhaar: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'REVOKED', 'CLOSED'], default: 'OPEN' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Auto-expire closed/revoked logs after 24 hours
accessLogSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400, partialFilterExpression: { status: { $in: ['REVOKED', 'CLOSED'] } } });

const AccessLog = mongoose.model('AccessLog', accessLogSchema);
export default AccessLog;
