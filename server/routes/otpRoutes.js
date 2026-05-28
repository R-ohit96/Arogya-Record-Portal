import express from 'express';
import { sendSmsOtp, verifySmsOtp, sendEmailOtp, verifyEmailOtp, sendAccessAlertSms } from '../controllers/otpController.js';

const router = express.Router();

router.post('/send-sms-otp', sendSmsOtp);
router.post('/verify-sms-otp', verifySmsOtp);
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/send-access-alert-sms', sendAccessAlertSms);

export default router;
