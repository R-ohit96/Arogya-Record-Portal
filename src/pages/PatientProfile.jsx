import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import { ArrowLeft, Upload, LogOut, User as UserIcon } from 'lucide-react';
import ReportCard from '../components/ReportCard';
import UploadModal from '../components/UploadModal';
import { useLanguage } from '../context/LanguageContext';


const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocalDev ? 'http://localhost:4000' : '';

const PatientProfile = () => {
  const { aadhaar } = useParams();
  const { currentUser, logout, updatePatientProfile } = useAuth();
  const { fetchRecords, getPatientRecords } = useRecords();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'DOCTOR' && currentUser.role !== 'HOSPITAL' && currentUser.role !== 'STAFF')) {
      navigate('/');
      return;
    }

    let isAccessValid = true;
    const displayName = currentUser.role === 'STAFF' && currentUser.parentName 
        ? `${currentUser.name} (${currentUser.parentName})` 
        : currentUser.name;
    let activeLogId = null;

    const grantAccessAndNotify = async (patientMobile) => {
      try {
        // Create access log on backend (backend auto-checks for existing active logs)
        const response = await fetch(`${API_BASE_URL}/api/access-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientAadhaar: aadhaar,
            doctorId: currentUser.id || currentUser._id,
            doctorName: displayName
          })
        });
        const result = await response.json();
        if (result.success && result.log) {
          activeLogId = result.log._id;
        }

        // Send SMS alert to patient
        if (patientMobile) {
          await fetch(`${API_BASE_URL}/api/send-access-alert-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: patientMobile, doctorName: displayName })
          }).catch(e => console.error('SMS alert failed', e));
        }
      } catch (e) {
        console.error('Access grant error', e);
      }
    };

    const checkAccessValidity = async () => {
      try {
        const doctorId = currentUser.id || currentUser._id;
        const response = await fetch(`${API_BASE_URL}/api/access-logs/check?patientAadhaar=${aadhaar}&doctorId=${doctorId}`);
        const result = await response.json();
        
        if (result.success && !result.valid) {
          isAccessValid = false;
          const reason = result.reason === 'REVOKED' 
            ? 'Access Revoked by Patient.' 
            : 'Access Expired (12 Hour Limit).';
          alert(reason);
          navigate('/doctor-dashboard');
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    const loadPatientInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${aadhaar}`);
        const result = await response.json();
        console.log('[PatientProfile] API response for', aadhaar, ':', result);
        if (result.success && result.user) {
          setPatientData(result.user);
          await fetchRecords(aadhaar);
          // Don't block profile loading if access log fails
          grantAccessAndNotify(result.user.mobile).catch(e => console.error('Access notify error:', e));
        } else {
          console.warn('[PatientProfile] Patient not found for aadhaar:', aadhaar);
          setPatientData(null);
        }
      } catch (err) {
        console.error("Error loading patient profile:", err);
        setPatientData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPatientInfo();
    
    // Polling interval to check if patient revokes access remotely
    const intervalId = setInterval(() => {
      if (isAccessValid) checkAccessValidity();
    }, 5000);

    return () => {
      clearInterval(intervalId);
      // Auto-close specific session when doctor leaves the profile page
      if (activeLogId) {
        fetch(`${API_BASE_URL}/api/access-logs/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'keepalive': true },
          body: JSON.stringify({ logId: activeLogId })
        }).catch(() => {});
      }
    };
  }, [aadhaar, currentUser, navigate, fetchRecords]);

  if (!currentUser) return null;

  const allRecords = getPatientRecords(aadhaar);
  const hospitalRecords = allRecords.filter(r => r.uploaderType === 'HOSPITAL' || r.uploaderType === 'DOCTOR' || r.uploaderType === 'STAFF');
  const patientRecords = allRecords.filter(r => r.uploaderType === 'PATIENT');

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Patient Profile...</div>;
  }

  if (!patientData) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ color: '#dc2626' }}>PATIENT NOT REGISTERED / NOT FOUND</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No user found with Aadhaar: {aadhaar}</p>
        <button className="btn btn-outline" onClick={() => navigate('/doctor-dashboard')}>
          <ArrowLeft size={16} /> Go Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="portal-header">
        <div className="portal-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
          {t('doctor_dashboard')}
        </div>
        <div className="user-profile-menu" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontWeight: 600 }}>{currentUser.name}</span>
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/'); }}><LogOut size={16} /> {t('logout')}</button>
        </div>
      </header>

      <main className="main-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/doctor-dashboard')} style={{ padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={16} /> {t('back')}
          </button>
        </div>

        {/* Unified Profile Header Card */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '6px solid var(--primary-color)' }}>
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
            
            {/* Photo Section */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '4px solid white', background: '#f8fafc', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                {patientData?.profilePic ? (
                  <img src={patientData.profilePic} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white' }}>
                    <UserIcon size={64} />
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-main)' }}>{patientData.name}</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: '5px 0', fontWeight: 600 }}>
                    Aadhaar: XXXX XXXX {aadhaar.substring(8)}
                  </p>
                </div>
                {(currentUser.role === 'HOSPITAL' || currentUser.role === 'STAFF') && (
                  <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
                    <Upload size={20} /> {t('upload_new_report')}
                  </button>
                )}
              </div>

              {/* Stacked Details Table-like layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
                
                {/* Age & Blood Group Badges */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {calculateAge(patientData?.dob) !== null && (
                    <div style={{ background: '#fff3cd', padding: '6px 16px', borderRadius: '8px', border: '1px solid #ffeeba', color: '#856404', fontWeight: 800, fontSize: '0.9rem' }}>
                      {t('age')}: {calculateAge(patientData.dob)} Years
                    </div>
                  )}
                  <div style={{ background: '#fef2f2', padding: '6px 16px', borderRadius: '8px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991b1b' }}>BLOOD GROUP:</span>
                    <select 
                      style={{ border: 'none', background: 'transparent', fontWeight: 900, color: '#dc2626', cursor: 'pointer', outline: 'none', fontSize: '1.05rem' }}
                      value={patientData?.bloodGroup || ''}
                      onChange={async (e) => {
                        const newGroup = e.target.value;
                        const res = await updatePatientProfile(aadhaar, { bloodGroup: newGroup });
                        if (res.success) {
                          setPatientData(prev => ({ ...prev, bloodGroup: newGroup }));
                        }
                      }}
                    >
                      <option value="">Update</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact and Address Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', background: '#f8fafc', padding: '1.8rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  
                  {/* Column 1: Contacts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.5px' }}>MOBILE NUMBER</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{patientData.mobile || 'N/A'}</span>
                    </div>
                    {patientData.alternateMobile && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.5px' }}>ALTERNATE CONTACT</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{patientData.alternateMobile}</span>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Addresses */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.5px' }}>OFFICIAL ADDRESS</span>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.5' }}>{patientData.address || 'Verified Permanent Address'}</span>
                    </div>
                    {patientData.localAddress && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.5px' }}>LOCAL RESIDENCE</span>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.5' }}>{patientData.localAddress}</span>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Records Lists */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', paddingBottom: '10px', borderBottom: '2px solid #edf2f7' }}>
              <div style={{ width: '8px', height: '24px', background: 'var(--success-color)', borderRadius: '4px' }}></div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{t('official_records')}</h2>
            </div>
            {hospitalRecords.length === 0 ? <div className="empty-state">{t('no_hospital_records')}</div> : hospitalRecords.map(r => <ReportCard key={r._id || r.id} record={r} />)}
          </div>

          <div style={{ flex: '1', minWidth: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', paddingBottom: '10px', borderBottom: '2px solid #edf2f7' }}>
              <div style={{ width: '8px', height: '24px', background: 'var(--primary-color)', borderRadius: '4px' }}></div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{t('personal_uploads')}</h2>
            </div>
            {patientRecords.length === 0 ? <div className="empty-state">{t('no_personal_records')}</div> : patientRecords.map(r => <ReportCard key={r._id || r.id} record={r} />)}
          </div>
        </div>
      </main>

      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} patientAadhaar={aadhaar} />
    </div>
  );
};

export default PatientProfile;
