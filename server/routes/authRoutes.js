import express from 'express';
import {
  registerUser,
  createStaff,
  getStaffList,
  removeStaff,
  loginUser,
  requestPasswordReset,
  confirmPasswordReset,
  uploadProfilePic,
  removeProfilePic,
  updateUserProfile
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/staff/create', createStaff);
router.get('/staff/list/:parentId', getStaffList);
router.delete('/staff/:id', removeStaff);
router.post('/login', loginUser);
router.post('/request-reset', requestPasswordReset);
router.post('/confirm-reset', confirmPasswordReset);

// Profile picture (Cloudinary)
router.post('/profile-pic', uploadProfilePic);
router.post('/remove-profile-pic', removeProfilePic);

// General profile update
router.put('/profile', updateUserProfile);

export default router;
