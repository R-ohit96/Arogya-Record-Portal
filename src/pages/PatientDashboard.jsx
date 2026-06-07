import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import ReportCard from '../components/ReportCard';
import UploadModal from '../components/UploadModal';
import QRScanner from '../components/QRScanner';
import { useLanguage } from '../context/LanguageContext';
import { QrCode, LogOut, PlusCircle, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const PatientDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { getPatientRecords, fetchRecords } = useRecords();
  const { t, lang, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeAccesses, setActiveAccesses] = useState([]);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'PATIENT') {
      navigate('/');
      return;
    }
    // Fetch patient's medical records on mount
    fetchRecords(currentUser.aadhaarNumber);

    // Load active accesses from backend
    const loadAccesses = async () => {
      try {
        const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const API_BASE_URL = isLocalDev ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') : '/api';
        const response = await fetch(`${API_BASE_URL}/access-logs/patient/${currentUser.aadhaarNumber}`);
        const result = await response.json();
        if (result.success) {
          setActiveAccesses(result.logs);
        }
      } catch {
        // Silently ignore fetch errors
      }
      setCurrentTime(Date.now());
    };
    loadAccesses();
    const intervalId = setInterval(loadAccesses, 5000); // refresh every 5s
    return () => clearInterval(intervalId);
  }, [currentUser, navigate, fetchRecords]);

  if (!currentUser || currentUser.role !== 'PATIENT') {
    return null;
  }

  const allRecords = getPatientRecords(currentUser.aadhaarNumber);
  const hospitalRecords = allRecords.filter(r => r.uploaderType === 'HOSPITAL');
  const patientRecords = allRecords.filter(r => r.uploaderType === 'PATIENT');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRevoke = async (logId) => {
    try {
      const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const API_BASE_URL = isLocalDev ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') : '/api';
      const response = await fetch(`${API_BASE_URL}/access-logs/revoke/${logId}`, { method: 'PUT' });
      const result = await response.json();
      if (result.success) {
        setActiveAccesses(prev => prev.filter(p => p._id !== logId));
      }
    } catch {
      alert('Failed to revoke access. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header className="portal-header">
        <div className="portal-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
          {t('portal_name')}
        </div>
        <div className="user-profile-menu" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={toggleLanguage}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--primary-color)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)' }}
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
          <Link to="/my-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)', background: '#eee' }}>
              {currentUser?.profilePic ? (
                <img src={currentUser.profilePic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white' }}>
                  <User size={18} />
                </div>
              )}
            </div>
            <span style={{ fontWeight: 600 }}>{currentUser?.aadhaarNumber ? currentUser.aadhaarNumber.replace(/.(?=.{4})/g, '*') : t('patient')}</span>
          </Link>
          <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem' }}><LogOut size={16} /> {t('logout')}</button>
        </div>
      </header>
      
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>{t('welcome')}, {currentUser?.name || t('patient')}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{t('medical_id')}: <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{currentUser?.patientId || 'AAR-XXXXXX'}</span></p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={() => setIsScannerOpen(true)} style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
              <QrCode size={20} /> Scan QR to Share Records
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <PlusCircle size={20} /> {t('upload_report')}
            </button>
          </div>
        </div>

        
        <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '12px', marginBottom: '2.5rem', borderLeft: '6px solid var(--primary-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '45px', height: '45px', borderRadius: '10px' }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>Aarogya Record Portal</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Verified digital health repository.</p>
            </div>
          </div>
        </div>

        {/* --- Active Profile Accesses --- */}
        {activeAccesses.length > 0 && (
          <div style={{ padding: '20px', background: '#fff5f5', borderRadius: '12px', marginBottom: '2.5rem', borderLeft: '6px solid #e53e3e', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#c53030', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ animation: 'pulse 2s infinite' }}>🔴</span> Active Profile Access Logs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeAccesses.map(access => {
                const timeLeft = Math.max(0, Math.floor((new Date(access.expiresAt).getTime() - currentTime) / (1000 * 60 * 60)));
                return (
                  <div key={access._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #feb2b2' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2d3748' }}>Accessed by: {access.doctorName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#718096' }}>Expires in {timeLeft} hours (Auto-logout)</div>
                    </div>
                    <button className="btn btn-outline" onClick={() => handleRevoke(access._id)} style={{ color: '#e53e3e', borderColor: '#e53e3e', padding: '0.4rem 1rem' }}>
                      Revoke Access
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- Parallel Records Container --- */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* --- Hospital / Official Records Section --- */}
          <div style={{ flex: '1', minWidth: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', paddingBottom: '10px', borderBottom: '2px solid #edf2f7' }}>
              <div style={{ width: '8px', height: '24px', background: 'var(--success-color)', borderRadius: '4px' }}></div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{t('official_records')}</h2>
              <span style={{ fontSize: '0.75rem', background: '#f0fff4', color: 'var(--success-color)', padding: '2px 10px', borderRadius: '20px', fontWeight: 700, marginLeft: 'auto' }}>{t('verified')}</span>
            </div>

            {hospitalRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: '16px', border: '1px dashed #ced4da', color: 'var(--text-muted)' }}>
                <p>{t('no_records')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {hospitalRecords.map((record) => (
                  <ReportCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>

          {/* --- Personal Uploads Section --- */}
          <div style={{ flex: '1', minWidth: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', paddingBottom: '10px', borderBottom: '2px solid #edf2f7' }}>
              <div style={{ width: '8px', height: '24px', background: 'var(--primary-color)', borderRadius: '4px' }}></div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{t('personal_uploads')}</h2>
              <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 10px', borderRadius: '20px', fontWeight: 700, marginLeft: 'auto' }}>{t('private')}</span>
            </div>

            {patientRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', background: 'white', borderRadius: '16px', border: '1px dashed #ced4da', color: 'var(--text-muted)' }}>
                <p>{t('no_records')}</p>
                <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setIsModalOpen(true)}>{t('upload_report')}</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {patientRecords.map((record) => (
                  <ReportCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <QRScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={async (data) => {
          if (data && data.type === 'CLINIC_CHECKIN') {
            try {
              const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
              const API_BASE_URL = isLocalDev ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') : '/api';
              
              const response = await fetch(`${API_BASE_URL}/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  doctorId: data.doctorId,
                  patientId: currentUser.aadhaarNumber,
                  patientName: currentUser.name
                })
              });
              const result = await response.json();
              if (result.success) {
                alert('Profile Shared! The doctor can now view your records.');
              } else {
                alert('Failed to share profile. Please try again.');
              }
            } catch (error) {
              console.error('Check-in error:', error);
              alert('Network error while sharing profile.');
            }
          }
        }} 
      />
    </div>
  );
};

export default PatientDashboard;
