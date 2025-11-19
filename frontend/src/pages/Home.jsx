import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessSuggestions, setBusinessSuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showBusinessSuggestions, setShowBusinessSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const businessInputRef = useRef(null);
  const locationInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, businessesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/businesses?limit=6&featured=true')
      ]);
      setCategories(categoriesRes.data.categories || []);
      setBusinesses(businessesRes.data.businesses || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (location) params.append('city', location);
    navigate(`/search?${params.toString()}`);
    setShowBusinessSuggestions(false);
    setShowLocationSuggestions(false);
  };

  const handleBusinessInputChange = async (value) => {
    setSearchQuery(value);
    
    if (value.length > 1) {
      try {
        const response = await api.get(`/businesses?limit=5&search=${value}`);
        setBusinessSuggestions(response.data.businesses || []);
        setShowBusinessSuggestions(true);
      } catch (error) {
        console.error('Error fetching business suggestions:', error);
      }
    } else {
      setBusinessSuggestions([]);
      setShowBusinessSuggestions(false);
    }
  };

  const handleLocationInputChange = async (value) => {
    setLocation(value);
    
    if (value.length > 1) {
      try {
        const response = await api.get(`/businesses?limit=100`);
        const uniqueLocations = [...new Set(
          response.data.businesses.map(b => `${b.city}, ${b.state}`)
        )].filter(loc => 
          loc.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);
        
        setLocationSuggestions(uniqueLocations);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      }
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  };

  const selectBusinessSuggestion = (business) => {
    setSearchQuery(business.name);
    setShowBusinessSuggestions(false);
    navigate(`/businesses/${business.id}`);
  };

  const selectLocationSuggestion = (location) => {
    setLocation(location);
    setShowLocationSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (businessInputRef.current && !businessInputRef.current.contains(e.target)) {
        setShowBusinessSuggestions(false);
      }
      if (locationInputRef.current && !locationInputRef.current.contains(e.target)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Discover Businesses Near You</h1>
            <p>Helping you find the best service providers in your area</p>
            <form onSubmit={handleSearch} className="search-box">
              <div className="search-input-wrapper" ref={businessInputRef}>
                <input
                  type="text"
                  placeholder="Search for businesses..."
                  value={searchQuery}
                  onChange={(e) => handleBusinessInputChange(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowBusinessSuggestions(true)}
                />
                {showBusinessSuggestions && businessSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {businessSuggestions.map((business) => (
                      <div
                        key={business.id}
                        className="suggestion-item"
                        onClick={() => selectBusinessSuggestion(business)}
                      >
                        <i className="fas fa-building"></i>
                        <div className="suggestion-content">
                          <strong>{business.name}</strong>
                          <span>{business.city}, {business.state}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="search-input-wrapper" ref={locationInputRef}>
                <input
                  type="text"
                  placeholder="Location (City, State)"
                  value={location}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  onFocus={() => location.length > 1 && setShowLocationSuggestions(true)}
                />
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {locationSuggestions.map((loc, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => selectLocationSuggestion(loc)}
                      >
                        <i className="fas fa-map-marker-alt"></i>
                        <div className="suggestion-content">
                          <strong>{loc}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="search-btn">
                <i className="fas fa-search"></i> Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <div className="container">
          <div className="categories-header">
            <h2>Browse Categories</h2>
            <p>Explore businesses by category</p>
          </div>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="categories-grid">
                {categories.slice(0, 8).map((category) => (
                  <div key={category.id} className="category-card" onClick={() => navigate(`/category/${category.slug}`)}>
                    <i className={`fas fa-${category.icon || 'briefcase'}`}></i>
                    <h3>{category.name}</h3>
                    <p>{category.businessCount || 0} businesses</p>
                  </div>
                ))}
              </div>
              {categories.length > 8 && (
                <div className="view-all-categories">
                  <button className="btn-secondary" onClick={() => navigate('/businesses')}>
                    <i className="fas fa-th"></i> View All Categories & Businesses
                  </button>
                  <p className="categories-count">
                    <i className="fas fa-info-circle"></i> Showing 8 of {categories.length} categories
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Top Businesses */}
      <section className="business-listings">
        <div className="container">
          <h2>Top Rated Business Listings</h2>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="listings-grid">
              {businesses.map((business) => (
                <div key={business.id} className="listing-card" onClick={() => navigate(`/businesses/${business.id}`)}>
                  <div className="listing-header">
                    <h3>{business.name}</h3>
                    <div className="rating">
                      <span className="stars">{'★'.repeat(Math.floor(business.ratingAverage))}</span>
                      <span className="rating-value">{business.ratingAverage}</span>
                    </div>
                  </div>
                  <p className="listing-description">{business.description?.substring(0, 100)}...</p>
                  <div className="listing-info">
                    <p><i className="fas fa-map-marker-alt"></i> {business.city}, {business.state}</p>
                    {business.category && <p><i className="fas fa-tag"></i> {business.category.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="view-all">
            <button className="btn-secondary" onClick={() => navigate('/businesses')}>
              View All Businesses
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

