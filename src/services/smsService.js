// ============================================================
// 🛑 LOCALHOST / DEV MODE — Zero server, Zero Twilio cost
//
// OTP is generated in-browser and shown on screen.
// User just copies & enters it. No backend needed.
//
// 🟢 WAPAS TWILIO SE OTP LENE KE LIYE (Production):
//   1. Niche wali saari file replace kar do with the
//      original API-based version (fetch to localhost:4000).
//   2. `node twilio-server.js` se backend start karo.
//   3. twilio-server.js me se console.log wali 2 lines hata do
//      aur Twilio try/catch block ko uncomment kar do.
// ============================================================

// In-memory store  { mobile -> { code, expiresAt } }
const _smsOtpStore = new Map();
const _emailOtpStore = new Map();

const _generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── SMS OTP "" THIS IS FOR LOCALHOST"" ──────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:4000' : '');

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
/*  "THIS IS FOR TEILLO REAL OTP ""

export const sendSmsOtp = async (mobile) => {
  if (!mobile || mobile.length !== 10) {
    return { success: false, message: 'Valid 10-digit mobile required.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/send-sms-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile })
    });
    
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || 'OTP sent via Twilio.'
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, message: 'Failed to connect to Twilio server.' };
  }
};

export const verifySmsOtp = async (mobile, otp) => {
  if (!mobile || !otp) return { success: false, message: 'Missing data.' };

  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-sms-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });
    
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();

    return { 
      success: data.success, 
      message: data.message || (data.success ? 'Mobile verified successfully!' : 'Verification failed.') 
    };
  } catch (error) {
    console.error('Error verifying SMS OTP:', error);
    return { success: false, message: 'Failed to verify with server.' };
  }
};

*/
// ── EMAIL OTP (REAL) ──────────────────────────────────────────

export const sendEmailOtp = async (email) => {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Valid email address required.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      success: data.success,
      message: data.message || 'OTP sent to your email.'
    };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    return { success: false, message: 'Failed to contact server.' };
  }
};

export const verifyEmailOtp = async (email, otp) => {
  if (!email || !otp) return { success: false, message: 'Missing data.' };

  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      success: data.success,
      message: data.message || (data.success ? 'Email verified!' : 'Verification failed.')
    };
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return { success: false, message: 'Failed to contact server.' };
  }
};
