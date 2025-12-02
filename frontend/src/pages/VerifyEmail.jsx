import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      setStatus('success');
      setMessage(response.data.message);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '500px', textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <div className="verification-icon">
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '60px', color: '#667eea' }}></i>
            </div>
            <h2>Verifying Your Email</h2>
            <p style={{ color: '#666' }}>Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verification-icon success">
              <i className="fas fa-check-circle" style={{ fontSize: '80px', color: '#10b981' }}></i>
            </div>
            <h2 style={{ color: '#10b981' }}>Email Verified!</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>{message}</p>
            <Link to="/login" className="btn-primary" style={{ 
              display: 'inline-block', 
              padding: '14px 30px', 
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              <i className="fas fa-sign-in-alt"></i> Continue to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verification-icon error">
              <i className="fas fa-exclamation-circle" style={{ fontSize: '80px', color: '#ef4444' }}></i>
            </div>
            <h2 style={{ color: '#ef4444' }}>Verification Failed</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>{message}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn-secondary" style={{ 
                display: 'inline-block', 
                padding: '14px 30px', 
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                background: '#f3f4f6',
                color: '#374151'
              }}>
                Go to Login
              </Link>
              <Link to="/register" className="btn-primary" style={{ 
                display: 'inline-block', 
                padding: '14px 30px', 
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                Register Again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

