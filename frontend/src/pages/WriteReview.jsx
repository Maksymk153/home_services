import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

const WriteReview = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [businesses, setBusinesses] = useState([]);
  const [formData, setFormData] = useState({ businessId: '', rating: 0, title: '', comment: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadBusinesses();
  }, [user, navigate]);

  const loadBusinesses = async () => {
    try {
      const response = await api.get('/businesses?limit=100');
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/reviews', formData);
      setSuccess('Review submitted successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Write a Review</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Business *</label>
            <select required value={formData.businessId} onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}>
              <option value="">Select a business</option>
              {businesses.map(biz => <option key={biz.id} value={biz.id}>{biz.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Rating *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className="star" onClick={() => setFormData({ ...formData, rating: star })}>
                  {star <= formData.rating ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Title *</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Your Review *</label>
            <textarea required value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WriteReview;

