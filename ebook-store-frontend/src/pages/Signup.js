import React, { useState } from 'react';
import axios from 'axios';

console.log("API Base URL:", process.env.REACT_APP_API_BASE_URL);


const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); // Default role
    const [error, setError] = useState(null);

    // Replace with your allowed admin domain
    const ADMIN_DOMAIN = 'vitbhopal.ac.in'; 

    const isAdminEmail = (email) => {
        const domain = email.split('@')[1];
        return domain === ADMIN_DOMAIN;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        
        if (role === 'admin' && !isAdminEmail(email)) {
            setError('Admin access is restricted to specific email domains.');
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/signup`, {
                email,
                password,
                role, // Include the chosen role in the request
            });
            alert('Signup successful');
        } catch (err) {
            setError('Error signing up: ' + err.message);
            console.error(err);
        }
    };

    return (
        <div>
            <h2>Signup</h2>
            <form onSubmit={handleSignup}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin" disabled={!isAdminEmail(email)}>Admin</option>
                </select>
                <button type="submit">Sign Up</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
};

export default Signup;
