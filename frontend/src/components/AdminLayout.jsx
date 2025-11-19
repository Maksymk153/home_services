import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/admin', icon: 'fas fa-dashboard', label: 'Dashboard', exact: true },
    { path: '/admin/businesses', icon: 'fas fa-building', label: 'Businesses' },
    { path: '/admin/users', icon: 'fas fa-users', label: 'Users' },
    { path: '/admin/reviews', icon: 'fas fa-star', label: 'Reviews' },
    { path: '/admin/categories', icon: 'fas fa-tags', label: 'Categories' },
    { path: '/admin/blogs', icon: 'fas fa-blog', label: 'Blogs' },
    { path: '/admin/contacts', icon: 'fas fa-envelope', label: 'Contacts' },
    { path: '/admin/activities', icon: 'fas fa-history', label: 'Activities' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2><i className="fas fa-shield-alt"></i> Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          {menuItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item">
            <i className="fas fa-home"></i>
            <span>View Site</span>
          </Link>
          <button onClick={handleLogout} className="admin-nav-item logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-content">
            <h1>Admin Dashboard</h1>
            <div className="admin-user-info">
              <span><i className="fas fa-user-circle"></i> {user?.name}</span>
            </div>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

