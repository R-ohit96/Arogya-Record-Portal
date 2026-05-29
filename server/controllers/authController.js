// Existing imports remain unchanged
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

// OTP store for password reset (in‑memory, suitable for dev/demo)
const passwordResetStore = new Map(); // key: mobile, value: { otp, expiresAt, tries, role, identifier }

// Helper to generate 6‑digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Configure Cloudinary once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===================== PASSWORD RESET =====================

export const requestPasswordReset = async (req, res) => {
  try {
    const { role, identifier, mobile } = req.body; // identifier = aadhaarNumber (PATIENT) or email (others)
    if (!role || !identifier || !mobile) {
      return res.status(400).json({ success: false, message: 'role, identifier and mobile are required.' });
    }
    // Basic mobile validation
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number.' });
    }
    // Verify user exists
    const query = role === 'PATIENT' ? { aadhaarNumber: identifier } : { email: identifier.trim().toLowerCase() };
    const user = await User.findOne(query);
    if (!user) {
      // For security, do not reveal existence – send generic response
      return res.status(200).json({ success: true, message: 'If the account exists, an OTP has been sent.' });
    }
    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    passwordResetStore.set(mobile, { otp, expiresAt, tries: 0, role, identifier });
    // For demo purposes, log OTP to console (same style as existing OTP utils)
    console.log(`\n📱 [RESET OTP] OTP for +91${mobile} => \x1b[33m${otp}\x1b[0m\n`);
    return res.json({ success: true, message: 'OTP sent (check console).' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ success: false, message: 'Server error during reset request.' });
  }
};

export const confirmPasswordReset = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;
    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'mobile, otp and newPassword are required.' });
    }
    const record = passwordResetStore.get(mobile);
    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this mobile.' });
    }
    if (Date.now() > record.expiresAt) {
      passwordResetStore.delete(mobile);
      return res.status(400).json({ success: false, message: 'OTP expired.' });
    }
    if (record.tries >= 3) {
      passwordResetStore.delete(mobile);
      return res.status(429).json({ success: false, message: 'Too many failed attempts.' });
    }
    if (record.otp !== otp) {
      record.tries += 1;
      passwordResetStore.set(mobile, record);
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }
    // OTP verified – update password (hash it)
    const query = record.role === 'PATIENT' ? { aadhaarNumber: record.identifier } : { email: record.identifier };
    const user = await User.findOne(query);
    if (!user) {
      passwordResetStore.delete(mobile);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    passwordResetStore.delete(mobile);
    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
};

// ===================== REGISTER =====================

export const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    console.log('--- REGISTRATION REQUEST ---');
    console.log(userData);
    console.log('----------------------------');

    // Normalize email to lowercase (for Doctor/Hospital)
    if (userData.email) {
      userData.email = userData.email.trim().toLowerCase();
    } else {
      delete userData.email; // Prevent E11000 duplicate key error on empty string
    }

    if (!userData.id) {
      delete userData.id;
    }
    if (!userData.aadhaarNumber) {
      delete userData.aadhaarNumber;
    }

    // For non‑PATIENT roles, email is mandatory
    if (userData.role !== 'PATIENT' && !userData.email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for Doctor / Hospital registration.'
      });
    }

    // --- STRICT UNIQUENESS CHECK ---
    const query = userData.role === 'PATIENT'
      ? { aadhaarNumber: userData.aadhaarNumber }
      : { id: userData.id };

    const existingUser = await User.findOne(query);

    if (existingUser) {
      const fieldName = userData.role === 'PATIENT' ? 'Aadhaar Number' : 'Registry ID';
      return res.status(400).json({
        success: false,
        message: `Oops! Ye ${fieldName} pehle se registered hai. Ek ID se doosri profile nahi ban sakti.`
      });
    }

    // Also check duplicate email for non‑PATIENT
    if (userData.role !== 'PATIENT' && userData.email) {
      const emailExists = await User.findOne({ email: userData.email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered.'
        });
      }
    }
    // -------------------------------

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    const newUser = new User(userData);
    await newUser.save();
    res.json({ success: true, message: 'Registration successful!', user: newUser });
  } catch (error) {
    console.error('--- REGISTRATION ERROR ---');
    console.error(error);
    if (error.name === 'ValidationError') {
      console.error('Validation details:', Object.values(error.errors).map(e => e.message));
    }
    console.error('--------------------------');
    res.status(500).json({ success: false, message: error.message || 'Registration failed server-side' });
  }
};

