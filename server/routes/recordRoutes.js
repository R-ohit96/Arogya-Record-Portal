import express from 'express';
import { getRecords, createRecord, deleteRecord, updateRecord } from '../controllers/recordController.js';

const router = express.Router();

router.get('/:patientId', getRecords);
router.post('/', createRecord);
router.delete('/:id', deleteRecord);
router.put('/:id', updateRecord);

export default router;
