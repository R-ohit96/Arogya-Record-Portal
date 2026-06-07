/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const RecordsContext = createContext();

export const useRecords = () => useContext(RecordsContext);

const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
let API_BASE_URL = isLocalDev ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') : '/api';

if (API_BASE_URL.endsWith('/')) API_BASE_URL = API_BASE_URL.slice(0, -1);
if (!API_BASE_URL.endsWith('/api')) API_BASE_URL += '/api';

export const RecordsProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [isLoaded] = useState(true);

  const fetchRecords = React.useCallback(async (patientId) => {
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
  }, []);

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

  const deleteRecord = async (recordId, requesterId, requesterRole) => {
    try {
      // Pass the requester's ID and Role so the backend can verify ownership
      const response = await axios.delete(`${API_BASE_URL}/records/${recordId}`, {
        data: { requesterId, requesterRole }
      });
      
      if (response.data.success) {
        setRecords(prev => prev.filter(r => r.id !== recordId));
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Failed to delete' };
    } catch (e) {
      console.error("Delete Error:", e);
      return { success: false, message: 'Server error during delete' };
    }
  };

  const updateRecord = async (recordId, updates) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/records/${recordId}`, updates);
      if (response.data.success) {
        const updatedRecords = records.map(r => {
          if (r.id === recordId) {
            return { ...r, ...updates };
          }
          return r;
        });
        setRecords(updatedRecords);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Failed to update record' };
    } catch (e) {
      console.error("Update Record Error:", e);
      return { success: false, message: 'Server error during update' };
    }
  };

  return (
    <RecordsContext.Provider value={{ records, isLoaded, fetchRecords, getPatientRecords, addRecord, deleteRecord, updateRecord }}>
      {children}
    </RecordsContext.Provider>
  );
};
