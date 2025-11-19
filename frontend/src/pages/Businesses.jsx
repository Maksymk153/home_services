import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Businesses.css';

const Businesses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBusinesses();
  }, [page, searchParams]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      const category = searchParams.get('category');
      const city = searchParams.get('city');
      if (category) params.append('category', category);
      if (city) params.append('city', city);

      const response = await api.get(`/businesses?${params.toString()}`);
      setBusinesses(response.data.businesses || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="businesses-page">
      <div className="container">
        <h1>Business Directory</h1>
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : businesses.length === 0 ? (
          <p>No businesses found.</p>
        ) : (
          <>
            <div className="businesses-grid">
              {businesses.map((business) => (
                <div key={business.id} className="business-card" onClick={() => navigate(`/businesses/${business.id}`)}>
                  <h3>{business.name}</h3>
                  <div className="rating">
                    <span className="stars">{'★'.repeat(Math.floor(business.ratingAverage))}</span>
                    <span className="rating-value">{business.ratingAverage}</span>
                    <span className="rating-count">({business.ratingCount})</span>
                  </div>
                  <p className="description">{business.description?.substring(0, 150)}...</p>
                  <div className="business-info">
                    <p><i className="fas fa-map-marker-alt"></i> {business.city}, {business.state}</p>
                    {business.category && <p><i className="fas fa-tag"></i> {business.category.name}</p>}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Businesses;

