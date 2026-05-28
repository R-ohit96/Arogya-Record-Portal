import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Camera, ArrowLeft, ShieldCheck, Mail, Phone, Calendar, MapPin, Building2, Stethoscope, LogOut, BadgeCheck, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import EmergencyQR from '../components/EmergencyQR';
import ClinicQR from '../components/ClinicQR';
import { sendSmsOtp, verifySmsOtp } from '../services/smsService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const MyProfile = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [altMobile, setAltMobile] = useState(currentUser?.alternateMobile || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [bloodGroup, setBloodGroup] = useState(currentUser?.bloodGroup || '');
  const [localAddr, setLocalAddr] = useState(currentUser?.localAddress || '');
  const [message, setMessage] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  
  // OTP Flow States
  const [isChangingMobile, setIsChangingMobile] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  
  const { t } = useLanguage();

  // Re-sync if currentUser changes (e.g., from other sources)
  React.useEffect(() => {
    setAltMobile(currentUser?.alternateMobile || '');
    setEmail(currentUser?.email || '');
    setBloodGroup(currentUser?.bloodGroup || '');
    setLocalAddr(currentUser?.localAddress || '');
  }, [currentUser]);

  const isDirty = 
    altMobile !== (currentUser?.alternateMobile || '') ||
    email !== (currentUser?.email || '') ||
    bloodGroup !== (currentUser?.bloodGroup || '') ||
    localAddr !== (currentUser?.localAddress || '');

  const handleCancel = () => {
    setAltMobile(currentUser?.alternateMobile || '');
    setEmail(currentUser?.email || '');
    setBloodGroup(currentUser?.bloodGroup || '');
    setLocalAddr(currentUser?.localAddress || '');
  };

  const handleGlobalSave = async () => {
    const updatedData = {
      alternateMobile: altMobile,
      email: email,
      bloodGroup: bloodGroup,
      localAddress: localAddr
    };
    
    try {
      const result = await updateProfile(updatedData);
      if (result && result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result?.message || 'Failed to update profile.' });
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: `Save error: ${err.message || 'Unknown error'}` });
      console.error("Save process error:", err);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate)) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please login to view your profile.</p>
        <Link to="/">Login</Link>
      </div>
    );
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const response = await updateProfile({ profilePic: reader.result });
        if (response && response.success) {
          setMessage({ type: 'success', text: 'Profile picture updated!' });
        } else {
          setMessage({ type: 'error', text: 'Failed to update profile picture (possibly too large).' });
        }
        setTimeout(() => setMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = async () => {
    setShowPhotoMenu(false);
    const response = await updateProfile({ profilePic: null });
    if (response && response.success) {
      setMessage({ type: 'success', text: 'Profile picture removed.' });
    } else {
      setMessage({ type: 'error', text: 'Failed to remove picture.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSendMobileOTP = async () => {
    if (newMobile.length !== 10) {
      setOtpMessage({ type: 'error', text: 'Enter valid 10-digit number.' });
      return;
    }
    setOtpLoading(true);
    setOtpMessage(null);
    try {
      const resp = await sendSmsOtp(newMobile);
      if (resp.success) {
        setOtpSent(true);
        // Uses the exact message from smsService (which contains the Dev OTP code)
        setOtpMessage({ type: 'success', text: resp.message });
      } else {
        setOtpMessage({ type: 'error', text: resp.message || 'Failed to send OTP.' });
      }
    } catch (err) {
      console.error(err);
      setOtpMessage({ type: 'error', text: 'Server error' });
    }
    setOtpLoading(false);
  };

  const handleVerifyMobileOTP = async () => {
    if (otp.length !== 6) {
      setOtpMessage({ type: 'error', text: 'Enter 6-digit OTP' });
      return;
    }
    setOtpLoading(true);
    setOtpMessage(null);
    try {
      const resp = await verifySmsOtp(newMobile, otp);
      if (resp.success) {
        const updateResp = await updateProfile({ mobile: newMobile });
        if (updateResp.success) {
          setMessage({ type: 'success', text: 'Primary mobile number successfully updated!' });
          // Reset flow
          setIsChangingMobile(false);
          setOtpSent(false);
          setNewMobile('');
          setOtp('');
        } else {
          setOtpMessage({ type: 'error', text: updateResp.message || 'Failed saving new number.' });
        }
      } else {
        setOtpMessage({ type: 'error', text: resp.message || 'Incorrect OTP' });
      }
    } catch (err) {
      console.error(err);
      setOtpMessage({ type: 'error', text: 'Server error' });
    }
    setOtpLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: 'var(--primary-light)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
           <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Personal Account Settings</h2>
        </div>

        {message && message.text && (
          <div style={{ 
            background: message.type === 'error' ? '#ef4444' : 'var(--success-color, #22c55e)', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            textAlign: 'center', 
            animation: 'fadeIn 0.3s',
            fontWeight: 600
          }}>
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Corrected: Banner with buttons in corners */}
              <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', position: 'relative' }}>
                <button 
                  onClick={() => navigate(-1)} 
                  style={{ position: 'absolute', top: '15px', left: '15px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: 'white', fontSize: '0.85rem' }}
                >
                  <ArrowLeft size={16} /> {t('back')}
                </button>
                <button 
                  onClick={handleLogout} 
                  style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <LogOut size={16} /> {t('logout')}
                </button>
              </div>
              
              <div style={{ padding: '0 2.5rem 2.5rem 2.5rem', marginTop: '-60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  
                  {/* Profile Image with Menu trigger */}
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowPhotoMenu(!showPhotoMenu)}>
                    <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '6px solid white', overflow: 'hidden', background: '#f8fafc', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', position: 'relative' }}>
                      {currentUser?.profilePic ? (
                        <img 
                          src={currentUser?.profilePic} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)', background: 'var(--primary-color)' }}>
                          <User size={64} />
                        </div>
                      )}
                    </div>
                    
                    {/* Badge Icon */}
                    <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '32px', height: '32px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', color: 'var(--primary-color)' }}>
                      <Camera size={16} />
                    </div>

                    {/* Dropdown Menu */}
                    {showPhotoMenu && (
                      <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '12px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 100, width: '180px', overflow: 'hidden' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); setShowPhotoMenu(false); }}
                          style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left', fontWeight: 600, color: 'var(--text-main)' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <Camera size={18} color="var(--primary-color)" /> {currentUser?.profilePic ? 'Change Photo' : 'Add Photo'}
                        </button>
                        {currentUser?.profilePic && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePhotoRemove(); }}
                            style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left', fontWeight: 600, color: '#dc2626', borderTop: '1px solid #f1f5f9' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fff1f1'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <Trash2 size={18} /> Delete Photo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                  />

                  {/* Title Info */}
                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{currentUser?.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: 600 }}>
                      {currentUser?.role === 'PATIENT' ? <User size={16} /> : currentUser?.role === 'DOCTOR' ? <Stethoscope size={16} /> : <Building2 size={16} />}
                      <span>{t(currentUser?.role?.toLowerCase())} {t('my_profile')}</span>
                      <ShieldCheck size={16} color="var(--success-color)" />
                    </div>
                  </div>

                  {/* Emergency QR for Patients */}
                  {currentUser?.role === 'PATIENT' && (
                    <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '2px dashed #cbd5e1', width: '100%' }}>
                      <h4 style={{ marginBottom: '1rem', color: '#334155' }}>{t('emergency_qr')}</h4>
                      <EmergencyQR id={currentUser.aadhaarNumber} name={currentUser.name} mobile={currentUser.mobile} bloodGroup={currentUser?.bloodGroup} />
                    </div>
                  )}

                  {/* Grid Info */}
                  <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                    
                    {currentUser?.role !== 'STAFF' && (
                      <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}> {currentUser?.role === 'PATIENT' ? 'AADHAAR NUMBER' : 'OFFICIAL ID'}</label>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {currentUser?.role === 'PATIENT' ? currentUser?.aadhaarNumber : currentUser?.id}
                          {currentUser?.isVerified && <BadgeCheck size={18} color="var(--primary-color)" fill="var(--primary-light)" />}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <ShieldCheck size={14} /> 
                          {currentUser?.role === 'PATIENT' ? 'Verified via Aadhaar eKYC' : `Verified ${currentUser?.facilityCategory || ''} Facility`}
                        </p>
                      </div>
                    )}

                    {currentUser?.role === 'STAFF' && (
                      <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>LINKED FACILITY</label>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {currentUser?.parentName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Building2 size={14} /> Official Hospital Staff
                        </p>
                      </div>
                    )}

                    <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>CONTACT NUMBER</label>
                        {!isChangingMobile && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                            onClick={() => setIsChangingMobile(true)}
                          >
                            Change
                          </button>
                        )}
                      </div>

                      {isChangingMobile ? (
                        <div style={{ marginTop: '10px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px', display: 'block' }}>Update Verified Mobile</span>
                          
                          {!otpSent ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '0 10px', flex: 1 }}>
                                <span style={{ color: '#64748b', fontWeight: 600, marginRight: '5px' }}>+91</span>
                                <input 
                                  type="text" 
                                  placeholder="New 10-digit Mobile" 
                                  value={newMobile}
                                  onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '10px 0', fontSize: '1rem', fontWeight: 600 }}
                                />
                              </div>
                              <button className="btn btn-primary" onClick={handleSendMobileOTP} disabled={otpLoading} style={{ padding: '0 15px' }}>
                                {otpLoading ? '...' : 'Send OTP'}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                placeholder="6-digit OTP" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', fontSize: '1rem', fontWeight: 600, width: '120px', textAlign: 'center' }}
                              />
                              <button className="btn btn-primary" onClick={handleVerifyMobileOTP} disabled={otpLoading} style={{ flex: 1 }}>
                                {otpLoading ? 'Verifying...' : 'Verify & Setup'}
                              </button>
                            </div>
                          )}
                          
                          {otpMessage && (
                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: otpMessage.type === 'error' ? '#ef4444' : '#166534', fontWeight: 600 }}>
                              {otpMessage.text}
                            </div>
                          )}

                          <button 
                            onClick={() => { setIsChangingMobile(false); setOtpSent(false); setNewMobile(''); setOtp(''); setOtpMessage(null); }}
                            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{currentUser?.mobile || 'Not Set'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={12} color="var(--success-color)" /> Verified
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>EMAIL ADDRESS</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ padding: '4px 10px', fontSize: '1.1rem', fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                      />
                    </div>

                    <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>ALTERNATE CONTACT NUMBER</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={altMobile} 
                        onChange={(e) => setAltMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                        style={{ padding: '4px 10px', fontSize: '1.1rem', fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        placeholder="Optional"
                      />
                    </div>

                    {currentUser?.role === 'PATIENT' && (
                      <>
                        <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>BLOOD GROUP</label>
                          <select 
                            className="form-control" 
                            value={bloodGroup} 
                            onChange={(e) => setBloodGroup(e.target.value)}
                            style={{ padding: '4px', fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          >
                            <option value="">Select Group</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>DATE OF BIRTH & AGE</label>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {currentUser?.dob || 'Verified'}
                            {calculateAge(currentUser?.dob) !== null && (
                              <span style={{ background: 'var(--primary-light)', padding: '2px 10px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                                {calculateAge(currentUser?.dob)} years old
                              </span>
                            )}
                          </p>
                        </div>
                        <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>OFFICIAL PERMANENT ADDRESS</label>
                          <p style={{ fontSize: '1rem', fontWeight: 500 }}>{currentUser?.address || 'Verified Permanent Address'}</p>
                        </div>
                        <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>LOCAL ADDRESS / CURRENT RESIDENCE</label>
                          <textarea 
                            className="form-control" 
                            value={localAddr} 
                            onChange={(e) => setLocalAddr(e.target.value)}
                            style={{ padding: '8px', fontSize: '1rem', fontWeight: 500, border: 'none', background: 'transparent', outline: 'none', width: '100%', resize: 'none' }}
                            rows="2"
                            placeholder="Not Specified (Click to Add)"
                          />
                        </div>
                      </>
                    )}

                    {(currentUser?.role === 'HOSPITAL' || currentUser?.role === 'STAFF') && (
                      <>
                        <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>{currentUser?.role === 'STAFF' ? 'OFFICIAL STAFF ID' : 'FACILITY STATUS'}</label>
                          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: currentUser?.role === 'STAFF' ? 'var(--primary-color)' : 'var(--success-color)' }}>
                            {currentUser?.role === 'STAFF' ? currentUser?.id : 'Active Registry'}
                          </p>
                        </div>
                        {currentUser?.role === 'STAFF' && (
                          <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>JOINED DATE</label>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{new Date(currentUser?.createdAt).toLocaleDateString() || 'N/A'}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
        </div>
      </div>

      {/* Floating Save/Cancel Bar */}
      {isDirty && (
        <div style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: 'white', 
          padding: '1.2rem 2.5rem', 
          borderRadius: '24px', 
          boxShadow: '0 15px 35px rgba(0,0,0,0.25)', 
          display: 'flex', 
          gap: '1.5rem', 
          alignItems: 'center',
          animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 1000,
          border: '1px solid var(--primary-color)'
        }}>
          <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>Apply changes?</span>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button 
              onClick={handleCancel}
              className="btn"
              style={{ 
                padding: '0.6rem 1.8rem', 
                borderRadius: '12px', 
                background: '#f1f5f9', 
                color: '#475569', 
                border: '1px solid #e2e8f0',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              No
            </button>
            <button 
              onClick={handleGlobalSave}
              className="btn btn-primary"
              style={{ 
                padding: '0.6rem 2.2rem', 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(var(--primary-rgb, 79, 70, 229), 0.3)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
