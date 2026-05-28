import User from '../models/User.js';

export const registerUser = async (req, res) => {
  try {
    const userData = req.body;
    console.log('--- REGISTRATION REQUEST ---');
    console.log(userData);
    console.log('----------------------------');

    // --- STRIKT UNIQUENESS CHECK ---
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
    // -------------------------------

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

export const createStaff = async (req, res) => {
  try {
    const { name, email, password, mobile, parentId, parentName, parentIdStr } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    const newStaff = new User({
      name,
      email,
      password,
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

export const loginUser = async (req, res) => {
  try {
    const { role, id, password } = req.body;
    // Patient logins with AadhaarNumber, Doctor/Hospital logins with Email
    const query = role === 'PATIENT' ? { aadhaarNumber: id } : { email: id };
    // Simplified login lookup: find by Aadhaar (Patient) or Email (Staff/Doctor/Hospital)
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found! Please register first.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    // Role check (Optional: could also check if user.role is compatible with requested role)
    if (role === 'PATIENT' && user.role !== 'PATIENT') {
      return res.status(403).json({ success: false, message: 'Patients must login with Aadhaar.' });
    }

    res.json({ success: true, message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

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
