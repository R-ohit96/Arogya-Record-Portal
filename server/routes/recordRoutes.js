import express from 'express';
import { getRecords, createRecord, deleteRecord } from '../controllers/recordController.js';

const router = express.Router();

router.get('/:patientId', getRecords);
router.post('/', createRecord);
router.delete('/:id', deleteRecord);

export default router;
