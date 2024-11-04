import React, { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart'; // Assuming you have a custom hook for user-related data
import axios from 'axios';
import Rating from 'react-rating-stars-component'; // Or your chosen rating component

const MyBooksPage = () => {
    const [books, setBooks] = useState([]);
    const [ratings, setRatings] = useState({}); // Store current ratings by bookId
    const [readingBook, setReadingBook] = useState(null); // For book reader state

    useEffect(() => {
        // Fetch user's purchased books
        const fetchBooks = async () => {
            try {
                const token = localStorage.getItem('token'); // Get token from local storage
                const response = await axios.get('http://localhost:5000/users/mybooks', {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include token in headers
                    },
                });
                setBooks(response.data.books);

                // Set up current ratings
                const initialRatings = {};
                response.data.books.forEach(book => {
                    initialRatings[book.id] = book.userRating || 0;
                });
                setRatings(initialRatings);
            } catch (error) {
                console.error("Error fetching books:", error);
            }
        };

        fetchBooks();
    }, []);

    // Function to handle rating submission
    const handleRating = async (bookId, rating) => {
        try {
            const token = localStorage.getItem('token'); // Fetch the JWT from local storage
            // Check if a rating already exists for this book
            const existingRating = ratings[bookId]; // Retrieve existing rating from state
    
            if (existingRating) {
                // Update the existing rating
                await axios.put(`http://localhost:5000/ratings/${bookId}`, { rating }, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include the token in the request
                    },
                });
            } else {
                // Submit a new rating
                await axios.post('http://localhost:5000/ratings', { bookId, rating }, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include the token in the request
                    },
                });
            }
    
            // Update state with the new or updated rating
            setRatings(prevRatings => ({
                ...prevRatings,
                [bookId]: rating
            }));
            alert('Rating submitted!');
        } catch (error) {
            console.error("Error submitting rating:", error);
            alert('Could not submit rating');
        }
    };

    return (
        <div>
            <h1>My Books</h1>
            <div>
                {books.map(book => (
                    <div key={`${book.id}-${book.title}`} className="book-card">
                        <h2>{book.title}</h2>
                        <p>{book.description}</p>
                        <p>Average Rating: {book.averageRating}</p>
                        <p>
                            <strong>Purchase Date:</strong> 
                            {book.purchaseDate ? new Date(book.purchaseDate).toLocaleDateString() : 'Date not available'}
                        </p>
                        <div>
                            <Rating
                                count={5}
                                size={24}
                                value={ratings[book.id]}
                                onChange={(newRating) => handleRating(book.id, newRating)}
                            />
                        </div>
                        <div>
                            <a 
                                href={`http://localhost:5000/${book.pdf}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="view-pdf-link"
                            >
                                Read Now
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Book Reader Component */}
            {readingBook && (
                <div className="book-reader">
                    <h2>Reading: {readingBook.title}</h2>
                    <iframe
                        src={readingBook.pdfUrl}
                        width="100%"
                        height="600px"
                        title={readingBook.title}
                    />
                    <button onClick={() => setReadingBook(null)}>Close</button>
                </div>
            )}
        </div>
    );
};

export default MyBooksPage;
