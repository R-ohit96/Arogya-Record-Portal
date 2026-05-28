import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserRound, Stethoscope, Building2, Smartphone, ShieldCheck, Eye, EyeOff, BadgeCheck } from 'lucide-react';
import { generateAadhaarOTP, verifyAadhaarOTP } from '../services/sandboxService';
import { verifyDoctorRegistry, verifyHospitalRegistry } from '../services/medicalVerifyService';
import { sendSmsOtp, verifySmsOtp, sendEmailOtp, verifyEmailOtp } from '../services/smsService';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const [role, setRole] = useState(null);
  const { t, lang, toggleLanguage } = useLanguage();


  const [isVerifying, setIsVerifying] = useState(false);
  const [aadhaar, setAadhaar] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [localAddress, setLocalAddress] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpExpiry, setEmailOtpExpiry] = useState(null);
  const [emailEnteredOtp, setEmailEnteredOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [hospitalId, setHospitalId] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalCategory, setHospitalCategory] = useState('NONE');
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialization, setDoctorSpecialization] = useState('');

  // Aadhaar eKYC states
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [aadhaarEnteredOtp, setAadhaarEnteredOtp] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);

  // Registry Verification States
  const [isDocVerified, setIsDocVerified] = useState(false);
  const [isHospVerified, setIsHospVerified] = useState(false);
  const [isVerifyingRegistry, setIsVerifyingRegistry] = useState(false);

  const [gender, setGender] = useState('');

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { registerPatient, registerHospital, registerDoctor } = useAuth();

  const handleSendAadhaarOtp = async () => {
    if (aadhaar.length !== 12) {
      alert('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setIsVerifying(true);
    const result = await generateAadhaarOTP(aadhaar);
    setIsVerifying(false);

    if (result.success) {
      setAadhaarRefId(result.referenceId);
      setAadhaarOtpSent(true);
      alert('Official Aadhaar OTP sent to your linked mobile! (Sandbox Test Mode: Enter 123456)');
    } else {
      alert(result.message);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    setIsVerifying(true);
    const result = await verifyAadhaarOTP(aadhaarRefId, aadhaarEnteredOtp);
    setIsVerifying(false);

    if (result.success) {
      setIsAadhaarVerified(true);
      setPatientName(result.identity.name);
      // Set address from Aadhaar identity
      setAddress(result.identity.address || '');
      if (result.identity.dob) {
        setDob(result.identity.dob);
        const birthYear = parseInt(result.identity.dob.split('-')[0]);
        setAge(new Date().getFullYear() - birthYear);
      }
      if (result.identity.gender) {
        setGender(result.identity.gender === 'M' ? 'Male' : 'Female');
      }
      setIsSuccess(true);
      setMessage('Aadhaar Identity Verified Successfully!');
      setTimeout(() => { setMessage(''); setIsSuccess(false); }, 3000);
    } else {
      alert(result.message);
    }
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    const result = await sendSmsOtp(mobile);
    if (result.success) {
      setOtpSent(true);
      setOtpExpiry(Date.now() + 5 * 60 * 1000);//alert('OTP sent to your mobile via Twilio!');

      alert(`Real OTP sent via Twilio; (Sandbox Test Mode: Enter ${result.devOtp})`);
      setIsSuccess(true);
    } else {
      alert(result.message || 'OTP send failed.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpExpiry || Date.now() > otpExpiry) {
      alert('OTP expired. Please request a new code.');
      setOtpSent(false);
      return;
    }

    const result = await verifySmsOtp(mobile, enteredOtp);
    if (result.success) {
      setIsOtpVerified(true);
      setIsSuccess(true);
      setMessage('Mobile number verified successfully!');
      setTimeout(() => { setMessage(''); setIsSuccess(false); }, 3000);
    } else {
      alert(result.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleSendEmailOtp = async () => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      alert('Please enter a valid email address to receive OTP.');
      return;
    }

    setIsVerifying(true);
    const result = await sendEmailOtp(email);
    setIsVerifying(false);

    if (result.success) {
      setEmailOtpSent(true);
      setEmailOtpExpiry(Date.now() + 5 * 60 * 1000);
      setIsEmailVerified(false);
      alert(result.message || 'OTP sent to your email address! (Test Mode: Enter 123456)');
      setIsSuccess(true);
    } else {
      alert(result.message || 'Email OTP send failed.');
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpExpiry || Date.now() > emailOtpExpiry) {
      alert('Email OTP expired. Please request a new code.');
      setEmailOtpSent(false);
      return;
    }

    setIsVerifying(true);
    const result = await verifyEmailOtp(email, emailEnteredOtp);
    setIsVerifying(false);

    if (result.success) {
      setIsEmailVerified(true);
      setIsSuccess(true);
      setMessage('Email verified successfully!');
      setTimeout(() => { setMessage(''); setIsSuccess(false); }, 3000);
    } else {
      alert(result.message || 'Invalid Email OTP. Please try again.');
    }
  };

  const handleVerifyDoctorReg = async () => {
    if (!doctorId) return alert('Please enter Registration ID.');
    setIsVerifyingRegistry(true);
    const result = await verifyDoctorRegistry(doctorId);
    setIsVerifyingRegistry(false);
    if (result.success) {
      setDoctorName(result.data.name);
      setDoctorSpecialization(result.data.specialization || '');
      // Auto-prefill contact details from registry if available
      if (result.data.email) setEmail(result.data.email);
      if (result.data.mobile) setMobile(result.data.mobile);

      setIsDocVerified(true);
      setIsSuccess(true);
      setMessage(result.message);
      setTimeout(() => { setMessage(''); setIsSuccess(false); }, 4000);
    } else {
      alert(result.message);
    }
  };

  const handleVerifyHospitalReg = async () => {
    if (!hospitalId) return alert('Please enter Hospital HFR ID.');
    setIsVerifyingRegistry(true);
    const result = await verifyHospitalRegistry(hospitalId);
    setIsVerifyingRegistry(false);
    if (result.success) {
      setHospitalName(result.data.name);
      setHospitalCategory(result.data.category || 'PRIVATE');
      // Auto-prefill contact details from registry if available
      if (result.data.email) setEmail(result.data.email);
      if (result.data.mobile) setMobile(result.data.mobile);

      setIsHospVerified(true);
      setIsSuccess(true);
      setMessage(result.message);
      setTimeout(() => { setMessage(''); setIsSuccess(false); }, 4000);
    } else {
      alert(result.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isVerifying) return; // Prevent submission while verifying
    if (role === 'PATIENT' && !isOtpVerified) {
      setMessage('Please verify your mobile number with OTP first.');
      return;
    }
    setMessage('');
    setIsSuccess(false);

    // Email validation for all roles
    if (!email || !email.includes('@') || !email.includes('.')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    let response;

    if (role === 'PATIENT') {
      if (aadhaar.length !== 12) {
        setMessage('Aadhaar must be 12 digits.');
        return;
      }
      if (!isAadhaarVerified || !isOtpVerified || !isEmailVerified || !password) {
        setMessage('Please Verify Aadhaar, Mobile, and Email identity before setting a password.');
        return;
      }
      if (password.length < 8) {
        setMessage('Password must be at least 8 characters long.');
        return;
      }
      response = await registerPatient(aadhaar, patientName, mobile, gender, age, password, alternateMobile, email, address, dob, localAddress);

    } else if (role === 'HOSPITAL') {
      if (!isHospVerified) {
        setMessage('Please verify Hospital Registry ID first.');
        return;
      }
      if (!isOtpVerified || !password) {
        setMessage('Please verify mobile and set a password.');
        return;
      }
      if (!isEmailVerified) {
        setMessage('Please verify hospital email address before registration.');
        return;
      }
      if (password.length < 8) {
        setMessage('Password must be at least 8 characters long.');
        return;
      }
      response = await registerHospital(hospitalId, hospitalName, password, mobile, alternateMobile, email, hospitalCategory);

    } else if (role === 'DOCTOR') {
      if (!isDocVerified) {
        setMessage('Please verify Doctor NMC Registration first.');
        return;
      }
      if (!isOtpVerified || !password) {
        setMessage('Please verify mobile and set a password.');
        return;
      }
      if (!isEmailVerified) {
        setMessage('Please verify doctor email address before registration.');
        return;
      }
      if (password.length < 8) {
        setMessage('Password must be at least 8 characters long.');
        return;
      }
      response = await registerDoctor(doctorId, doctorName, password, mobile, alternateMobile, email, doctorSpecialization);
    }

    if (response) {
      setMessage(response.message);
      setIsSuccess(response.success);
      if (response.success) {
        setTimeout(() => navigate('/'), 2000);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-gradient)' }}>
      <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '2.5rem' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={toggleLanguage}
            style={{ padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, color: 'var(--primary-color)' }}
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Aarogya Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem', borderRadius: '16px' }} />
          <h1 style={{ marginTop: '0.5rem', fontSize: '1.8rem' }}>{t('create_account')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('registration_desc')}</p>
        </div>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '1.5rem', background: '#f5f5f5', padding: '5px', borderRadius: '8px' }}>
          <button
            type="button"
            className={`btn ${role === 'PATIENT' ? 'btn-primary' : ''}`}
            style={{ flex: 1, padding: '0.5rem', color: role === 'PATIENT' ? 'white' : 'var(--text-muted)', background: role === 'PATIENT' ? 'var(--primary-color)' : 'transparent', border: 'none' }}
            onClick={() => {
              setRole('PATIENT'); setMessage(''); setAadhaar(''); setPatientName(''); setGender('');
              setOtpSent(false); setIsOtpVerified(false);
              setEmailOtpSent(false); setIsEmailVerified(false); setEmailEnteredOtp('');
            }}
          >
            <UserRound size={16} /> {t('patient')}
          </button>
          <button
            type="button"
            className={`btn ${role === 'HOSPITAL' ? 'btn-primary' : ''}`}
            style={{ flex: 1, padding: '0.5rem', color: role === 'HOSPITAL' ? 'white' : 'var(--text-muted)', background: role === 'HOSPITAL' ? 'var(--primary-color)' : 'transparent', border: 'none' }}
            onClick={() => {
              setRole('HOSPITAL'); setMessage(''); setIsEmailVerified(false); setEmailOtpSent(false); setEmailEnteredOtp('');
            }}
          >
            <Building2 size={16} /> {t('hospital')}
          </button>
          <button
            type="button"
            className={`btn ${role === 'DOCTOR' ? 'btn-primary' : ''}`}
            style={{ flex: 1, padding: '0.5rem', color: role === 'DOCTOR' ? 'white' : 'var(--text-muted)', background: role === 'DOCTOR' ? 'var(--primary-color)' : 'transparent', border: 'none' }}
            onClick={() => {
              setRole('DOCTOR'); setMessage(''); setIsEmailVerified(false); setEmailOtpSent(false); setEmailEnteredOtp('');
            }}
          >
            <Stethoscope size={16} /> {t('doctor')}
          </button>
        </div>

        {message && (
          <div style={{ color: 'white', background: isSuccess ? 'var(--success-color)' : 'var(--danger-color)', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {!role && (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem', background: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>{t('select_role')}</p>
            </div>
          )}
          {role === 'PATIENT' && (
            <>
              <div className="form-group">
                <label className="form-label">{t('aadhaar_number')}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0000 0000 0000"
                    value={aadhaar}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 12);
                      setAadhaar(val);
                      if (val.length < 12) { setIsAadhaarVerified(false); setAadhaarOtpSent(false); }
                    }}
                    maxLength={12}
                    disabled={isAadhaarVerified}
                    required
                  />
                  {!isAadhaarVerified && !aadhaarOtpSent && (
                    <button type="button" className="btn btn-outline" onClick={handleSendAadhaarOtp} disabled={aadhaar.length !== 12 || isVerifying}>
                      {isVerifying ? 'Sending...' : t('verify_identity')}
                    </button>
                  )}
                </div>
              </div>

              {aadhaarOtpSent && !isAadhaarVerified && (
                <div className="form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', animation: 'fadeIn 0.3s' }}>
                  <label className="form-label" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <ShieldCheck size={16} /> Enter OTP
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter OTP"
                      value={aadhaarEnteredOtp}
                      onChange={(e) => setAadhaarEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength={6}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleVerifyAadhaarOtp} disabled={(aadhaarEnteredOtp.length !== 4 && aadhaarEnteredOtp.length !== 6) || isVerifying}>
                      {isVerifying ? 'Verifying...' : t('confirm')}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>OTP has been sent to your Aadhaar-linked phone.</p>
                </div>
              )}

              {isAadhaarVerified && (
                <>
                  <div className="form-group">
                    <label className="form-label">{t('name')} ({t('verified_user')})</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ background: '#f8fafc', fontWeight: 'bold', color: 'var(--success-color)' }}
                        value={patientName}
                        readOnly
                      />
                      <ShieldCheck size={20} color="var(--success-color)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Official Age (Fetched from Aadhaar)</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ background: '#f8fafc', fontWeight: 'bold' }}
                      value={age}
                      readOnly
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">{t('gender')}</label>
                <div style={{ display: 'flex', gap: '20px', padding: '0.5rem 0' }}>
                  {['male', 'female', 'other'].map(g => (
                    <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender.toLowerCase() === g}
                        onChange={(e) => setGender(e.target.value)}
                        required
                      />
                      {t(g)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    maxLength={10}
                    required
                  />
                  {!isOtpVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleSendOtp} disabled={mobile.length !== 10 || isVerifying}>
                      {isVerifying ? 'Sending...' : (otpSent ? t('resend') : t('send_otp'))}
                    </button>
                  )}
                </div>
                {isOtpVerified && <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: '4px' }}>✓ Mobile Verified</p>}
                {otpSent && !isOtpVerified && (
                  <div className="form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', animation: 'fadeIn 0.3s' }}>
                    <label className="form-label" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <ShieldCheck size={16} /> Enter OTP
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        maxLength={6}
                      />
                      <button type="button" className="btn btn-primary" onClick={handleVerifyOtp} disabled={(enteredOtp.length !== 4 && enteredOtp.length !== 6) || isVerifying}>
                        {isVerifying ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">{t('email')}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsEmailVerified(false);
                      setEmailOtpSent(false);
                    }}
                    required
                  />
                  {!isEmailVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleSendEmailOtp} disabled={!email || !email.includes('@') || !email.includes('.') || isVerifying}>
                      {isVerifying ? 'Sending...' : 'Send Email OTP'}
                    </button>
                  )}
                </div>
                {isEmailVerified && <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: '4px' }}>✓ Email Verified</p>}
              </div>

              {emailOtpSent && !isEmailVerified && (
                <div className="form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', animation: 'fadeIn 0.3s' }}>
                  <label className="form-label" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <ShieldCheck size={16} /> Enter OTP
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter OTP"
                      value={emailEnteredOtp}
                      onChange={(e) => setEmailEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength={6}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleVerifyEmailOtp} disabled={(emailEnteredOtp.length !== 4 && emailEnteredOtp.length !== 6) || isVerifying}>
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={isVerifying}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      {isVerifying ? 'Sending...' : 'Resend Email OTP'}
                    </button>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">{t('alt_mobile')} ({t('optional')})</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="9876XXXXXX"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  maxLength={10}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Local Address / Current Residence ({t('optional')})</label>
                <textarea
                  className="form-control"
                  placeholder="Enter your current residential address"
                  value={localAddress}
                  onChange={(e) => setLocalAddress(e.target.value)}
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {role === 'HOSPITAL' && (
            <>
              <div className="form-group">
                <label className="form-label">{t('hospital_id')} <a href="https://hfr.abdm.gov.in/" target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', marginLeft: '8px', color: 'var(--primary-color)' }}>(Find HFR ID)</a></label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ID (e.g., HOSP001)"
                    value={hospitalId}
                    onChange={(e) => { setHospitalId(e.target.value); setIsHospVerified(false); }}
                    disabled={isHospVerified}
                    required
                    style={{
                      background: isHospVerified ? '#ecfdf5' : 'white',
                      borderColor: isHospVerified ? '#10b981' : 'var(--border-color)',
                      color: isHospVerified ? '#065f46' : 'inherit',
                      fontWeight: isHospVerified ? 700 : 400
                    }}
                  />
                  {!isHospVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleVerifyHospitalReg} disabled={!hospitalId || isVerifyingRegistry}>
                      {isVerifyingRegistry ? 'Verifying...' : 'Verify Registry'}
                    </button>
                  )}
                </div>
              </div>
              {isHospVerified && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #d1fae5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>Facility Type: {hospitalCategory}</span>
                  <BadgeCheck size={16} color="#059669" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Hospital Name (As per Registry)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Auto-fetched Name"
                    value={hospitalName}
                    style={{ background: isHospVerified ? '#f8fafc' : 'white', fontWeight: isHospVerified ? 'bold' : 'normal' }}
                    readOnly={isHospVerified}
                    required
                  />
                  {isHospVerified && <BadgeCheck size={20} color="var(--success-color)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hospital Contact Mobile</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="10-digit Mobile"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, '').substring(0, 10));
                      setIsOtpVerified(false); setOtpSent(false);
                    }}
                    maxLength={10}
                    disabled={isOtpVerified}
                    required
                  />
                  {!otpSent && !isOtpVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleSendOtp} disabled={mobile.length !== 10 || !isHospVerified || isVerifying}>
                      {isVerifying ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                  {isOtpVerified && <span style={{ color: 'var(--success-color)', alignSelf: 'center', fontWeight: 600 }}>✓ Verified</span>}
                </div>
              </div>

              {otpSent && !isOtpVerified && (
                <div className="form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', animation: 'fadeIn 0.3s' }}>
                  <label className="form-label" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <ShieldCheck size={16} /> Enter OTP
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength={6}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleVerifyOtp} disabled={(enteredOtp.length !== 4 && enteredOtp.length !== 6) || isVerifying}>
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isVerifying}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      {isVerifying ? 'Sending...' : 'Resend Mobile OTP'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Hospital Email Address</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="admin@hospital.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsEmailVerified(false);
                      setEmailOtpSent(false);
                    }}
                    required
                  />
                  {!isEmailVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleSendEmailOtp} disabled={!email || !email.includes('@') || !email.includes('.') || isVerifying}>
                      {isVerifying ? 'Sending...' : 'Send Email OTP'}
                    </button>
                  )}
                </div>
                {isEmailVerified && <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: '4px' }}>✓ Email Verified</p>}
              </div>

              {emailOtpSent && !isEmailVerified && (
                <div className="form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', animation: 'fadeIn 0.3s' }}>
                  <label className="form-label" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <ShieldCheck size={16} /> Enter OTP
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter OTP"
                      value={emailEnteredOtp}
                      onChange={(e) => setEmailEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength={6}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleVerifyEmailOtp} disabled={(emailEnteredOtp.length !== 4 && emailEnteredOtp.length !== 6) || isVerifying}>
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={isVerifying}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      {isVerifying ? 'Sending...' : 'Resend Email OTP'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Alternate Hospital Mobile (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Official alternate contact"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {role === 'DOCTOR' && (
            <>
              <div className="form-group">
                <label className="form-label">{t('doctor_id')}</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ID (e.g., DOC001)"
                    value={doctorId}
                    onChange={(e) => { setDoctorId(e.target.value); setIsDocVerified(false); }}
                    disabled={isDocVerified}
                    required
                    style={{
                      background: isDocVerified ? '#ecfdf5' : 'white',
                      borderColor: isDocVerified ? '#10b981' : 'var(--border-color)',
                      color: isDocVerified ? '#065f46' : 'inherit',
                      fontWeight: isDocVerified ? 700 : 400
                    }}
                  />
                  {!isDocVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleVerifyDoctorReg} disabled={!doctorId || isVerifyingRegistry}>
                      {isVerifyingRegistry ? 'Verifying...' : 'Verify NMC'}
                    </button>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Doctor Name (As per NMC Registry)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Auto-fetched Name"
                    value={doctorName}
                    style={{ background: isDocVerified ? '#f8fafc' : 'white', fontWeight: isDocVerified ? 'bold' : 'normal' }}
                    readOnly={isDocVerified}
                    required
                  />
                  {isDocVerified && <BadgeCheck size={20} color="var(--success-color)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Specialization (As per NMC Registry)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Auto-fetched Specialization"
                    value={doctorSpecialization}
                    style={{ background: isDocVerified ? '#f8fafc' : 'white', fontWeight: isDocVerified ? 'bold' : 'normal' }}
                    readOnly={isDocVerified}
                    required
                  />
                  {isDocVerified && <BadgeCheck size={20} color="var(--success-color)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Verified Mobile Number</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="10-digit Mobile"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, '').substring(0, 10));
                      setIsOtpVerified(false); setOtpSent(false);
                    }}
                    maxLength={10}
                    disabled={isOtpVerified}
                    required
                  />
                  {!otpSent && !isOtpVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleSendOtp} disabled={mobile.length !== 10 || !isDocVerified || isVerifying}>
                      {isVerifying ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                  {isOtpVerified && <span style={{ color: 'var(--success-color)', alignSelf: 'center', fontWeight: 600 }}>✓ Verified</span>}
                </div>
              </div>

              {otpSent && !isOtpVerified && (
                <div className="form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', animation: 'fadeIn 0.3s' }}>
                  <label className="form-label" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <ShieldCheck size={16} /> Enter OTP
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength={6}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleVerifyOtp} disabled={(enteredOtp.length !== 4 && enteredOtp.length !== 6) || isVerifying}>
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isVerifying}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      {isVerifying ? 'Sending...' : 'Resend Mobile OTP'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Doctor Email Address</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="doctor@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsEmailVerified(false);
                      setEmailOtpSent(false);
                    }}
                    required
                  />
                  {!isEmailVerified && (
                    <button type="button" className="btn btn-outline" onClick={handleSendEmailOtp} disabled={!email || !email.includes('@') || !email.includes('.') || isVerifying}>
                      {isVerifying ? 'Sending...' : 'Send Email OTP'}
                    </button>
                  )}
                </div>
                {isEmailVerified && <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: '4px' }}>✓ Email Verified</p>}
              </div>

              {emailOtpSent && !isEmailVerified && (
                <div className="form-group" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd', animation: 'fadeIn 0.3s' }}>
                  <label className="form-label" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <ShieldCheck size={16} /> Enter OTP
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter OTP"
                      value={emailEnteredOtp}
                      onChange={(e) => setEmailEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      maxLength={6}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleVerifyEmailOtp} disabled={(emailEnteredOtp.length !== 4 && emailEnteredOtp.length !== 6) || isVerifying}>
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={isVerifying}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      {isVerifying ? 'Sending...' : 'Resend Email OTP'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Alternate Doctor Mobile (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Doctor's personal/secondary"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {role && (
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1.05rem', marginTop: '1rem' }} disabled={isVerifying}>
              {isVerifying ? 'Processing...' : 'Register'}
            </button>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Login Here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
