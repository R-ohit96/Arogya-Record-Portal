import express from 'express';
import { registerUser, createStaff, getStaffList, removeStaff, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/staff/create', createStaff);
router.get('/staff/list/:parentId', getStaffList);
router.delete('/staff/:id', removeStaff);
router.post('/login', loginUser);

export default router;
