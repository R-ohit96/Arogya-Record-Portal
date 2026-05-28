import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

const EmergencyQR = ({ id, name, mobile, bloodGroup, size = 160 }) => {
  const qrRef = useRef(null);

  // Real emergency data encoded in QR
  const qrData = JSON.stringify({
    type: 'AAROGYA_EMERGENCY',
    patientId: id,
    name: name || 'Patient',
    mobile: mobile || 'N/A',
    bloodGroup: bloodGroup || 'Unknown',
    portal: 'Aarogya Health Portal',
    scannedAt: new Date().toISOString()
  });

  const handleDownload = () => {
    const svgEl = qrRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = size + 60;
    canvas.height = size + 80;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 30, 20, size, size);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AAROGYA HEALTH ID', canvas.width / 2, size + 45);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(id?.substring(0, 4) + 'XXXX' + id?.slice(-4), canvas.width / 2, size + 62);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `aarogya-qr-${id?.substring(0, 6)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div
        ref={qrRef}
        style={{
          padding: '18px',
          background: 'white',
          borderRadius: '16px',
          display: 'inline-block',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '2px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* Red corner badge */}
        <div style={{
          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
          background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 700,
          padding: '2px 10px', borderRadius: '20px', letterSpacing: '0.05em', whiteSpace: 'nowrap'
        }}>
          🚨 EMERGENCY QR
        </div>

        <QRCodeSVG
          value={qrData}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="#1e293b"
          bgColor="#ffffff"
          imageSettings={{
            src: '/logo.png',
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true
          }}
        />

        <div style={{
          textAlign: 'center', marginTop: '10px',
          fontSize: '0.65rem', color: '#64748b',
          fontWeight: 700, fontFamily: 'monospace',
          letterSpacing: '0.05em'
        }}>
          HEALTH-ID: {id?.substring(0, 4)}•••{id?.slice(-4)}
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 18px', borderRadius: '10px',
          background: 'var(--primary-color)', color: 'white',
          border: 'none', cursor: 'pointer',
          fontSize: '0.8rem', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          transition: 'opacity 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
        onMouseOut={e => e.currentTarget.style.opacity = '1'}
      >
        <Download size={14} /> Download QR
      </button>

      <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', maxWidth: '200px', margin: 0 }}>
        Scan to view emergency patient info
      </p>
    </div>
  );
};

export default EmergencyQR;
