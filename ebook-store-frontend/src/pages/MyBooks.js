import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyBooks = () => {
    const [myBooks, setMyBooks] = useState([]);

    useEffect(() => {
        const fetchMyBooks = async () => {
            try {
                const response = await axios.get('/my-books'); // Your backend endpoint for user's books
                setMyBooks(response.data);
            } catch (error) {
                console.error('Error fetching my books:', error);
            }
        };

        fetchMyBooks();
    }, []);

    return (
        <div>
            <h2>My Books</h2>
            <div className="book-list">
                {myBooks.map(book => (
                    <div key={book.id}>
                        <h3>{book.title}</h3>
                        <p>Purchased on: {book.purchaseDate}</p>
                        <a href={`/books/${book.id}`}>Read</a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyBooks;
