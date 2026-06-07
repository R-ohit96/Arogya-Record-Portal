import AccessLog from '../models/AccessLog.js';

// Create a new access log when doctor opens patient profile
export const createAccessLog = async (req, res) => {
  try {
    const { patientAadhaar, doctorId, doctorName } = req.body;

    // Check if an active (OPEN) log already exists for this doctor-patient pair
    const existingLog = await AccessLog.findOne({
      patientAadhaar,
      doctorId,
      status: 'OPEN',
      expiresAt: { $gt: new Date() }
    });

    if (existingLog) {
      return res.json({ success: true, message: 'Access already active', log: existingLog });
    }

    // Create new log with 12-hour expiry
    const newLog = new AccessLog({
      patientAadhaar,
      doctorId,
      doctorName,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
    });
    await newLog.save();

    res.json({ success: true, message: 'Access log created', log: newLog });
  } catch (error) {
    console.error('Create Access Log Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create access log' });
  }
};

// Get all active (OPEN) access logs for a patient
export const getPatientAccessLogs = async (req, res) => {
  try {
    const { aadhaar } = req.params;
    const logs = await AccessLog.find({
      patientAadhaar: aadhaar,
      status: 'OPEN',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get Access Logs Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch access logs' });
  }
};

// Revoke access (patient clicks "Revoke Access")
export const revokeAccessLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await AccessLog.findByIdAndUpdate(logId, { status: 'REVOKED' }, { new: true });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.json({ success: true, message: 'Access revoked', log });
  } catch (error) {
    console.error('Revoke Access Error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke access' });
  }
};

// Close access log (doctor leaves the profile page)
export const closeAccessLog = async (req, res) => {
  try {
    const { patientAadhaar, doctorId } = req.body;
    await AccessLog.updateMany(
      { patientAadhaar, doctorId, status: 'OPEN' },
      { status: 'CLOSED' }
    );
    res.json({ success: true, message: 'Access closed' });
  } catch (error) {
    console.error('Close Access Error:', error);
    res.status(500).json({ success: false, message: 'Failed to close access' });
  }
};

// Check if a specific doctor's access is still valid (not revoked/expired)
export const checkAccessValidity = async (req, res) => {
  try {
    const { patientAadhaar, doctorId } = req.query;
    
    // Find the single most recent access log for this pair
    const latestLog = await AccessLog.findOne({
      patientAadhaar,
      doctorId
    }).sort({ createdAt: -1 });

    if (!latestLog) {
      return res.json({ success: true, valid: false, reason: 'EXPIRED' });
    }

    if (latestLog.status === 'REVOKED') {
      return res.json({ success: true, valid: false, reason: 'REVOKED' });
    }

    if (latestLog.status === 'OPEN' && latestLog.expiresAt > new Date()) {
      return res.json({ success: true, valid: true });
    }

    // If it's CLOSED or expired
    return res.json({ success: true, valid: false, reason: 'EXPIRED' });
  } catch (error) {
    console.error('Check Access Error:', error);
    res.status(500).json({ success: false, message: 'Failed to check access' });
  }
};
