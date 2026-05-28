import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import { FileText, Trash2, Edit, X, Send, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ReportCard = ({ record }) => {
  const { currentUser } = useAuth();
  const { deleteRecord, updateRecord } = useRecords();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const { t } = useLanguage();
  
  // Comments state
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const isHospitalUpload = record.uploaderType === 'HOSPITAL';
  const isMine = (currentUser?.role === 'PATIENT' && record.uploaderType === 'PATIENT') ||
                 (currentUser?.role === 'HOSPITAL' && record.uploaderName === currentUser?.name);

  // Resolve image URL (now uses Cloudinary URLs from backend)
  const getImageUrl = () => {
    if (!record.imageUrl) return null;
    return record.imageUrl;
  };
  const resolvedImageUrl = getImageUrl();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteRecord(record.id);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now().toString(),
      text: newComment.trim(),
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };
    const updatedComments = [...(record.comments || []), commentObj];
    updateRecord(record.id, { comments: updatedComments });
    setNewComment('');
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleEditSubmit = (commentId) => {
    if (!editCommentText.trim()) return;
    const updatedComments = (record.comments || []).map(c => {
      if (c.id === commentId) {
        return { ...c, text: editCommentText.trim(), status: 'edited', updatedAt: new Date().toISOString() };
      }
      return c;
    });
    updateRecord(record.id, { comments: updatedComments });
    setEditingCommentId(null);
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      const updatedComments = (record.comments || []).map(c => {
        if (c.id === commentId) {
          return { ...c, status: 'deleted', updatedAt: new Date().toISOString() };
        }
        return c;
      });
      updateRecord(record.id, { comments: updatedComments });
    }
  };

  const comments = record.comments || [];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.8rem', background: isHospitalUpload ? '#f0fff4' : 'var(--primary-light)', color: isHospitalUpload ? 'var(--success-color)' : 'var(--primary-color)', padding: '2px 10px', borderRadius: '12px', fontWeight: 700 }}>
          {isHospitalUpload ? t('verified') : t('private')}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {new Date(record.date || record.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>
      
      <h3>{record.title}</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
        Uploaded by: <strong>{record.uploaderName}</strong>
      </p>

      {record.description && (
        <p style={{ marginBottom: '15px' }}>{record.description}</p>
      )}

      {resolvedImageUrl && (
        <div style={{ marginBottom: '15px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {resolvedImageUrl.startsWith('data:application/pdf') ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--primary-light)' }}><FileText size={48} color="var(--primary-color)" /><p style={{marginTop: '10px'}}>PDF Document</p></div>
          ) : (
            <img src={resolvedImageUrl} alt="Document" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }} />
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
        {resolvedImageUrl && (
          <button onClick={() => setIsViewerOpen(true)} className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>
            <FileText size={18} /> {t('view_document')}
          </button>
        )}
        
        {isMine && (
          <button className="btn btn-danger" onClick={handleDelete} title="Delete">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* --- Comments Section --- */}
      <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
        <div 
          onClick={() => comments.length > 0 && setIsCommentsExpanded(!isCommentsExpanded)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: comments.length > 0 ? 'pointer' : 'default',
            marginBottom: isCommentsExpanded ? '15px' : '0'
          }}
        >
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', margin: 0, color: 'var(--primary-dark)' }}>
            <MessageSquare size={18} /> Doctor Remarks
            <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '12px', marginLeft: '5px' }}>
              {comments.filter(c => c.status !== 'deleted').length}
            </span>
          </h4>
          {comments.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600 }}>
              {isCommentsExpanded ? 'Hide' : 'View All'}
            </span>
          )}
        </div>
        
        {comments.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '10px' }}>No remarks yet.</p>
        ) : isCommentsExpanded ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', animation: 'fadeIn 0.3s' }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>{comment.doctorName}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(comment.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                
                {comment.status === 'deleted' ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                    <del>This comment was deleted.</del>
                  </p>
                ) : editingCommentId === comment.id ? (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                    />
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => handleEditSubmit(comment.id)}>Save</button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setEditingCommentId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.4', color: '#2d3748' }}>
                      {comment.text}
                      {comment.status === 'edited' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>(edited)</span>}
                    </p>
                    {currentUser?.role === 'DOCTOR' && currentUser.id === comment.doctorId && (
                      <div style={{ display: 'flex', gap: '15px', marginTop: '10px', borderTop: '1px solid #f7fafc', paddingTop: '8px' }}>
                        <button onClick={() => startEditing(comment)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}>Edit</button>
                        <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}>Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {currentUser?.role === 'DOCTOR' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Add a medical remark..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              style={{ padding: '0.5rem', fontSize: '0.9rem' }}
            />
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleAddComment}>
              <Send size={16} />
            </button>
          </div>
        )}
      </div>

      {isViewerOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <h2>{record.title}</h2>
            <button onClick={() => setIsViewerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={32} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', width: '100%', overflow: 'hidden' }}>
            {resolvedImageUrl.startsWith('data:application/pdf') ? (
               <iframe src={resolvedImageUrl} style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '4px' }} title="Document Preview" />
            ) : (
               <img src={resolvedImageUrl} alt="Document View" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportCard;
