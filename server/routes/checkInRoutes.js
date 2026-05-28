import express from 'express';
import { checkIn, pollCheckIn, completeCheckIn } from '../controllers/checkInController.js';

const router = express.Router();

router.post('/', checkIn);
router.get('/poll/:doctorId', pollCheckIn);
router.post('/complete', completeCheckIn);

export default router;
