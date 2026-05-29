import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, User, QrCode, BadgeCheck, Users, Plus, X, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import ClinicQR from '../components/ClinicQR';

const DoctorDashboard = () => {
  const { currentUser, logout, createStaff, fetchStaffList, deleteStaff } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();

  const [searchAadhaar, setSearchAadhaar] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isQrVisible, setIsQrVisible] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', mobile: '' });
  const [staffMsg, setStaffMsg] = useState({ type: '', text: '' });
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const navigate = useNavigate();

  const loadStaff = async () => {
    const list = await fetchStaffList();
    setStaffList(list);
  };

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'DOCTOR' && currentUser.role !== 'HOSPITAL' && currentUser.role !== 'STAFF')) {
      navigate('/');
      return;
    }
    if (currentUser?.role === 'HOSPITAL') {
      loadStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Polling for Smart QR Check-ins
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'DOCTOR' && currentUser.role !== 'HOSPITAL' && currentUser.role !== 'STAFF')) return;

    const intervalId = setInterval(async () => {
      try {
        const myId = currentUser.role === 'STAFF' ? currentUser.parentId : currentUser.id;
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:4000/api' : '/api');
        
        const response = await fetch(`${API_BASE_URL}/check-in/poll/${myId}`);
        const result = await response.json();
        
        if (result.success && result.checkIn) {
          // Mark as consumed on backend
          await fetch(`${API_BASE_URL}/check-in/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkInId: result.checkIn._id })
          });
          
          navigate(`/patient-profile/${result.checkIn.patientId}`);
        }
      } catch (error) {
        // Ignore polling errors silently
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchAadhaar.length === 12) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:4000/api' : '/api');
        const response = await fetch(`${API_BASE_URL}/users/${searchAadhaar}`);
        const result = await response.json();
        
        if (result.success && result.user && result.user.role === 'PATIENT') {
          navigate(`/patient-profile/${searchAadhaar}`);
        } else {
          alert("PATIENT NOT REGISTERED / NOT FOUND");
        }
      } catch (error) {
        alert("Error connecting to server. Please try again.");
      }
    } else {
      alert(t('invalid_aadhaar'));
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (newStaff.mobile.length !== 10) {
      setStaffMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    const res = await createStaff(newStaff);
    if (res.success) {
      setStaffMsg({ type: 'success', text: 'Staff account created successfully.' });
      setNewStaff({ name: '', email: '', password: '', mobile: '' });
      loadStaff();
    } else {
      setStaffMsg({ type: 'error', text: res.message });
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    const res = await deleteStaff(staffId);
    if (res.success) {
      loadStaff();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="app-container">
      <header className="portal-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="portal-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
          {t('doctor_dashboard')}
        </div>
        <div className="user-profile-menu" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={toggleLanguage}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--primary-color)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)' }}
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
          <Link to="/my-profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)', background: '#eee' }}>
                {currentUser?.profilePic ? (
                  <img src={currentUser?.profilePic} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: 'white' }}>
                    <User size={18} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{currentUser?.name}</span>
                  {currentUser?.isVerified && <BadgeCheck size={16} color="var(--primary-color)" fill="var(--primary-light)" />}
                </div>
                {currentUser?.role === 'STAFF' && (
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                    STAFF @ {currentUser?.parentName?.toUpperCase()}
                  </span>
                )}
                {currentUser?.role === 'HOSPITAL' && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--success-color)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {currentUser?.facilityCategory} FACILITY
                  </span>
                )}
              </div>
            </div>
          </Link>
          {currentUser?.role === 'HOSPITAL' && (
            <button
              className="btn btn-primary"
              onClick={() => setIsStaffModalOpen(true)}
              style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Users size={16} /> Manage Staff
            </button>
          )}
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/'); }} style={{ padding: '0.4rem 0.8rem' }}><LogOut size={16} /> {t('logout')}</button>
        </div>
      </header>

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>

        <div className="card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '60px', height: '60px', marginBottom: '1rem', borderRadius: '12px' }} />
          <div>
            <h1>{t('welcome')}, {currentUser.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Search by Aadhaar or scan QR for instant access</p>
          </div>

          {!isQrVisible ? (
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="0000 0000 0000"
                  value={searchAadhaar}
                  onChange={(e) => setSearchAadhaar(e.target.value.replace(/\D/g, '').substring(0, 12))}
                  maxLength={12}
                  style={{ flex: 1, padding: '1rem', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>
                  <Search size={22} /> {t('search')}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0.8rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsQrVisible(true)}
                  style={{ flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <QrCode size={22} /> Show QR to View Records
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsScannerOpen(true)}
                  style={{ flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <Smartphone size={22} /> Manual Scan
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', background: 'var(--primary-light)', borderRadius: '16px', border: '2px dashed var(--primary-color)', animation: 'fadeIn 0.3s' }}>
              <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1rem' }}>Scan To Access Medical Records</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', background: 'white', padding: '1.2rem', borderRadius: '12px' }}>
                <ClinicQR id={currentUser.role === 'STAFF' ? currentUser.parentId : currentUser.id} name={currentUser.name} />
              </div>
              <button className="btn btn-outline" onClick={() => setIsQrVisible(false)} style={{ width: '100%', background: 'white' }}>Close QR & Back to Search</button>
            </div>
          )}

          <QRScanner
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanSuccess={(aadhaar) => navigate(`/patient-profile/${aadhaar}`)}
          />
        </div>

        {/* --- Staff Management Modal --- */}
        {isStaffModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
            <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={24} />
              </button>

              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <Plus size={24} color="var(--primary-color)" /> Add New Staff
                  </h2>
                  <form onSubmit={handleAddStaff}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} required placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email (Login ID)</label>
                      <input type="email" className="form-control" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} required placeholder="john@hospital.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newStaff.mobile}
                        onChange={e => setNewStaff({ ...newStaff, mobile: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                        required
                        maxLength={10}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} required />
                    </div>
                    {staffMsg.text && (
                      <div style={{ padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', background: staffMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: staffMsg.type === 'success' ? '#166534' : '#991b1b' }}>
                        {staffMsg.text}
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                  </form>
                </div>

                <div style={{ flex: 1.2, minWidth: '300px', borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <Users size={24} color="var(--primary-color)" /> Team
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {staffList.map(staff => (
                      <div key={staff._id || staff.id} style={{ padding: '0.8rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={staff.profilePic || '/default-user.png'} style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{staff.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {staff.id}</div>
                          </div>
                          <button onClick={() => setSelectedStaffId(selectedStaffId === staff._id ? null : staff._id)} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Info</button>
                          <button onClick={() => handleRemoveStaff(staff._id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        {selectedStaffId === staff._id && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.8rem', color: '#334155' }}>
                            <div style={{ marginBottom: '4px' }}><b>Email:</b> {staff.email}</div>
                            <div style={{ marginBottom: '4px' }}><b>Mobile:</b> {staff.mobile}</div>
                            <div style={{ marginBottom: '4px' }}><b>Password:</b> {staff.password}</div>
                            <div style={{ marginTop: '8px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem', color: '#64748b', display: 'inline-block' }}>
                              <b>ID Created:</b> {new Date(staff.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;
