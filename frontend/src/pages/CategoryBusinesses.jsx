import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CategoryBusinesses.css';

const CategoryBusinesses = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    city: '',
    state: '',
    minRating: '',
    featured: false,
    sortBy: 'rating' // rating, name, newest
  });
  
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadCategoryAndBusinesses();
  }, [slug, page, filters]);

  const loadCategoryAndBusinesses = async () => {
    try {
      setLoading(true);
      
      // Load all categories
      const catResponse = await api.get('/categories');
      const allCategories = catResponse.data.categories || [];
      setCategories(allCategories);
      
      // Find current category
      const foundCategory = allCategories.find(c => c.slug === slug);
      
      if (!foundCategory) {
        navigate('/');
        return;
      }
      
      setCategory(foundCategory);
      
      // Set default category filter to current category if not set
      const currentCategoryId = filters.categoryId || foundCategory.id.toString();
      if (!filters.categoryId) {
        setFilters(prev => ({ ...prev, categoryId: foundCategory.id.toString() }));
      }
      
      // Load businesses with filters
      const params = {
        page,
        limit: 12
      };
      
      // Use categoryId filter if set, otherwise use current category
      const categoryId = parseInt(currentCategoryId);
      params.category = categoryId;
      
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;
      if (filters.state) params.state = filters.state;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.featured) params.featured = 'true';
      
      const bizResponse = await api.get('/businesses', { params });
      setBusinesses(bizResponse.data.businesses || []);
      setTotalPages(bizResponse.data.pages || 1);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: category?.id.toString() || '',
      city: '',
      state: '',
      minRating: '',
      featured: false,
      sortBy: 'rating'
    });
    setPage(1);
  };
  
  const handleCategoryChange = (categoryId) => {
    if (!categoryId) {
      // If "All Categories" selected, navigate to businesses page
      navigate('/businesses');
      return;
    }
    
    const selectedCategory = categories.find(c => c.id.toString() === categoryId);
    if (selectedCategory) {
      navigate(`/category/${selectedCategory.slug}`);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star"></i>);
    }
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star"></i>);
    }
    
    return stars;
  };

  if (loading && !category) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="category-businesses-page">
      <div className="category-header">
        <div className="container">
          <button onClick={() => navigate('/')} className="back-button">
            <i className="fas fa-arrow-left"></i> Back to Home
          </button>
          <div className="category-title">
            <i className={`fas fa-${category?.icon || 'briefcase'}`}></i>
            <h1>{category?.name}</h1>
          </div>
          <p className="category-description">{category?.description}</p>
          <div className="category-stats">
            <span><i className="fas fa-building"></i> {businesses.length} businesses found</span>
          </div>
        </div>
      </div>
      
      <div className="container">
        <div className="content-layout">
          {/* Filter Sidebar */}
          <aside className={`filter-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filter-header">
              <h3><i className="fas fa-filter"></i> Filters</h3>
              <button 
                className="clear-filters"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>
            
            <div className="filter-group">
              <label><i className="fas fa-search"></i> Search Business</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label><i className="fas fa-tag"></i> Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label><i className="fas fa-map-marker-alt"></i> City</label>
              <input
                type="text"
                placeholder="Enter city name"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label><i className="fas fa-map"></i> State</label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
              >
                <option value="">All States</option>
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
                <option value="IL">Illinois</option>
                <option value="WA">Washington</option>
                <option value="MA">Massachusetts</option>
                <option value="CO">Colorado</option>
                <option value="AZ">Arizona</option>
                <option value="OR">Oregon</option>
                <option value="MI">Michigan</option>
                <option value="NV">Nevada</option>
                <option value="GA">Georgia</option>
                <option value="TN">Tennessee</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label><i className="fas fa-star"></i> Minimum Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3.0">3.0+ Stars</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                />
                <span><i className="fas fa-crown"></i> Featured Only</span>
              </label>
            </div>
          </aside>
          
          {/* Mobile Filter Toggle */}
          <button 
            className="mobile-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-sliders-h"></i> {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          
          {/* Business Grid */}
          <main className="businesses-content">
            {loading ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : businesses.length === 0 ? (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <h3>No businesses found</h3>
                <p>Try adjusting your filters to see more results</p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="businesses-grid">
                  {businesses.map((business) => (
                    <div
                      key={business.id}
                      className="business-card"
                      onClick={() => navigate(`/businesses/${business.id}`)}
                    >
                      {business.isFeatured && (
                        <div className="featured-badge">
                          <i className="fas fa-crown"></i> Featured
                        </div>
                      )}
                      <h3>{business.name}</h3>
                      <div className="rating">
                        <div className="stars">{renderStars(business.ratingAverage)}</div>
                        <span className="rating-value">{business.ratingAverage.toFixed(1)}</span>
                        <span className="rating-count">({business.ratingCount} reviews)</span>
                      </div>
                      <p className="description">{business.description}</p>
                      <div className="business-info">
                        <div className="info-item">
                          <i className="fas fa-map-marker-alt"></i>
                          {business.city}, {business.state}
                        </div>
                        <div className="info-item">
                          <i className="fas fa-phone"></i>
                          {business.phone}
                        </div>
                        {business.website && (
                          <div className="info-item">
                            <i className="fas fa-globe"></i>
                            Website
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <i className="fas fa-chevron-left"></i> Previous
                    </button>
                    <span className="page-info">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CategoryBusinesses;