// ===================== STAFF =====================

export const createStaff = async (req, res) => {
  try {
    const { name, email, password, mobile, parentId, parentName, parentIdStr } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      mobile,
      role: 'STAFF',
      parentId,
      parentName,
      parentIdStr,
      isVerified: true
    });

    await newStaff.save();
    res.status(201).json({ success: true, message: 'Staff member added successfully.', staff: newStaff });
  } catch (error) {
    console.error('Staff Creation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create staff account.' });
  }
};

export const getStaffList = async (req, res) => {
  try {
    const staffList = await User.find({ parentId: req.params.parentId, role: 'STAFF' });
    res.json({ success: true, staff: staffList });
  } catch (error) {
    console.error('Staff List Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff list.' });
  }
};

export const removeStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    res.json({ success: true, message: 'Staff member removed successfully.' });
  } catch (error) {
    console.error('Staff Removal Error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove staff account.' });
  }
};

// ===================== LOGIN =====================

export const loginUser = async (req, res) => {
  try {
    const { role, id, password } = req.body;

    const originalId = (id || '').trim();
    // Normalize email for non-PATIENT
    const normalizedId = role === 'PATIENT' ? originalId : originalId.toLowerCase();

    // Patient logins with AadhaarNumber or legacy PatientId
    // Doctor/Hospital logins with Email or legacy ID
    let query;
    if (role === 'PATIENT') {
      // Patient logs in strictly with 12-digit Aadhaar number only
      query = { aadhaarNumber: originalId };
    } else {
      query = { $or: [{ email: normalizedId }, { id: originalId }, { id: originalId.toUpperCase() }] };
    }
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found! Please register first.' });
    }

    // Compare hashed password using bcrypt
    // Also support legacy plain‑text passwords (one‑time migration)
    let passwordMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Hashed password – compare with bcrypt
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain‑text password – compare directly & upgrade hash
      passwordMatch = (user.password === password);
      if (passwordMatch) {
        // Auto‑upgrade to hashed password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        console.log(`[AUTH] Auto‑upgraded password hash for user ${user._id}`);
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    // Role check
    if (role === 'PATIENT' && user.role !== 'PATIENT') {
      return res.status(403).json({ success: false, message: 'Patients must login with Aadhaar.' });
    }
    if (role !== 'PATIENT' && user.role !== role) {
      return res.status(403).json({ success: false, message: `This account is registered as ${user.role}, not ${role}.` });
    }

    res.json({ success: true, message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ===================== GET USER =====================

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [{ aadhaarNumber: req.params.id }, { id: req.params.id }]
    });
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ success: false });
  }
};

// ===================== PROFILE PICTURE (Cloudinary) =====================

export const uploadProfilePic = async (req, res) => {
  try {
    const { id, profilePic } = req.body; // id = user's _id, profilePic = base64 data‑URL

    if (!id || !profilePic) {
      return res.status(400).json({ success: false, message: 'id and profilePic are required.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let picUrl = profilePic;

    // If it's a base64 data‑URL, upload to Cloudinary
    if (profilePic.startsWith('data:')) {
      const uploadRes = await cloudinary.uploader.upload(profilePic, {
        folder: 'aarogya_profile_pics',
        public_id: `user_${id}`,
        overwrite: true,
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
      });
      picUrl = uploadRes.secure_url;
    }

    user.profilePic = picUrl;
    await user.save();

    return res.json({ success: true, profilePic: picUrl });
  } catch (error) {
    console.error('Profile pic upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload profile picture.' });
  }
};

// ===================== REMOVE PROFILE PICTURE =====================

export const removeProfilePic = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required.' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Try to delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(`aarogya_profile_pics/user_${id}`);
    } catch (e) {
      console.log('Cloudinary delete skipped:', e.message);
    }

    user.profilePic = null;
    await user.save();
    return res.json({ success: true, message: 'Profile picture removed.' });
  } catch (error) {
    console.error('Profile pic remove error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove profile picture.' });
  }
};

// ===================== UPDATE PROFILE (general fields) =====================

export const updateUserProfile = async (req, res) => {
  try {
    const { id, ...updatedFields } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required.' });
    }

    // Normalize email if provided
    if (updatedFields.email) {
      updatedFields.email = updatedFields.email.trim().toLowerCase();
    }

    const user = await User.findByIdAndUpdate(id, updatedFields, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
