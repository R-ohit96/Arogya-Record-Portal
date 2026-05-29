/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

let API_BASE_URL = 'https://arogya-record-portal.onrender.com/api';

if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);
if (!API_BASE_URL.endsWith('/api')) API_BASE_URL += '/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          // Check for separately saved photo
          const photoKey = `photo_${user.aadhaarNumber || user.id}`;
          const storedPhoto = localStorage.getItem(photoKey);
          if (storedPhoto) user.profilePic = storedPhoto;
          setCurrentUser(user);
        }
        setIsAuthLoaded(true);
      } catch (err) {
        console.error("Auth Load Error:", err);
        setIsAuthLoaded(true);
      }
    };
    loadAuthData();
  }, []);

  const syncSessionToLocal = (user) => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (user.profilePic && user.profilePic.startsWith('data:')) {
        localStorage.setItem(`photo_${user.aadhaarNumber || user.id}`, user.profilePic);
      }
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  const generatePatientId = () => {
    return `AAR-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // --- REGISTER FUNCTIONS ---
  const registerPatient = async (aadhaarNumber, name, mobile, gender, age, password, alternateMobile = '', email = '', address = '', dob = '', localAddress = '') => {
    try {
      const patientId = generatePatientId();
      const userData = {
        role: 'PATIENT', aadhaarNumber, name, mobile, alternateMobile, email, gender, age, address, localAddress, dob, patientId, password
      };
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      if (response.data.success) {
        return { success: true, message: 'Registration successful!', user: response.data.user };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Server error during registration' };
    }
  };

  const registerHospital = async (hospitalId, hospitalName, password, mobile, alternateMobile = '', email = '', hospitalCategory = 'PRIVATE') => {
    try {
      const userData = {
        role: 'HOSPITAL', id: hospitalId, name: hospitalName, password, mobile, alternateMobile, email, facilityCategory: hospitalCategory
      };
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      if (response.data.success) {
        return { success: true, message: 'Registration successful!', user: response.data.user };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error connecting to server' };
    }
  };

  const registerDoctor = async (doctorId, name, password, mobile, alternateMobile = '', email = '', specialization = '') => {
    try {
      const userData = {
        role: 'DOCTOR', id: doctorId, name, password, mobile, alternateMobile, email, specialization
      };
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      if (response.data.success) {
        return { success: true, message: 'Registration successful!', user: response.data.user };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error connecting to server' };
    }
  };

  // --- LOGIN FUNCTIONS ---
  const loginPatient = async (aadhaarNumber, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { role: 'PATIENT', id: aadhaarNumber, password });
      if (response.data.success) {
        const user = response.data.user;
        setCurrentUser(user);
        syncSessionToLocal(user);
        return { success: true, message: 'Login successful', user };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const loginHospital = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { role: 'HOSPITAL', id: email, password });
      if (response.data.success) {
        const user = response.data.user;
        setCurrentUser(user);
        syncSessionToLocal(user);
        return { success: true, user };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const loginDoctor = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { role: 'DOCTOR', id: email, password });
      if (response.data.success) {
        const user = response.data.user;
        setCurrentUser(user);
        syncSessionToLocal(user);
        return { success: true, user };
      }
      return { success: false, message: response.data.message };
    } catch {
      return { success: false, message: 'Login failed' };
    }
  };

  // Profile Updates & Staff (Needs full backend routes if they don't exist, falling back to basic mock if needed)
  const updateProfile = async (updatedData) => {
    if (!currentUser) return { success: false, message: 'No user defined' };
    try {
      const updatedUser = { ...currentUser, ...updatedData };
      setCurrentUser(updatedUser);
      syncSessionToLocal(updatedUser);
      // NOTE: In a full app, we would make a PUT request to /api/users/:id here.
      // Assuming it works for session right now.
      return { success: true };
    } catch {
      return { success: false, message: 'Error updating profile' };
    }
  };

  const updatePatientProfile = async (aadhaar, updatedData) => {
    return updateProfile(updatedData);
  };

  const createStaff = async (staffData) => {
    try {
      const parentId = currentUser.id || currentUser._id;
      const response = await axios.post(`${API_BASE_URL}/auth/staff/create`, {
        ...staffData,
        parentId,
        parentName: currentUser.name,
        parentIdStr: currentUser.id
      });
      if (response.data.success) {
        return { success: true, message: 'Staff member added successfully.', staff: response.data.staff };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to add staff' };
    }
  };

  const fetchStaffList = async () => {
    const parentId = currentUser?.id || currentUser?._id;
    if (!parentId) return [];
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/staff/list/${parentId}`);
      return response.data.success ? response.data.staff : [];
    } catch (error) {
      return [];
    }
  };

  const deleteStaff = async (staffId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/auth/staff/${staffId}`);
      return { success: response.data.success, message: response.data.message };
    } catch (e) {
      return { success: false, message: 'Delete failed.' };
    }
  };

  const resetPassword = () => {
    // In complete app, would call POST /api/auth/reset-password
    return { success: false, message: 'Password reset requires backend email verification.' };
  };

  const logout = () => {
    setCurrentUser(null);
    syncSessionToLocal(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, isAuthLoaded,
      registerPatient, registerHospital, registerDoctor,
      loginPatient, loginHospital, loginDoctor, resetPassword,
      updatePatientProfile, logout, createStaff, fetchStaffList, deleteStaff,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
