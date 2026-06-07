import axios from 'axios';

// In-memory store  { mobile -> { code, expiresAt } }
const _smsOtpStore = new Map();
const _emailOtpStore = new Map();

const _generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── SMS OTP "" THIS IS FOR LOCALHOST"" ──────────────────────────────────────────────────

const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
let API_BASE_URL = isLocalDev ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') : '/api';
if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);
if (!API_BASE_URL.endsWith('/api') && !isLocalDev) API_BASE_URL += '/api';

export const sendSmsOtp = async (mobile) => {
  if (!mobile || mobile.length !== 10) {
    return { success: false, message: 'Valid 10-digit mobile required.' };
  }

  const code = _generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  _smsOtpStore.set(mobile, { code, expiresAt });

  console.log(`📱 [LOCAL DEV] SMS OTP for ${mobile} => ${code}`);

  // OTP is returned in the response so UI can show it directly
  return {
    success: true,
    message: `[Dev Mode] Your Mobile OTP is: ${code}`,
    devOtp: code,
  };
};

export const verifySmsOtp = async (mobile, otp) => {
  if (!mobile || !otp) return { success: false, message: 'Missing data.' };

  const entry = _smsOtpStore.get(mobile);
  if (!entry) return { success: false, message: 'OTP not sent yet. Click Send OTP first.' };
  if (Date.now() > entry.expiresAt) {
    _smsOtpStore.delete(mobile);
    return { success: false, message: 'OTP expired. Please request a new one.' };
  }
  if (otp !== entry.code) {
    return { success: false, message: 'Incorrect OTP. Please try again.' };
  }

  _smsOtpStore.delete(mobile);
  return { success: true, message: 'Mobile verified successfully!' };
};

// ── EMAIL OTP (REAL) ──────────────────────────────────────────

export const sendEmailOtp = async (email) => {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Valid email address required.' };
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/send-email-otp`, { email });
    const data = response.data;

    return {
      success: data.success,
      message: data.message || 'OTP sent to your email.'
    };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message || 'Failed to send OTP.' };
    }
    return { success: false, message: 'Failed to contact server. Please check your connection.' };
  }
};

export const verifyEmailOtp = async (email, otp) => {
  if (!email || !otp) return { success: false, message: 'Missing data.' };

  try {
    const response = await axios.post(`${API_BASE_URL}/verify-email-otp`, { email, otp });
    const data = response.data;

    return {
      success: data.success,
      message: data.message || (data.success ? 'Email verified!' : 'Verification failed.')
    };
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    if (error.response && error.response.data) {
      return { success: false, message: error.response.data.message || 'Verification failed.' };
    }
    return { success: false, message: 'Failed to contact server.' };
  }
};
