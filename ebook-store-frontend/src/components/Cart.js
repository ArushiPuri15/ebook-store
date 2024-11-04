import React, { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';

const Cart = () => {
    const { cartItems, setCartItems, removeFromCart, totalAmount } = useCart();
    const stripe = useStripe();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCart = async () => {
            const token = localStorage.getItem('token');
    
            if (!token) {
                console.warn("Token is missing. Cannot fetch cart items.");
                return;
            }
    
            try {
                const response = await axios.get('http://localhost:5000/cart', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
    
                if (Array.isArray(response.data)) {
                    console.log("Setting cart items to:", response.data); // Log fetched items
                    setCartItems(response.data); // Only set items if the response is an array
                } else {
                    console.warn("Unexpected response format:", response.data);
                    setCartItems([]); // Fallback to empty array
                }
            } catch (error) {
                console.error("Error fetching cart items:", error);
                setError("Failed to fetch cart items. Please try again later.");
            }
        };
    
        fetchCart();
    }, [setCartItems]);
    
    
        

       

    const handleCheckout = async () => {
        setLoading(true);
        setError(''); // Reset any previous error
        const token = localStorage.getItem('token'); // Get the token from local storage

        try {
            // Prepare items for checkout
            const checkoutItems = cartItems.map(item => ({
                bookId: item.book.id, // Ensure book ID is used correctly
                quantity: item.quantity || 1, // Default to 1 if quantity is undefined
            }));

            const response = await axios.post(
                'http://localhost:5000/checkout',
                { items: checkoutItems },
                {
                    headers: {
                        'Authorization': `Bearer ${token}` // Include the token here
                    }
                }
            );

            const sessionId = response.data.sessionId; // Ensure this matches your backend response

            // Redirect to Stripe checkout
            const result = await stripe.redirectToCheckout({ sessionId });
            if (result.error) {
                setError(result.error.message);
            } else {
                // Clear cart after successful checkout
                setCartItems([]);
            }
        } catch (error) {
            console.error("Error initiating checkout:", error);
            setError("Failed to initiate checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    console.log("Cart Items:", cartItems); // Log current cart items for debugging

    return (
        <div className="cart">
            <h2>Your Cart</h2>
            {error && <p className="error">{error}</p>}
            {loading ? (
                <p>Loading...</p>
            ) : cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    <ul>
                        {cartItems.map((item) => (
                            <li key={item.id}>
                                <h3>{item.book?.title || "No Title"}</h3>
                                <p>${(item.book?.price || 0).toFixed(2)}</p>
                                <p>Quantity: {item.quantity || 1}</p>
                                <button onClick={() => removeFromCart(item.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                    <div className="cart-summary">
                        <p>Total Amount: ${totalAmount().toFixed(2)}</p>
                        <button className="checkout" onClick={handleCheckout} disabled={loading || cartItems.length === 0}>
                            {loading ? "Processing..." : "Checkout"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
    
}


export default Cart;
