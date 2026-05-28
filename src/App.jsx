import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RecordsProvider } from './context/RecordsContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientProfile from './pages/PatientProfile';
import ForgotPassword from './pages/ForgotPassword';
import MyProfile from './pages/MyProfile';

import { useAuth } from './context/AuthContext';
import { useRecords } from './context/RecordsContext';
import Loader from './components/Loader';
import SplashScreen from './components/SplashScreen';

function PortalRoutes() {
  const { isAuthLoaded } = useAuth();
  const { isLoaded } = useRecords();

  if (!isAuthLoaded || !isLoaded) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/patient-profile/:aadhaar" element={<PatientProfile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/my-profile" element={<MyProfile />} />
    </Routes>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <Router>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <LanguageProvider>
        <AuthProvider>
          <RecordsProvider>
            <PortalRoutes />
          </RecordsProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
