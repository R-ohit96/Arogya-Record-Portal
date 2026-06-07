import MedicalRecord from '../models/MedicalRecord.js';
import { v2 as cloudinary } from 'cloudinary';

export const getRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, records });
  } catch (error) {
    console.error('Records fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
};

export const createRecord = async (req, res) => {
  try {
    const recordData = req.body;

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    // If a base64 image was sent, upload it to Cloudinary
    if (recordData.imageUrl && recordData.imageUrl.startsWith('data:')) {
      const uploadRes = await cloudinary.uploader.upload(recordData.imageUrl, {
        folder: 'aarogya_records'
      });
      recordData.fileData = uploadRes.secure_url; // Save the short URL
    } else {
      recordData.fileData = recordData.imageUrl;
    }

    // Map fields to match MongoDB schema
    const newRecord = new MedicalRecord({
      patientId: recordData.patientAadhaar || recordData.patientId,
      title: recordData.title,
      date: new Date().toISOString(),
      doctorName: recordData.uploaderName || 'Self',
      hospitalName: recordData.uploaderName || 'Self',
      category: recordData.category || 'General',
      uploaderType: recordData.uploaderType || 'PATIENT',
      uploaderId: recordData.uploaderId || 'Self',
      fileData: recordData.fileData
    });

    await newRecord.save();
    
    // Return mapped record with id mapped from _id for frontend compatibility
    const responseRecord = { ...newRecord.toObject(), id: newRecord._id };
    
    res.json({ success: true, message: 'Record saved to MongoDB & Cloudinary!', record: responseRecord });
  } catch (error) {
    console.error('Record save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save record' });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const { requesterId, requesterRole } = req.body;

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Verify Ownership
    if (record.uploaderId !== requesterId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only delete your own records.' });
    }

    // Attempt to delete from Cloudinary if it's a Cloudinary URL
    if (record.fileData && record.fileData.includes('res.cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = record.fileData.split('/');
        const filePart = urlParts[urlParts.length - 1];
        const publicId = filePart.split('.')[0];
        // Note: this assumes the folder structure. Might need to adjust if nested.
        await cloudinary.uploader.destroy(`aarogya_records/${publicId}`);
      } catch (e) {
        console.error('Cloudinary delete error:', e);
      }
    }

    await MedicalRecord.findByIdAndDelete(recordId);
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Record delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete record' });
  }
};
