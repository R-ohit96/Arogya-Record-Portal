import React from 'react';
import { Shield } from 'lucide-react';

const Loader = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--primary-light)',
      gap: '20px'
    }}>
      <div style={{ position: 'relative' }}>
        <img 
          src="/logo.png" 
          alt="Aarogya Logo" 
          style={{ width: '100px', height: '100px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} 
          className="animate-pulse-scale" 
        />
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          border: '4px solid var(--primary-color)',
          borderRadius: '25px',
          borderTopColor: 'transparent',
          animation: 'spin 1.5s linear infinite'
        }}></div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary-color)', fontWeight: 800, marginBottom: '5px' }}>Establishing Secure Connection...</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aarogya Record Portal</p>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default Loader;
