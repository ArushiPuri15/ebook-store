// src/components/Navbar.js

import React, { useState } from 'react';
import { FaShoppingCart, FaComments } from 'react-icons/fa'; // Import FaComments here
import { Link } from 'react-router-dom';
import './Navbar.css';
import Chatbot from './Chatbot'; // Import your Chatbot component

const Navbar = ({ onLogout }) => { 
    const [isChatbotOpen, setIsChatbotOpen] = useState(false); // Manage chatbot state

    const toggleChatbot = () => {
        setIsChatbotOpen(prev => !prev); // Toggle the chatbot visibility
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <h1 className="navbar-title">Vintage eBook Library</h1>
                <ul className="navbar-links">
                    <li className="navbar-item"><Link to="/">Home</Link></li>
                    <li className="navbar-item"><Link to="/about">About</Link></li>
                    <li className="navbar-item"><Link to="/cart"><FaShoppingCart /> Cart</Link></li>
                    <li className="navbar-item"><Link to="/my-books">My Books</Link></li>
                    <li className="navbar-item"><Link to="/auth">Login/Signup</Link></li>
                    <li onClick={toggleChatbot} style={{ cursor: 'pointer' }}>
                        <FaComments /> Chat
                    </li>
                    <li>
                        <button onClick={onLogout}>Logout</button> {/* Trigger logout */}
                    </li>
                </ul>
            </div>
            {isChatbotOpen && <Chatbot onClose={toggleChatbot} />} {/* Conditionally render the Chatbot */}
        </nav>
    );
};

export default Navbar;
