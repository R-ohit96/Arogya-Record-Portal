/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const RecordsContext = createContext();

export const useRecords = () => useContext(RecordsContext);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:4000/api' : '/api');

export const RecordsProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [isLoaded] = useState(true);

  const fetchRecords = async (patientId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/records/${patientId}`);
      if (response.data.success) {
        // Map database fields to frontend expected fields
        const mappedRecords = response.data.records.map(r => ({
          ...r,
          id: r._id,
          imageUrl: r.fileData, // Use the Cloudinary URL from DB
          createdAt: r.createdAt,
          patientAadhaar: r.patientId,
          uploaderName: r.doctorName
        }));
        setRecords(mappedRecords);
        return mappedRecords;
      }
      return [];
    } catch (e) {
      console.error("Fetch Records Error:", e);
      return [];
    }
  };

  const addRecord = async (recordData) => {
    try {
      // API call to our new backend route
      const response = await axios.post(`${API_BASE_URL}/records`, recordData);
      
      if (response.data.success) {
        // Re-fetch records to get the updated list with Cloudinary URL
        await fetchRecords(recordData.patientAadhaar || recordData.patientId);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Failed to upload' };
    } catch (e) {
      console.error("Upload Error:", e);
      return { success: false, message: 'Server error during upload' };
    }
  };

  const getPatientRecords = (aadhaarNumber) => {
    return (Array.isArray(records) ? records : [])
      .filter(r => r.patientAadhaar === aadhaarNumber || r.patientId === aadhaarNumber)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const deleteRecord = async (recordId) => {
    // Currently relying on local delete until delete API is created
    const updatedRecords = records.filter(r => r.id !== recordId);
    setRecords(updatedRecords);
    return { success: true };
  };

  const updateRecord = async (recordId, updates) => {
    const updatedRecords = records.map(r => {
      if (r.id === recordId) {
        return { ...r, ...updates };
      }
      return r;
    });
    setRecords(updatedRecords);
    return { success: true };
  };

  return (
    <RecordsContext.Provider value={{ records, isLoaded, fetchRecords, getPatientRecords, addRecord, deleteRecord, updateRecord }}>
      {children}
    </RecordsContext.Provider>
  );
};
