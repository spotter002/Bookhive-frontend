import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          📚 BookHive
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          
          {user ? (
            <>
              <Link to="/add-book" className="navbar-link">Add Book</Link>
              <Link to="/cart" className="navbar-link">
                🛒 Cart ({cart.items.length})
              </Link>
              <Link to="/messages" className="navbar-link">💬 Messages</Link>
              <Link to="/profile" className="navbar-link">Profile</Link>
              <button onClick={handleLogout} className="btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;