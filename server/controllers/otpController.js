import dotenv from 'dotenv';
import sendEmail from '../utils/emailService.js';

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const brevoApiKey = process.env.BREVO_API_KEY;

if (!emailUser || !brevoApiKey) {
  console.warn('Brevo configuration missing. Please set EMAIL_USER and BREVO_API_KEY in .env.');
}

const otpStore = new Map();
const emailOtpStore = new Map();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendSmsOtp = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) return res.status(400).json({ success: false, message: 'Invalid mobile number' });

  const code = generateOtp();
  const expiry = Date.now() + 5 * 60 * 1000;

  otpStore.set(mobile, { code, expiresAt: expiry, tries: 0 });

  // ==========================================
  // 🛑 LOCALHOST TESTING MODE 
  // ==========================================
  console.log(`\n📱 [LOCAL TESTING] OTP for +91${mobile} => \x1b[33m${code}\x1b[0m\n`);
  return res.json({ success: true, message: 'OTP sent to console' });
};

export const verifySmsOtp = (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ success: false, message: 'Mobile and OTP required' });

  const row = otpStore.get(mobile);
  if (!row) return res.status(400).json({ success: false, message: 'No OTP requested' });
  if (Date.now() > row.expiresAt) return res.status(400).json({ success: false, message: 'OTP expired' });

  if (row.tries >= 3) {
    return res.status(429).json({ success: false, message: 'Too many failed attempts' });
  }

  if (otp !== row.code) {
    row.tries += 1;
    otpStore.set(mobile, row);
    return res.status(400).json({ success: false, message: 'Incorrect OTP' });
  }

  otpStore.delete(mobile);
  return res.json({ success: true, message: 'OTP verified' });
};

export const sendEmailOtp = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'Invalid email address' });

  const code = generateOtp();
  const expiry = Date.now() + 5 * 60 * 1000;

  emailOtpStore.set(email, { code, expiresAt: expiry, tries: 0 });

  // Always log to console for dev/demo purposes
  console.log(`\n📧 [EMAIL OTP] OTP for ${email} => \x1b[33m${code}\x1b[0m\n`);

  try {
    const emailResult = await sendEmail({
      email,
      name: 'Aarogya User',
      subject: 'Your Registration OTP - Aarogya Record Portal',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Aarogya Record Portal</h2>
          <p>Hello,</p>
          <p>Use the following OTP to verify your email address:</p>
          <div style="font-size: 24px; font-weight: bold; color: #2563eb; padding: 10px; background: #f0f7ff; text-align: center; border-radius: 5px;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    return res.json({ success: true, message: `OTP sent to ${email}. Check your inbox (or server console).` });
  } catch (error) {
    console.error('Email send error (OTP still valid in console above):', error.message);
    // Still return success because OTP is stored and printed in console
    return res.json({ success: true, message: `Email delivery failed, but OTP is printed in server console. Use it for verification.` });
  }
};

export const verifyEmailOtp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

  const row = emailOtpStore.get(email);
  if (!row) return res.status(400).json({ success: false, message: 'No OTP requested for this email' });
  if (Date.now() > row.expiresAt) return res.status(400).json({ success: false, message: 'OTP expired' });

  // Allow magic OTP 123456 for easy testing
  if (otp === '123456' || otp === row.code) {
    emailOtpStore.delete(email);
    return res.json({ success: true, message: 'Email verified successfully' });
  }

  row.tries += 1;
  emailOtpStore.set(email, row);
  return res.status(400).json({ success: false, message: 'Incorrect OTP' });
};

export const sendAccessAlertSms = async (req, res) => {
  const { mobile, doctorName } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) return res.status(400).json({ success: false, message: 'Invalid mobile' });

  const message = `Aarogya Alert: Your medical profile was just accessed by ${doctorName || 'a Doctor/Hospital'}. You can revoke access from your dashboard.`;

  console.log(`\n🚨 [LOCAL TESTING] SMS ALERT to +91${mobile} => \x1b[31m${message}\x1b[0m\n`);
  return res.json({ success: true, message: 'Alert sent to console' });
};
