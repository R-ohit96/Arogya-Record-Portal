import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserRound, Stethoscope, Building2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const [role, setRole] = useState(null);
  const [aadhaar, setAadhaar] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginPatient, loginHospital, loginDoctor } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const triggerError = (msg) => {
      setError(msg);
      setIsShaking(false);
      setTimeout(() => setIsShaking(true), 10);
      setIsLoading(false);
    };

    if (role === 'PATIENT') {
      if (aadhaar.length !== 12) {
        triggerError(t('error_aadhaar'));
        return;
      }
      if (!password) {
        triggerError(t('error_password'));
        return;
      }
      const response = await loginPatient(aadhaar, password);
      if (response.success) {
        navigate('/patient-dashboard');
      } else {
        triggerError(response.message);
      }
    } else if (role === 'HOSPITAL') {
      if (!staffEmail) {
        triggerError("Please enter your registered hospital or staff email.");
        return;
      }
      if (!password) {
        triggerError(t('error_password'));
        return;
      }
      const response = await loginHospital(staffEmail, password);
      if (response.success) {
        navigate('/doctor-dashboard');
      } else {
        triggerError(response.message);
      }
    } else {
      if (!staffEmail) {
        triggerError("Please enter your registered email.");
        return;
      }
      if (!password) {
        triggerError(t('error_password'));
        return;
      }
      const response = await loginDoctor(staffEmail, password);
      if (response.success) {
        navigate('/doctor-dashboard');
      } else {
        triggerError(response.message);
      }
    }
    setIsLoading(false);
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
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.png" alt="Aarogya Logo" style={{ width: '80px', height: '80px', marginBottom: '1rem', borderRadius: '16px' }} />
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '-0.02em' }}>{t('portal_name')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('welcome')}</p>
        </div>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '1.5rem', background: '#f5f5f5', padding: '5px', borderRadius: '8px' }}>
          <button 
            type="button" 
            className={`btn ${role === 'PATIENT' ? 'btn-primary' : ''}`} 
            style={{ flex: 1, padding: '0.5rem', color: role === 'PATIENT' ? 'white' : 'var(--text-muted)', background: role === 'PATIENT' ? 'var(--primary-color)' : 'transparent', border: 'none' }}
            onClick={() => { setRole('PATIENT'); setError(''); }}
          >
            <UserRound size={16} /> {t('patient')}
          </button>
          <button 
            type="button" 
            className={`btn ${role === 'HOSPITAL' ? 'btn-primary' : ''}`} 
            style={{ flex: 1.2, padding: '0.5rem', color: role === 'HOSPITAL' ? 'white' : 'var(--text-muted)', background: role === 'HOSPITAL' ? 'var(--primary-color)' : 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            onClick={() => { setRole('HOSPITAL'); setError(''); }}
          >
            <Building2 size={16} /> Hospital / Staff
          </button>
          <button 
            type="button" 
            className={`btn ${role === 'DOCTOR' ? 'btn-primary' : ''}`} 
            style={{ flex: 1, padding: '0.5rem', color: role === 'DOCTOR' ? 'white' : 'var(--text-muted)', background: role === 'DOCTOR' ? 'var(--primary-color)' : 'transparent', border: 'none' }}
            onClick={() => { setRole('DOCTOR'); setError(''); setStaffEmail(''); }}
          >
            <Stethoscope size={16} /> {t('doctor')}
          </button>
        </div>

        {error && (
          <div className={isShaking ? 'shake' : ''} style={{ color: 'white', background: 'var(--danger-color)', padding: '0.8rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {!role && (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem', background: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>{t('select_role')}</p>
            </div>
          )}
          {role === 'PATIENT' && (
            <div className="form-group">
              <label className="form-label">{t('aadhaar_number')}</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="0000 0000 0000" 
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').substring(0, 12))}
                maxLength={12}
                required
              />
            </div>
          )}

          {(role === 'HOSPITAL' || role === 'DOCTOR') && (
            <div className="form-group">
              <label className="form-label">Email or Registry ID</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Email or ID (e.g., DOC001)" 
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                required
              />
            </div>
          )}

          {role && (
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
              <div style={{ textAlign: 'right', marginTop: '5px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'none' }}>Forgot Password?</Link>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '1.1rem', marginTop: '1rem', marginBottom: '1rem' }} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Secure Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Register Here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
