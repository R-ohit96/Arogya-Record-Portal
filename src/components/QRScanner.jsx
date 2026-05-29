import React, { useState, useRef, useEffect } from 'react';
import { X, QrCode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  // Store callbacks in a mutable ref to prevent effect re-runs when parent components re-render
  const callbacksRef = useRef({ onScanSuccess, onClose });
  useEffect(() => {
    callbacksRef.current = { onScanSuccess, onClose };
  }, [onScanSuccess, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    const onScanResult = (decodedText) => {
      try {
        // Parse the JSON data from EmergencyQR
        const data = JSON.parse(decodedText);
        if (data.type === 'AAROGYA_EMERGENCY' && data.patientId) {
          // Success! Stop scanner and notify parent
          scanner.clear().then(() => {
            callbacksRef.current.onScanSuccess(data.patientId);
            callbacksRef.current.onClose();
          }).catch(err => console.error("Failed to clear scanner", err));
        } else if (data.type === 'CLINIC_CHECKIN' && data.doctorId) {
           // Success for clinic check-in
           scanner.clear().then(() => {
             callbacksRef.current.onScanSuccess({ type: 'CLINIC_CHECKIN', doctorId: data.doctorId });
             callbacksRef.current.onClose();
           }).catch(err => console.error("Failed to clear scanner", err));
        } else {
          setError('Invalid Aarogya QR format.');
        }
      } catch {
        // If not JSON, check if it's a raw 12-digit Aadhaar
        if (/^\d{12}$/.test(decodedText)) {
          scanner.clear().then(() => {
            callbacksRef.current.onScanSuccess(decodedText);
            callbacksRef.current.onClose();
          }).catch(err => console.error("Failed to clear scanner", err));
        } else {
          setError('Could not recognize QR code content.');
        }
      }
    };

    // eslint-disable-next-line no-unused-vars
    const onScanError = (_error) => {
      // Too many errors logged by library
    };

    scanner.render(onScanResult, onScanError);
    scannerRef.current = scanner;

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {
          // Suppress "element not found" errors on unmount
        });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.75)', zIndex: 11000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        width: '450px', background: 'white', borderRadius: '28px',
        padding: '2.5rem', position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '24px', right: '24px',
            background: '#f1f5f9', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', background: 'var(--primary-light)',
            borderRadius: '18px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.2rem', color: 'var(--primary-color)'
          }}>
            <QrCode size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Real-Time QR Scanner</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Point your camera at the QR</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '0.8rem',
            borderRadius: '12px', marginBottom: '1rem', textAlign: 'center',
            fontSize: '0.9rem', fontWeight: 600, border: '1px solid #fee2e2'
          }}>
            {error}
          </div>
        )}

        <div
          id="reader"
          style={{
            width: '100%', borderRadius: '20px', overflow: 'hidden',
            border: '2px solid #e2e8f0', background: '#f8fafc',
            marginBottom: '1rem'
          }}
        ></div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
          By scanning, you agree to access patient records solely for medical purposes.
        </p>
      </div>

      <style>{`
        #reader__dashboard_section_csr button {
          background: var(--primary-color) !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          margin: 5px !important;
        }
        #reader__dashboard_section_csr select {
          padding: 5px !important;
          border-radius: 5px !important;
          border: 1px solid #cbd5e1 !important;
        }
        #reader video {
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
