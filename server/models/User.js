import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  aadhaarNumber: { type: String, unique: true, sparse: true }, // Patient's unique identity
  id: { type: String, unique: true, sparse: true },           // Doctor/Hospital's unique identity
  name: { type: String, required: true },
  role: { type: String, enum: ['PATIENT', 'DOCTOR', 'HOSPITAL', 'STAFF'], required: true },
  mobile: { type: String, required: true },
  email: { type: String, default: '' },
  password: { type: String, required: true },
  plainPassword: { type: String },
  alternateMobile: String,
  profilePic: String,
  // Patient specific
  patientId: String,
  dob: String,
  gender: String,
  age: String,
  address: String,
  localAddress: String,
  bloodGroup: String,
  // Doctor/Hospital specific
  specialization: String,
  facilityCategory: { type: String, enum: ['GOVERNMENT', 'PRIVATE', 'NGO', 'NONE'], default: 'NONE' },
  // Staff specific
  parentId: { type: String },
  parentName: String, // Hospital Name
  parentIdStr: String, // Hospital Registry ID (HFR)
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
