import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Replace with your backend server URL if different

// Function to fetch all books
export const fetchBooks = async () => {
    try {
        const response = await axios.get(`${API_URL}/books`);
        return response.data;
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error; // Rethrow error for further handling if necessary
    }
};

// Function to fetch a single book by ID
export const fetchBookById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/books/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching book with ID ${id}:`, error);
        throw error;
    }
};

// Function to create a new user (Signup)
export const signup = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/signup`, data);
        return response.data;
    } catch (error) {
        console.error('Error during signup:', error);
        throw error;
    }
};

// Function to login a user
export const login = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/login`, data);
        return response.data;
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};

// Function to initiate a checkout session for a book purchase
export const initiateCheckout = async (bookId, token) => {
    try {
        const response = await axios.post(`${API_URL}/api/checkout`, { bookId }, {
            headers: {
                Authorization: `Bearer ${token}`, // Include the JWT token for authenticated requests
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error initiating checkout:', error);
        throw error;
    }
};

// Function to confirm payment based on the session ID
export const confirmPayment = async (sessionId) => {
    try {
        const response = await axios.post(`${API_URL}/api/confirm-payment`, { sessionId });
        return response.data;
    } catch (error) {
        console.error('Error confirming payment:', error);
        throw error;
    }
};

// Create an object to hold all the exported functions
const api = {
    fetchBooks,
    fetchBookById,
    signup,
    login,
    initiateCheckout,
    confirmPayment,
};

// Export the api object as the default export
export default api;
