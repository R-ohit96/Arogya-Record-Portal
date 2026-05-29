const BASE_URL = '/api/sandbox';
const API_KEY = 'key_live_46de981421534d83a255ecaf65798b5c';
const API_SECRET = 'secret_live_a98e6f973b27490a942785680be7f7ed';

/**
 * Gets the temporary JWT access token from Sandbox.
 */
// eslint-disable-next-line no-unused-vars
const getAccessToken = async () => {
  // Mocked for now to avoid CORS errors on Localhost
  return "mock_token";
};

/**
 * Generates an Aadhaar OTP for the given number.
 */
export const generateAadhaarOTP = async (aadhaarNumber) => {
  console.log("SIMULATING Aadhaar OTP for:", aadhaarNumber);
  // Real API Logic (Commented for later)
  /*
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/kyc/aadhaar/okyc/otp`, { ... });
  */
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        referenceId: "REF_" + Math.random().toString(36).substring(7),
        message: 'SIMULATED: Govt OTP Sent to linked mobile!'
      });
    }, 1000);
  });
};

/**
 * Verifies the Aadhaar OTP and returns mock identity data.
 */
export const verifyAadhaarOTP = async (referenceId, otp) => {
  console.log("SIMULATING Aadhaar Verify for:", referenceId, otp);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (otp === '123456') {
        resolve({
          success: true,
          identity: {
            name: "Rahul Sharma (Verified)",
            gender: "M",
            dob: "1995-08-15",
            address: "H-24, Sector 15, Dwarka, New Delhi"
          }
        });
      } else {
        resolve({ success: false, message: 'Invalid OTP. Please use 123456 for Testing.' });
      }
    }, 1000);
  });
};
