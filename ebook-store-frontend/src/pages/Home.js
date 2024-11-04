import React, { useEffect, useState } from 'react';
import { fetchBooks } from '../services/api';
import BookCard from '../components/BookCard';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './Home.css';

const Home = () => {
    const [books, setBooks] = useState([]); // Initialize as an empty array
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGenre, setFilterGenre] = useState('All');
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortOption, setSortOption] = useState('releaseDate');

    useEffect(() => {
        const loadBooks = async () => {
            setLoading(true);
            try {
                const response = await fetchBooks(); // Fetch the data
                console.log("Fetched books data:", response); // Log the fetched data
                setBooks(Array.isArray(response.books) ? response.books : []); // Extract and set the books array
            } catch (error) {
                console.error("Failed to load books:", error);
                setBooks([]); // Reset to an empty array on error
            } finally {
                setLoading(false);
            }
        };
    
        loadBooks();
    }, []);

    useEffect(() => {
        console.log("Books state:", books); // Log books state whenever it changes
    }, [books]);

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleFilterChange = (event) => {
        setFilterGenre(event.target.value);
    };

    const handleTagChange = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSortChange = (event) => {
        setSortOption(event.target.value);
    };

    const filteredBooks = books.filter(book => {
        const matchesSearch = 
            (book.title && book.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (book.publisher && book.publisher.toLowerCase().includes(searchTerm.toLowerCase()));
            
        const matchesGenre = filterGenre === 'All' || book.genre === filterGenre;
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => book.tags && book.tags.includes(tag));
        
        return matchesSearch && matchesGenre && matchesTags;
    });

    const sortedBooks = filteredBooks.sort((a, b) => {
        if (sortOption === 'price') return a.price - b.price;
        if (sortOption === 'rating') return b.rating - a.rating;
        if (sortOption === 'releaseDate') return new Date(b.releaseDate) - new Date(a.releaseDate);
        return 0;
    });

    return (
        <div className="home-container">
            <Navbar />
            <header className="hero-section">
                <div className="hero-overlay">
                    <h1>Welcome to the Vintage eBook Library</h1>
                    <p>Your portal to timeless stories and knowledge.</p>
                    <button className="explore-button">Explore Now</button>
                    <div className="search-filter-section">
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search for books..." 
                            value={searchTerm} 
                            onChange={handleSearch} 
                        />
                        <select 
                            className="genre-filter" 
                            value={filterGenre} 
                            onChange={handleFilterChange}
                        >
                            <option value="All">All Genres</option>
                            <option value="Fiction">Fiction</option>
                            <option value="Non-Fiction">Non-Fiction</option>
                            <option value="Science">Science</option>
                            <option value="Fantasy">Fantasy</option>
                        </select>
                        <div className="tag-filters">
                            {['Classic', 'Modern', 'Adventure', 'Mystery'].map(tag => (
                                <label key={tag}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedTags.includes(tag)} 
                                        onChange={() => handleTagChange(tag)} 
                                    />
                                    {tag}
                                </label>
                            ))}
                        </div>
                        <select className="sort-options" value={sortOption} onChange={handleSortChange}>
                            <option value="releaseDate">Sort by Release Date</option>
                            <option value="price">Sort by Price</option>
                            <option value="rating">Sort by Rating</option>
                        </select>
                    </div>
                </div>
            </header>

            <section className="promo-section">
                <h2>Featured Titles</h2>
                <p>Discover our handpicked selection of eBooks that transport you to another world.</p>
            </section>

            <section className="book-section">
                <h2>Available Books</h2>
                {loading ? (
                    <div className="spinner">Loading...</div>
                ) : (
                    <div className="book-list">
                        {sortedBooks.length > 0 ? (
                            sortedBooks.map(book => (
                                <Link key={book.id} to={`/books/${book.id}`}>
                                    <BookCard book={book} /> {/* Assuming BookCard has thumbnail rendering */}
                                </Link>
                            ))
                        ) : (
                            <p className="no-books">No books available matching your criteria.</p>
                        )}
                    </div>
                )}
            </section>

            <section className="about-section">
                <h2>About Us</h2>
                <p>At Vintage eBook Library, we believe in the power of stories. Our collection spans generations, offering you a chance to dive into literary classics and modern masterpieces alike.</p>
            </section>

            <section className="quotes-section">
                <h2>Quotes & Testimonials</h2>
                <blockquote>
                    "A reader lives a thousand lives before he dies. The man who never reads lives only one." — George R.R. Martin
                </blockquote>
                <blockquote>
                    "Books are a uniquely portable magic." — Stephen King
                </blockquote>
            </section>

            <footer className="footer">
                <p>&copy; 2024 Vintage eBook Library. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
