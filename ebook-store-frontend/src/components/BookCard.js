import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import './BookCard.css';

const BookCard = ({ book }) => {
    const navigate = useNavigate();

    // Navigate to the book details page
    const goToDetails = () => {
        navigate(`/books/${book.id}`);
    }

    // Construct the thumbnail URL based on the server's base path
    const thumbnailUrl = `http://localhost:5000/uploads/${book.thumbnail}`;

    return (
        <div className="book-card">
            <img
                src={thumbnailUrl}
                alt={book.title}
                className="book-thumbnail"
                loading="lazy"
                onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "/default-thumbnail.jpg"; // Fallback thumbnail if image fails to load
                }}
                onClick={goToDetails} // Navigate to details on thumbnail click
            />
            <div className="book-info">
                <h3 className="book-title" onClick={goToDetails}>{book.title}</h3>
                <p className="book-description">{book.description}</p>
                <p className="book-price">${book.price.toFixed(2)}</p>
                <p className="book-genre">{book.genre}</p>
                <button 
                    className="add-to-cart" 
                    aria-label={`Add ${book.title} to cart`}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevents the click event from bubbling up and triggering goToDetails
                        // Add your addToCart function here
                    }}
                >
                    <FontAwesomeIcon icon={faShoppingCart} /> {/* Using Font Awesome icon */}
                </button>
            </div>
        </div>
    );
};

export default BookCard;
