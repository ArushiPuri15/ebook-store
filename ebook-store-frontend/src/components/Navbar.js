import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar =({ onLogout }) => { 
    return (
        <nav className="navbar">
            <div className="navbar-content">
                <h1 className="navbar-title">Vintage eBook Library</h1>
                <ul className="navbar-links">
                    <li className="navbar-item"><Link to="/">Home</Link></li>
                    <li className="navbar-item"><Link to="/about">About</Link></li>
                    <li className="navbar-item"><Link to="/cart"><FaShoppingCart /> Cart</Link></li>
                    <li className="navbar-item"><Link to="/auth">Login/Signup</Link></li>
                    <li className="navbar-item"><Link to="/my-books">My Books</Link></li>
                    <li>
                    <button onClick={onLogout}>Logout</button> {/* Trigger logout */}
                </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
