import CheckIn from '../models/CheckIn.js';

export const checkIn = async (req, res) => {
  try {
    const { doctorId, patientId, patientName } = req.body;

    // Create or update a pending check-in
    const checkIn = new CheckIn({ doctorId, patientId, patientName });
    await checkIn.save();

    res.json({ success: true, message: 'Checked-in successfully at clinic' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Check-in failed' });
  }
};

export const pollCheckIn = async (req, res) => {
  try {
    // Find latest pending check-in within the last 2 minutes
    const latestCheckIn = await CheckIn.findOne({
      doctorId: req.params.doctorId,
      status: 'PENDING',
      createdAt: { $gt: new Date(Date.now() - 120000) }
    }).sort({ createdAt: -1 });

    if (latestCheckIn) {
      res.json({ success: true, checkIn: latestCheckIn });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Poll error:', error);
    res.status(500).json({ success: false });
  }
};

export const completeCheckIn = async (req, res) => {
  try {
    const { checkInId } = req.body;
    await CheckIn.findByIdAndUpdate(checkInId, { status: 'COMPLETED' });
    res.json({ success: true });
  } catch (error) {
    console.error('Complete check-in error:', error);
    res.status(500).json({ success: false });
  }
};
