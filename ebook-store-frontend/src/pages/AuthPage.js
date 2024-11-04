import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './AuthPage.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize useNavigate

    const ADMIN_DOMAIN = 'vitbhopal.ac.in';
    const isAdminEmail = (email) => email.endsWith(`@${ADMIN_DOMAIN}`);

    const handleAuth = async (e) => {
        e.preventDefault();
    
        if (!isLogin && role === 'admin' && !isAdminEmail(email)) {
            setError('Admin access is restricted to specific email domains.');
            return;
        }
    
        try {
            const endpoint = isLogin ? 'login' : 'signup';
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/${endpoint}`, {
                email,
                password,
                ...(isLogin ? {} : { role }),
            });
    
            if (response.status === 200 || response.status === 201) {
                localStorage.setItem('token', response.data.token);
                alert('Login successful');
    
                const userRole = response.data.user?.role; 
                console.log('User role after login:', userRole);
    
                if (userRole === 'admin') {
                    console.log('Navigating to admin panel');
                    navigate('/admin'); 
                } else {
                    navigate('/'); 
                }
                
            } else {
                setError(response.data.message || 'An unexpected error occurred');
            }
        } catch (err) {
            if (err.response) {
                console.error('Error response:', err.response);
                setError(err.response.data.message || 'An error occurred');
            } else {
                console.error('Error:', err);
                setError('An unexpected error occurred');
            }
        }
    };
    
    

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h2 className="auth-title">{isLogin ? 'Login' : 'Sign Up'}</h2>
                <form onSubmit={handleAuth}>
                    <input
                        type="email"
                        className="auth-input"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="auth-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {!isLogin && (
                        <select className="auth-input" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="user">User</option>
                            <option value="admin" disabled={!isAdminEmail(email)}>Admin</option>
                        </select>
                    )}
                    <button type="submit" className="auth-button">{isLogin ? 'Login' : 'Sign Up'}</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
                <p className="auth-toggle">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="auth-switch">
                        {isLogin ? 'Sign up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
