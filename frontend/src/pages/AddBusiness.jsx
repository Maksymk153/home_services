import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

const AddBusiness = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', categoryId: '', address: '', city: '', state: '', zipCode: '',
    phone: '', email: '', website: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCategories();
  }, [user, navigate]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Clean up data before sending
      const cleanData = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        zipCode: formData.zipCode || null,
        email: formData.email || null,
        website: formData.website || null
      };
      
      console.log('Submitting business data:', cleanData);
      
      const response = await api.post('/businesses', cleanData);
      console.log('Response:', response.data);
      
      setSuccess('Business submitted successfully! It will be reviewed and approved soon.');
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to submit business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '700px' }}>
        <h2><i className="fas fa-plus-circle"></i> Add Your Business</h2>
        <p>Fill out the form below to submit your business for listing approval</p>
        
        {error && <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
        {success && <div className="alert alert-success"><i className="fas fa-check-circle"></i> {success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><i className="fas fa-briefcase"></i> Business Name *</label>
            <input 
              type="text" 
              required 
              placeholder="Enter your business name"
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
          
          <div className="form-group">
            <label><i className="fas fa-tag"></i> Category *</label>
            <select required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
              <option value="">Select a category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label><i className="fas fa-align-left"></i> Description *</label>
            <textarea 
              required 
              placeholder="Describe your business, services, and what makes you unique"
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label><i className="fas fa-map-marker-alt"></i> Street Address *</label>
            <input 
              type="text" 
              required 
              placeholder="123 Main Street"
              value={formData.address} 
              onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label><i className="fas fa-city"></i> City *</label>
              <input 
                type="text" 
                required 
                placeholder="City"
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-map"></i> State *</label>
              <input 
                type="text" 
                required 
                placeholder="CA"
                maxLength="2"
                value={formData.state} 
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })} 
              />
            </div>
            <div className="form-group">
              <label><i className="fas fa-mail-bulk"></i> Zip Code</label>
              <input 
                type="text" 
                placeholder="12345"
                value={formData.zipCode} 
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label><i className="fas fa-phone"></i> Phone Number *</label>
            <input 
              type="tel" 
              required 
              placeholder="(555) 123-4567"
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
            />
          </div>
          
          <div className="form-group">
            <label><i className="fas fa-envelope"></i> Email Address</label>
            <input 
              type="email" 
              placeholder="contact@yourbusiness.com"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            />
          </div>
          
          <div className="form-group">
            <label><i className="fas fa-globe"></i> Website</label>
            <input 
              type="url" 
              placeholder="https://yourbusiness.com"
              value={formData.website} 
              onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            {loading ? ' Submitting...' : ' Submit Business for Review'}
          </button>
          
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#7f8c8d', fontSize: '14px' }}>
            <i className="fas fa-info-circle"></i> Your business will be reviewed by our team and published once approved.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AddBusiness;

