/**
 * Real-Medical-Verify Service (Draft)
 * 
 * Replace placeholders with your actual API provider (Surepass, AuthBridge, Decentro)
 * For now, this service provides a professional structure that can be easily connected.
 */

// Replace these with your actual provider keys
const MEDICAL_API_KEY = 'YOUR_MEDICAL_KYC_KEY_HERE';
const MEDICAL_BASE_URL = 'https://api.yourprovider.com/v1';

/**
 * Verifies a Doctor against the official NMC Registry (National Medical Register).
 * Returns { success, data, message }
 */
export const verifyDoctorRegistry = async (registrationId, state = 'All India') => {
  console.log("SIMULATING NMC Verification for:", registrationId, state);

  // Real Integration Pattern (Draft)
  /*
  const response = await fetch(`${MEDICAL_BASE_URL}/nmc-verify`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MEDICAL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration_no: registrationId, state: state })
  });
  const result = await response.json();
  if (result.success) return { success: true, data: result.data };
  */

  // Simulated Professional Response
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock authorized list for demo
      const registry = {
        "DOC001": { name: "Dr. Arvind Kumar", specialization: "Cardiologist", recordId: "NMC-98211", email: "arvind@hospital.com", mobile: "9876543210" },
        "DOC002": { name: "Dr. Shalini Singh", specialization: "Neurologist", recordId: "NMC-44512", email: "shalini@hospital.com", mobile: "9988776655" },
        "DR_AMIT": { name: "Dr. Amit Shah", specialization: "General Physician", recordId: "NMC-12345", email: "amit.shah@doctor.com", mobile: "9876543210" }
      };

      const record = registry[registrationId.toUpperCase()];
      if (record) {
        resolve({ success: true, data: record, message: 'Medical Practitioner Record Verified!' });
      } else {
        resolve({ success: false, message: 'Invalid Registration ID or Record Not Found in NMC Database.' });
      }
    }, 1200);
  });
};

/**
 * Verifies a Hospital against the Health Facility Registry (HFR).
 */
export const verifyHospitalRegistry = async (hfrId) => {
  console.log("SIMULATING HFR Verification for:", hfrId);

  // Simulated Professional Response
  return new Promise((resolve) => {
    setTimeout(() => {
      const registry = {
        "HOSP001": { name: "City General Hospital", category: "GOVERNMENT", recordId: "HFR-11223", email: "contact@citygen.gov.in", mobile: "9000111222" },
        "HOSP002": { name: "Apollo Specialty Clinic", category: "PRIVATE", recordId: "HFR-44556", email: "info@apollo.com", mobile: "9888777666" },
        "CITY_GEN": { name: "Metro Care Hospital", category: "NGO", recordId: "HFR-77889", email: "metro@care.org", mobile: "9777666555" }
      };

      const record = registry[hfrId.toUpperCase()];
      if (record) {
        resolve({ success: true, data: record, message: 'Health Facility Record Verified!' });
      } else {
        resolve({ success: false, message: 'HFR ID not found in official ABDM Facility Registry.' });
      }
    }, 1200);
  });
};
