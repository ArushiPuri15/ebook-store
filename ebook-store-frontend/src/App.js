import React, { useEffect, useState } from 'react';  
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './hooks/useCart'; 
import Home from './pages/Home';
import Navbar from './components/Navbar';
import BookDetail from './pages/BookDetail';
import MyBooks from './pages/MyBooks';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Cart from './components/Cart';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { jwtDecode } from 'jwt-decode';  
import CheckoutSuccess from './components/CheckoutSuccess';
import CheckoutCancel from './components/CheckoutCancel';
import './App.css';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLIC_KEY
    ? loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY)
    : null;

const App = () => {
    const [isAdmin, setIsAdmin] = useState(false);

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAdmin(false);
        window.location.href = '/';
    };

    useEffect(() => {
        const token = localStorage.getItem('token'); // Move token retrieval inside useEffect
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setIsAdmin(decodedToken.role === 'admin');
            } catch (error) {
                console.error("Token decoding error:", error);
                setIsAdmin(false);
            }
        } else {
            setIsAdmin(false); // Reset if no token
        }
    }, []); // This will run only once when the component mounts

    return (
        <CartProvider>
            <Router>
                <Navbar onLogout={handleLogout} /> {/* Pass logout function to Navbar */}
                <div className="main-content">
                    {stripePromise ? (
                        <Elements stripe={stripePromise}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/books/:id" element={<BookDetail />} />
                                <Route path="/my-books" element={<MyBooks />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedRoute isAdmin={isAdmin}>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="/checkout-success" element={<CheckoutSuccess />} />
                                <Route path="/checkout-cancel" element={<CheckoutCancel />} />
                            </Routes>
                        </Elements>
                    ) : (
                        <div>Loading Stripe...</div>
                    )}
                </div>
            </Router>
        </CartProvider>
    );
};

export default App;
