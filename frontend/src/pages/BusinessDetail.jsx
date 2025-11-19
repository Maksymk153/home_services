import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusiness();
  }, [id]);

  const loadBusiness = async () => {
    try {
      const [businessRes, reviewsRes] = await Promise.all([
        api.get(`/businesses/${id}`),
        api.get(`/reviews?business=${id}`)
      ]);
      setBusiness(businessRes.data.business);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!business) return <div className="container"><p>Business not found</p></div>;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1>{business.name}</h1>
      <div className="rating" style={{ marginBottom: '20px' }}>
        <span className="stars">{'★'.repeat(Math.floor(business.ratingAverage))}</span>
        <span className="rating-value">{business.ratingAverage}</span>
        <span>({business.ratingCount} reviews)</span>
      </div>
      <p style={{ marginBottom: '30px', fontSize: '18px', color: '#666' }}>{business.description}</p>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Contact Information</h3>
        <p><i className="fas fa-map-marker-alt"></i> {business.address}, {business.city}, {business.state} {business.zipCode}</p>
        <p><i className="fas fa-phone"></i> {business.phone}</p>
        {business.email && <p><i className="fas fa-envelope"></i> {business.email}</p>}
        {business.website && <p><i className="fas fa-globe"></i> <a href={business.website} target="_blank" rel="noopener">{business.website}</a></p>}
      </div>

      <div>
        <h3>Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>{review.user?.name || 'Anonymous'}</strong>
                <span className="stars">{'★'.repeat(review.rating)}</span>
              </div>
              <h4>{review.title}</h4>
              <p>{review.comment}</p>
            </div>
          ))
        )}
        <button className="btn-primary" onClick={() => navigate('/write-review')} style={{ marginTop: '20px' }}>
          Write a Review
        </button>
      </div>
    </div>
  );
};

export default BusinessDetail;

