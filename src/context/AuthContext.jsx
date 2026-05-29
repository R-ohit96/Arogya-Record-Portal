/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
let API_BASE_URL = isLocalDev ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') : '/api';

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
      // Save profile pic separately (regardless of format – data‑URL or Cloudinary URL)
      if (user.profilePic) {
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
        role: 'PATIENT', aadhaarNumber, name, mobile, alternateMobile, email: email.trim().toLowerCase(), gender, age, address, localAddress, dob, patientId, password
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
      if (!email) return { success: false, message: 'Email is required for Hospital registration.' };
      const normalizedEmail = email.trim().toLowerCase();
      const userData = {
        role: 'HOSPITAL', id: hospitalId, name: hospitalName, password, mobile, alternateMobile, email: normalizedEmail, facilityCategory: hospitalCategory
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
      if (!email) return { success: false, message: 'Email is required for Doctor registration.' };
      const normalizedEmail = email.trim().toLowerCase();
      const userData = {
        role: 'DOCTOR', id: doctorId, name, password, mobile, alternateMobile, email: normalizedEmail, specialization
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
      const normalizedEmail = email.trim().toLowerCase();
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { role: 'HOSPITAL', id: normalizedEmail, password });
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
      const normalizedEmail = email.trim().toLowerCase();
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { role: 'DOCTOR', id: normalizedEmail, password });
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

  // --- PROFILE UPDATES ---

  const updateProfile = async (updatedData) => {
    if (!currentUser) return { success: false, message: 'No user defined' };
    try {
      const userId = currentUser._id || currentUser.id;

      // --- PROFILE PICTURE UPLOAD (Cloudinary) ---
      if (updatedData.profilePic !== undefined) {
        if (updatedData.profilePic === null) {
          // Remove profile pic
          await axios.post(`${API_BASE_URL}/auth/remove-profile-pic`, { id: userId });
          const updatedUser = { ...currentUser, profilePic: null };
          setCurrentUser(updatedUser);
          // Remove from localStorage
          localStorage.removeItem(`photo_${currentUser.aadhaarNumber || currentUser.id}`);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          return { success: true };
        } else {
          // Upload profile pic (base64 data‑URL or URL string)
          const response = await axios.post(`${API_BASE_URL}/auth/profile-pic`, {
            id: userId,
            profilePic: updatedData.profilePic
          });
          if (response.data.success) {
            const updatedUser = { ...currentUser, profilePic: response.data.profilePic };
            setCurrentUser(updatedUser);
            syncSessionToLocal(updatedUser);
            return { success: true };
          }
          return { success: false, message: 'Failed to upload profile picture.' };
        }
      }

      // --- GENERAL PROFILE FIELDS UPDATE ---
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, {
        id: userId,
        ...updatedData
      });
      if (response.data.success) {
        const updatedUser = { ...currentUser, ...response.data.user };
        setCurrentUser(updatedUser);
        syncSessionToLocal(updatedUser);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Update failed' };
    } catch (error) {
      console.error('updateProfile error:', error);
      return { success: false, message: error.response?.data?.message || 'Error updating profile' };
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
    } catch {
      return [];
    }
  };

  const deleteStaff = async (staffId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/auth/staff/${staffId}`);
      return { success: response.data.success, message: response.data.message };
    } catch {
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
