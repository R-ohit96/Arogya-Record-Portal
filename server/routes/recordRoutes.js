import express from 'express';
import { getRecords, createRecord } from '../controllers/recordController.js';

const router = express.Router();

router.get('/:patientId', getRecords);
router.post('/', createRecord);

export default router;
