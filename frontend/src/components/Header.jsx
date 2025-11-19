import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/">
              <img src="/assets/images/logo.png" alt="CityLocal 101 Logo" className="logo-img" />
            </Link>
          </div>
          <nav className={`nav ${mobileMenuOpen ? 'active' : ''}`}>
            <ul className="nav-list">
              <li><Link to="/" className="home-link"><i className="fas fa-home"></i> Home</Link></li>
              <li><Link to="/businesses"><i className="fas fa-building"></i> Businesses</Link></li>
              <li><Link to="/blog"><i className="fas fa-blog"></i> Blog</Link></li>
              <li><Link to="/support"><i className="fas fa-headset"></i> Support</Link></li>
              {user ? (
                <>
                  <li><Link to="/add-business" className="add-business-btn"><i className="fas fa-plus-circle"></i> Add Business</Link></li>
                  <li><span className="user-name"><i className="fas fa-user-circle"></i> {user.name}</span></li>
                  {user.role === 'admin' && (
                    <li><Link to="/admin" className="admin-link"><i className="fas fa-shield-alt"></i> Admin</Link></li>
                  )}
                  <li><button onClick={handleLogout} className="btn-logout"><i className="fas fa-sign-out-alt"></i> Logout</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" className="login-btn"><i className="fas fa-sign-in-alt"></i> LOGIN</Link></li>
                  <li><Link to="/add-business" className="btn-primary"><i className="fas fa-plus-circle"></i> Add Your Business</Link></li>
                </>
              )}
            </ul>
          </nav>
          <div 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

