import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { sendEmailOtp, verifyEmailOtp } from '../services/smsService';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('PATIENT');
  const [id, setId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const { getAllUsersForRecovery, resetPassword } = useAuth();

   const handleSendOtp = async () => {
    setError('');
    const allUsers = getAllUsersForRecovery();
    let user;
    if (role === 'PATIENT') user = allUsers.find(u => u.role === 'PATIENT' && u.aadhaarNumber === id);
    else if (role === 'HOSPITAL') user = allUsers.find(u => (u.role === 'HOSPITAL' || u.role === 'STAFF') && u.id === id);
    else user = allUsers.find(u => u.role === 'DOCTOR' && (u.id === id || u.email === id));

    if (!user) {
      setError(`No registered ${role.toLowerCase()} found with this ID.`);
      return;
    }

    if (!user.email) {
      setError('No email address associated with this account. Please contact support.');
      return;
    }

    const result = await sendEmailOtp(user.email);
    if (result.success) {
      setOtpSent(true);
      setMessage(`Real Recovery Code sent to your registered email: ${user.email}`);
      setTimeout(() => setMessage(''), 5000);
    } else {
      setError(result.message || 'Failed to send recovery email.');
    }
  };

   const handleVerifyOtp = async () => {
    setError('');
    const allUsers = getAllUsersForRecovery();
    let user;
    if (role === 'PATIENT') user = allUsers.find(u => u.role === 'PATIENT' && u.aadhaarNumber === id);
    else if (role === 'HOSPITAL') user = allUsers.find(u => (u.role === 'HOSPITAL' || u.role === 'STAFF') && u.id === id);
    else user = allUsers.find(u => u.role === 'DOCTOR' && (u.id === id || u.email === id));

    if (!user || !user.email) return;

    const result = await verifyEmailOtp(user.email, enteredOtp);
    if (result.success) {
      setIsVerified(true);
      setStep(2);
    } else {
      setError(result.message || 'Invalid verification code.');
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const response = resetPassword(role, id, newPassword);
    if (response.success) {
      setMessage(response.message);
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(response.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)' }}>
      <div className="card" style={{ maxWidth: '450px', width: '90%', padding: '2.5rem' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={() => navigate('/')} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '5px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Login
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Aarogya Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem', borderRadius: '16px' }} />
          <h1 style={{ marginTop: '0.5rem', fontSize: '1.8rem' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-muted)' }}>Securely recover your account access</p>
        </div>

        {error && <div style={{ color: 'white', background: 'var(--danger-color)', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}
        {message && <div style={{ color: 'white', background: 'var(--success-color)', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{message}</div>}

        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Select Role</label>
              <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="HOSPITAL">Hospital</option>
              </select>
            </div>

             <div className="form-group">
               <label className="form-label">{role === 'PATIENT' ? 'Aadhaar Number' : 'Staff ID'}</label>
               <input 
                 type="text" 
                 className="form-control" 
                 placeholder={role === 'PATIENT' ? '12-digit Aadhaar' : 'Your Registration ID'}
                 value={id}
                 onChange={(e) => {
                   let val = e.target.value;
                   if (role === 'PATIENT') val = val.replace(/\D/g, '').substring(0, 12);
                   else val = val.substring(0, 30);
                   setId(val);
                 }}
                 maxLength={role === 'PATIENT' ? 12 : 30}
                 disabled={otpSent}
                 required
               />
             </div>

            {otpSent && !isVerified && (
              <div className="form-group" style={{ background: '#f0f7ff', padding: '1rem', borderRadius: '8px', border: '1px solid #cce3ff' }}>
                <label className="form-label">Verification Code (Sent to Mobile)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="4 or 6-digit Code"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    maxLength={6}
                  />
                  <button onClick={handleVerifyOtp} className="btn btn-primary" disabled={enteredOtp.length !== 4 && enteredOtp.length !== 6}>Verify</button>
                </div>
              </div>
            )}

            {!otpSent && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={handleSendOtp}
                disabled={!id}
              >
                Send Recovery Code
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#e6fffa', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #b2f5ea', color: '#2c7a7b' }}>
              <CheckCircle2 size={32} style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600 }}>Identity Verified!</p>
              <p style={{ fontSize: '0.85rem' }}>Please set your new password below.</p>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control" 
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control" 
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
