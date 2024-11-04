import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [error, setError] = useState(null);

    // Function to fetch cart items from the backend
    const fetchCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No token found.");
            return;
        }
    
        try {
            const response = await axios.get('http://localhost:5000/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update cart items with fetched data
            if (Array.isArray(response.data)) {
                setCartItems(response.data);
            } else {
                console.warn("Unexpected data format from backend:", response.data);
                setCartItems([]);
            }
        } catch (error) {
            console.error("Error fetching cart items:", error);
            setError("Failed to fetch cart items. Please try again later.");
        }
    };

    // Add item to the cart and refetch the updated cart
    const addToCart = async (item) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No token found.");
            return;
        }
    
        try {
            // Send add-to-cart request to backend
            await axios.post(
                'http://localhost:5000/cart',
                { bookId: item.id, quantity: item.quantity || 1 },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Refetch cart items from the backend after adding
            await fetchCart();
    
        } catch (error) {
            console.error("Error adding item to cart:", error);
        }
    };

    // Remove item from the cart, both locally and on the backend
    const removeFromCart = async (itemId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No token found.");
            return;
        }

        try {
            // Send request to backend to remove item
            await axios.delete(`http://localhost:5000/cart/${itemId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Refetch cart items from the backend after removal
            await fetchCart();
    
        } catch (error) {
            console.error("Error removing item from cart:", error);
        }
    };

    // Calculate the total amount of the cart items
    const totalAmount = () => {
        return cartItems.reduce((total, item) => {
            const price = item.book?.price || 0; // Use optional chaining to avoid errors
            const quantity = item.quantity || 1; // Default quantity to 1 if undefined
            return total + price * quantity;
        }, 0);
    };

    // Fetch cart items on component mount
    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, totalAmount, error }}>
            {children}
        </CartContext.Provider>
    );
};
