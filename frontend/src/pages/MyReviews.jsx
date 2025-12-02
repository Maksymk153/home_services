import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './MyReviews.css';

const MyReviews = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('my-reviews');
  const [reviews, setReviews] = useState([]);
  const [businessReviews, setBusinessReviews] = useState([]);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Request Review Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    businessId: '',
    customerEmail: '',
    customerName: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, businessesRes] = await Promise.all([
        api.get('/reviews/my-reviews'),
        api.get('/businesses')
      ]);
      
      setReviews(reviewsRes.data.reviews || []);
      
      // Filter businesses owned by current user
      const owned = (businessesRes.data.businesses || []).filter(b => b.ownerId === user?.id);
      setMyBusinesses(owned);
      
      // Fetch reviews for owned businesses
      if (owned.length > 0) {
        const businessIds = owned.map(b => b.id);
        const allBusinessReviews = [];
        
        for (const biz of owned) {
          try {
            const res = await api.get(`/reviews?business=${biz.id}`);
            const reviewsWithBusiness = (res.data.reviews || []).map(r => ({
              ...r,
              businessName: biz.name,
              businessId: biz.id
            }));
            allBusinessReviews.push(...reviewsWithBusiness);
          } catch (err) {
            console.error('Error fetching reviews for business:', biz.id);
          }
        }
        
        setBusinessReviews(allBusinessReviews);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await api.delete(`/reviews/${reviewId}`);
        setReviews(reviews.filter(review => review.id !== reviewId));
        setMessage({ type: 'success', text: 'Review deleted successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to delete review' });
      }
    }
  };

  const handleRequestReview = async (e) => {
    e.preventDefault();
    
    if (!requestForm.businessId || !requestForm.customerEmail) {
      setMessage({ type: 'error', text: 'Please select a business and enter customer email' });
      return;
    }

    setRequestLoading(true);
    try {
      await api.post('/reviews/request', requestForm);
      setMessage({ type: 'success', text: 'Review request sent successfully!' });
      setShowRequestModal(false);
      setRequestForm({ businessId: '', customerEmail: '', customerName: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to send review request' });
    } finally {
      setRequestLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <i
            key={star}
            className={`fas fa-star ${star <= rating ? 'filled' : ''}`}
          ></i>
        ))}
      </div>
    );
  };

  const formatLastLogin = (date) => {
    if (!date) return 'Never';
    const loginDate = new Date(date);
    return loginDate.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="my-reviews-container">
      <div className="reviews-header">
        <h1>Hello {user?.firstName || user?.name || 'User'}!</h1>
        <p className="last-login">
          You last logged in at: {formatLastLogin(user?.lastLogin)}
        </p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="alert-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="reviews-content">
        {/* Tabs */}
        <div className="reviews-tabs">
          <button 
            className={`tab-btn ${activeTab === 'my-reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-reviews')}
          >
            <i className="fas fa-pen"></i>
            My Reviews
            <span className="tab-count">{reviews.length}</span>
          </button>
          {myBusinesses.length > 0 && (
            <button 
              className={`tab-btn ${activeTab === 'business-reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('business-reviews')}
            >
              <i className="fas fa-store"></i>
              Reviews on My Businesses
              <span className="tab-count">{businessReviews.length}</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="reviews-actions">
          {myBusinesses.length > 0 && (
            <button 
              className="action-btn primary"
              onClick={() => setShowRequestModal(true)}
            >
              <i className="fas fa-paper-plane"></i>
              Request Review from Customer
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading reviews...</p>
          </div>
        ) : activeTab === 'my-reviews' ? (
          /* My Reviews Tab */
          reviews.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-comments"></i>
              <h3>No Reviews Yet</h3>
              <p>You haven't written any reviews yet.</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="business-info">
                      {review.Business?.logo && (
                        <img 
                          src={review.Business.logo} 
                          alt={review.Business.name}
                          className="business-logo"
                        />
                      )}
                      <div>
                        <h3>{review.Business?.name || 'Unknown Business'}</h3>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="review-actions">
                      <button 
                        onClick={() => handleDelete(review.id)} 
                        className="delete-btn"
                        title="Delete Review"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                  <p className="review-text">{review.comment}</p>
                  <div className="review-footer">
                    <span className="review-date">
                      <i className="fas fa-calendar"></i>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    {review.Business?.id && (
                      <Link 
                        to={`/businesses/${review.Business.id}`} 
                        className="view-business-link"
                      >
                        View Business <i className="fas fa-arrow-right"></i>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Business Reviews Tab */
          businessReviews.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-star"></i>
              <h3>No Reviews Yet</h3>
              <p>Your businesses haven't received any reviews yet.</p>
              <button 
                className="empty-state-btn"
                onClick={() => setShowRequestModal(true)}
              >
                Request a Review
              </button>
            </div>
          ) : (
            <div className="reviews-grid">
              {businessReviews.map(review => (
                <div key={review.id} className="review-card business-review">
                  <div className="review-header">
                    <div className="business-info">
                      <div className="reviewer-avatar">
                        {review.user?.avatar ? (
                          <img src={review.user.avatar} alt={review.user.name} />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div>
                        <h3>{review.user?.name || 'Anonymous'}</h3>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="business-badge">
                      <i className="fas fa-store"></i>
                      {review.businessName}
                    </div>
                  </div>
                  {review.title && <h4 className="review-title">{review.title}</h4>}
                  <p className="review-text">{review.comment}</p>
                  <div className="review-footer">
                    <span className="review-date">
                      <i className="fas fa-calendar"></i>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    <Link 
                      to={`/businesses/${review.businessId}`} 
                      className="view-business-link"
                    >
                      View Business <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Request Review Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-paper-plane"></i> Request Review</h3>
              <button className="modal-close" onClick={() => setShowRequestModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className="modal-description">
              Send an email to a customer asking them to leave a review for your business.
            </p>
            <form onSubmit={handleRequestReview}>
              <div className="form-group">
                <label>Select Business *</label>
                <select 
                  value={requestForm.businessId}
                  onChange={(e) => setRequestForm({...requestForm, businessId: e.target.value})}
                  required
                >
                  <option value="">Choose a business...</option>
                  {myBusinesses.map(biz => (
                    <option key={biz.id} value={biz.id}>{biz.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Customer Email *</label>
                <input 
                  type="email"
                  value={requestForm.customerEmail}
                  onChange={(e) => setRequestForm({...requestForm, customerEmail: e.target.value})}
                  placeholder="customer@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Customer Name (Optional)</label>
                <input 
                  type="text"
                  value={requestForm.customerName}
                  onChange={(e) => setRequestForm({...requestForm, customerName: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={requestLoading}>
                  {requestLoading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Send Request</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviews;
