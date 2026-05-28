import express from 'express';
import { createAccessLog, getPatientAccessLogs, revokeAccessLog, closeAccessLog, checkAccessValidity } from '../controllers/accessLogController.js';

const router = express.Router();

router.post('/', createAccessLog);                    // POST /api/access-logs
router.get('/patient/:aadhaar', getPatientAccessLogs); // GET  /api/access-logs/patient/:aadhaar
router.put('/revoke/:logId', revokeAccessLog);         // PUT  /api/access-logs/revoke/:logId
router.post('/close', closeAccessLog);                 // POST /api/access-logs/close
router.get('/check', checkAccessValidity);             // GET  /api/access-logs/check?patientAadhaar=...&doctorId=...

export default router;
