import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';

const UploadModal = ({ isOpen, onClose, patientAadhaar }) => {
  const { currentUser } = useAuth();
  const { addRecord } = useRecords();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);

  // Camera specific state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      alert("Camera access denied or not available. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setPreviewUrl(dataUrl);
      setFile({ name: 'camera-shot.jpg' }); // dummy file object
      stopCamera();
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit. Please choose a smaller file.");
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const closeAndReset = () => {
    setFile(null);
    setPreviewUrl('');
    setTitle('');
    setDescription('');
    setIsUploading(false);
    stopCamera();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !previewUrl) {
      alert('Please provide a title and upload a document or capture a photo.');
      return;
    }

    setIsUploading(true);

    const newRecord = {
      patientAadhaar: patientAadhaar || currentUser.aadhaarNumber,
      uploaderType: currentUser.role === 'STAFF' ? 'HOSPITAL' : currentUser.role,
      uploaderName: currentUser.role === 'STAFF' ? `${currentUser.name} (${currentUser.parentName})` : currentUser.name,
      uploaderId: currentUser.role === 'STAFF' ? currentUser.parentId : (currentUser.id || currentUser.aadhaarNumber),
      title,
      description,
      imageUrl: previewUrl,
    };

    const result = await addRecord(newRecord);
    
    if (result && result.success) {
      alert('Upload successful!');
      closeAndReset();
    } else {
      alert(result?.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Upload Medical Record</h2>
          <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={closeAndReset}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Report Title</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g., Blood Test, X-Ray" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea 
              className="form-control" 
              rows="2" 
              placeholder="Add any notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Upload Document</label>
            <input 
              type="file" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button type="button" className={`btn ${isCameraOpen ? 'btn-primary' : 'btn-outline'}`} onClick={startCamera} style={{ flex: 1 }}>
                <Camera size={18} /> Open Camera
              </button>
              <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()} style={{ flex: 1 }}>
                <ImageIcon size={18} /> From Gallery
              </button>
            </div>

            {/* Live Camera View */}
            {isCameraOpen && (
              <div style={{ marginBottom: '15px', position: 'relative', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'black' }}>
                <video ref={videoRef} style={{ width: '100%', maxHeight: '300px', display: 'block' }} autoPlay playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button type="button" onClick={capturePhoto} className="btn" style={{ background: 'white', color: 'black', borderRadius: '50px', padding: '10px 20px', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    📸 Click Photo
                  </button>
                  <button type="button" onClick={stopCamera} className="btn btn-danger" style={{ borderRadius: '50px', padding: '10px' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Captured / Uploaded Image Preview */}
            {!isCameraOpen && previewUrl && (
              <div style={{ marginTop: '15px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--primary-light)', padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span>{file?.name || 'Captured Image'}</span>
                  <button type="button" onClick={() => { setPreviewUrl(''); setFile(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}>
                    <X size={16} />
                  </button>
                </div>
                {previewUrl.startsWith('data:application/pdf') ? (
                  <iframe src={previewUrl} style={{ width: '100%', height: '200px', border: 'none' }} title="Preview" />
                ) : previewUrl.startsWith('data:image/') ? (
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block', background: '#f5f5f5' }} />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', background: '#f5f5f5' }}>
                     <AlertCircle size={48} color="var(--primary-color)" />
                     <p style={{ marginTop: '10px' }}>File selected</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Submit Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
