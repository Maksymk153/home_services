import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminTable.css';

const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBusinesses();
  }, [currentPage, filter]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/businesses?page=${currentPage}&limit=20`);
      setBusinesses(response.data.businesses);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error loading businesses:', error);
      alert('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this business?')) return;
    
    try {
      await api.put(`/admin/businesses/${id}/approve`);
      alert('Business approved successfully!');
      loadBusinesses();
    } catch (error) {
      console.error('Error approving business:', error);
      alert('Failed to approve business');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/admin/businesses/${id}`);
      alert('Business deleted successfully!');
      loadBusinesses();
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business');
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    if (filter === 'pending') return !b.isActive;
    if (filter === 'active') return b.isActive;
    return true;
  });

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h2>Business Management</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({businesses.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({businesses.filter(b => !b.isActive).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({businesses.filter(b => b.isActive).length})
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Business Name</th>
              <th>Category</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => (
                <tr key={business.id}>
                  <td>{business.id}</td>
                  <td>
                    <strong>{business.name}</strong>
                    <br />
                    <small>{business.phone}</small>
                  </td>
                  <td>{business.category?.name || 'N/A'}</td>
                  <td>
                    {business.owner?.name || 'N/A'}
                    <br />
                    <small>{business.owner?.email}</small>
                  </td>
                  <td>{business.city}, {business.state}</td>
                  <td>
                    <span className="rating-stars">
                      {'★'.repeat(Math.floor(business.ratingAverage))}
                      {'☆'.repeat(5 - Math.floor(business.ratingAverage))}
                    </span>
                    <br />
                    <small>{business.ratingAverage} ({business.ratingCount} reviews)</small>
                  </td>
                  <td>
                    <span className={`status-badge ${business.isActive ? 'active' : 'pending'}`}>
                      {business.isActive ? 'Active' : 'Pending'}
                    </span>
                    {business.isVerified && (
                      <span className="status-badge verified">Verified</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!business.isActive && (
                        <button 
                          className="btn-approve"
                          onClick={() => handleApprove(business.id)}
                          title="Approve Business"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(business.id)}
                        title="Delete Business"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-state">No businesses found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminBusinesses;

