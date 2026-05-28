import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

const ClinicQR = ({ id, name, size = 160 }) => {
  const qrRef = useRef(null);

  // Data for Clinical Check-in
  const qrData = JSON.stringify({
    type: 'CLINIC_CHECKIN',
    doctorId: id,
    name: name || 'Doctor',
    portal: 'Aarogya Health Portal',
    timestamp: new Date().toISOString()
  });

  const handleDownload = () => {
    const svgEl = qrRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = size + 80;
    canvas.height = size + 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 40, 20, size, size);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO SHARE RECORDS', canvas.width / 2, size + 45);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`ID: ${id}`, canvas.width / 2, size + 65);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `clinic-qr-${id}.png`;
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
          padding: '24px',
          background: 'white',
          borderRadius: '16px',
          display: 'inline-block',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          border: '2px solid var(--primary-color)',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--primary-color)', color: 'white', fontSize: '0.65rem', fontWeight: 700,
          padding: '2px 12px', borderRadius: '20px', letterSpacing: '0.05em', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          <QrCode size={12} /> SCAN TO SHARE RECORDS
        </div>

        <QRCodeSVG
          value={qrData}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="var(--primary-color)"
          bgColor="#ffffff"
          imageSettings={{
            src: '/logo.png',
            x: undefined,
            y: undefined,
            height: 28,
            width: 28,
            excavate: true
          }}
        />

        <div style={{
          textAlign: 'center', marginTop: '12px',
          fontSize: '0.75rem', color: '#1e293b',
          fontWeight: 800
        }}>
          {name}
        </div>
      </div>

      <button
        onClick={handleDownload}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 20px', borderRadius: '10px',
          background: 'white', color: 'var(--primary-color)',
          border: '1px solid var(--primary-color)', cursor: 'pointer',
          fontSize: '0.8rem', fontWeight: 600,
          transition: 'all 0.2s'
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = 'var(--primary-color)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.color = 'var(--primary-color)';
        }}
      >
        <Download size={14} /> Download Record Access QR
      </button>
    </div>
  );
};

export default ClinicQR;
