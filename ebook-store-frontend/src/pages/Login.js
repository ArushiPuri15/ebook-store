import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // useNavigate hook for navigation

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/login`, {
                email,
                password,
            });

            // Assuming the response contains token and user role information
            const { token, role } = response.data;
            localStorage.setItem('token', token); // Store token in local storage
            
            alert('Login successful');

            // Redirect based on role
            if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/home'); // Redirect to user home or other protected route
            }
            
        } catch (err) {
            setError('Error logging in: ' + (err.response?.data?.message || err.message));
            console.error(err);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
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
                <button type="submit">Login</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
};

export default Login;
