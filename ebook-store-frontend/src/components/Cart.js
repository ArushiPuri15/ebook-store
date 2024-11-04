import React, { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';

const Cart = () => {
    const { cartItems, setCartItems, removeFromCart, totalAmount, error } = useCart();
    const stripe = useStripe();
    const [loading, setLoading] = useState(false);

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
                    setCartItems(response.data);
                } else {
                    console.warn("Unexpected response format:", response.data);
                    setCartItems([]);
                }
            } catch (error) {
                console.error("Error fetching cart items:", error);
            }
        };

        fetchCart();
    }, [setCartItems]);

    const handleCheckout = async () => {
        setLoading(true);

        const token = localStorage.getItem('token');
        try {
            const checkoutItems = cartItems.map(item => ({
                bookId: item.book.id,
                quantity: item.quantity || 1,
            }));

            const response = await axios.post(
                'http://localhost:5000/checkout',
                { items: checkoutItems },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const sessionId = response.data.sessionId;

            const result = await stripe.redirectToCheckout({ sessionId });
            if (result.error) {
                console.error(result.error.message);
            } else {
                setCartItems([]);
            }
        } catch (error) {
            console.error("Error initiating checkout:", error);
        } finally {
            setLoading(false);
        }
    };

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
};

export default Cart;
