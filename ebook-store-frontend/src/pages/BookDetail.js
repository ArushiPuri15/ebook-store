import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart'; // Import the useCart hook
import './BookDetail.css';

const BookDetail = () => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [error, setError] = useState(null);
    const { addToCart } = useCart(); // Get addToCart function from context

    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/books/${id}`);
                setBook(response.data);
            } catch (error) {
                console.error("Error fetching book details:", error);
                setError("Failed to load book details. Please try again later.");
            }
        };

        fetchBookDetails();
    }, [id]);

    if (error) {
        return <div>{error}</div>;
    }

    if (!book) {
        return <div className="loading">Loading...</div>;
    }

    const handleAddToCart = () => {
        addToCart(book); // Call addToCart with the current book
        console.log(`${book.title} added to cart`);
    };

    return (
        <div className="book-detail-container">
            <img src={`http://localhost:5000/uploads/${book.thumbnail}`} alt={book.title} className="book-thumbnail" />
            <h1 className="book-title">{book.title}</h1>
            <p className="book-authors">Authors: {book.authors.map(author => author.name).join(', ')}</p>
            <p className="book-publisher">Publisher: {book.publisher}</p>
            <p className="book-rating">Average Rating: {book.averageRating.toFixed(2)}</p>
            <p className="book-description">Description: {book.description}</p>
            <p className="book-release-date">Release Date: {book.releaseDate}</p>
            <button onClick={handleAddToCart} className="add-to-cart-button">Add to Cart</button>
        </div>
    );
};

export default BookDetail;
