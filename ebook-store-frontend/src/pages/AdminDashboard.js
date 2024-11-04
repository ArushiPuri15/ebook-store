import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css'; // Import your CSS file for styling
import Modal from '../components/Modals/Modal'; // Adjust the path based on your structure

const AdminDashboard = () => {
    const [books, setBooks] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newBook, setNewBook] = useState({
        title: '',
        description: '',
        price: '',
        genre: '',
        publisher: '',
        authors: [],
        tags: [],
        pdf: null,
        thumbnail: null,
    });
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [transactionData, setTransactionData] = useState([]);
    const [authorInput, setAuthorInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('sales'); // Default value for modalType
    const [submitting, setSubmitting] = useState(false); // Loading state for form submission

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [booksResponse, authorsResponse, tagsResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_BASE_URL}/books`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`${process.env.REACT_APP_API_BASE_URL}/authors`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`${process.env.REACT_APP_API_BASE_URL}/tags`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                ]);

                setBooks(booksResponse.data.books || []);
                setAuthors(authorsResponse.data || []);
                setTags(tagsResponse.data || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData();
        formData.append('title', newBook.title);
        formData.append('description', newBook.description);
        formData.append('price', newBook.price);
        formData.append('genre', newBook.genre);
        formData.append('publisher', newBook.publisher);
        formData.append('authors', JSON.stringify(newBook.authors));
        formData.append('tags', JSON.stringify(newBook.tags));
        if (newBook.pdf) formData.append('pdf', newBook.pdf);
        if (newBook.thumbnail) formData.append('thumbnail', newBook.thumbnail);

        try {
            const response = selectedBookId 
                ? await axios.put(`${process.env.REACT_APP_API_BASE_URL}/books/${selectedBookId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                })
                : await axios.post(`${process.env.REACT_APP_API_BASE_URL}/books`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

            setBooks(prevBooks => selectedBookId 
                ? prevBooks.map(book => (book.id === selectedBookId ? response.data : book))
                : [...prevBooks, response.data]
            );
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add/update book');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewBook({
            title: '',
            description: '',
            price: '',
            genre: '',
            publisher: '',
            authors: [],
            tags: [],
            pdf: null,
            thumbnail: null,
        });
        setSelectedBookId(null);
        setAuthorInput('');
        setTagInput('');
    };

    const handleEditBook = (book) => {
        setNewBook({
            title: book.title,
            description: book.description,
            price: book.price,
            genre: book.genre,
            publisher: book.publisher,
            authors: book.authors.map(author => author.name) || [],
            tags: book.tags.map(tag => tag.name) || [],
            pdf: null,
            thumbnail: null,
        });
        setSelectedBookId(book.id);
    };

    const handleAddAuthor = () => {
        const trimmedAuthor = authorInput.trim();
        if (trimmedAuthor && !newBook.authors.includes(trimmedAuthor)) {
            setNewBook(prevState => ({
                ...prevState,
                authors: [...prevState.authors, trimmedAuthor]
            }));
            setAuthorInput('');
        } else {
            alert("Please enter a valid, unique author name.");
        }
    };

    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && !newBook.tags.includes(trimmedTag)) {
            setNewBook(prevState => ({
                ...prevState,
                tags: [...prevState.tags, trimmedTag]
            }));
            setTagInput('');
        } else {
            alert("Please enter a valid, unique tag name.");
        }
    };

    const fetchSalesData = async (bookId) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/books/${bookId}/sales`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setSalesData(response.data);
            setModalOpen(true);
            setModalType('sales');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch sales data');
        }
    };

    const fetchTransactionData = async (bookId) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/books/${bookId}/purchases`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setTransactionData(response.data);
            setModalOpen(true);
            setModalType('transactions');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch transaction data');
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSalesData([]);
        setTransactionData([]);
    };

    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            {loading ? (
                <p className="loading">Loading...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : (
                <div>
                    <h3>Books List</h3>
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Authors</th>
                                <th>Price</th>
                                <th>PDF</th>
                                <th>Purchases</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.length > 0 ? (
                                books.map(book => (
                                    <tr key={book.id}>
                                        <td>{book.title}</td>
                                        <td>{book.authors.map(author => author.name).join(', ')}</td>
                                        <td>{book.price}</td>
                                        <td>
                                            {book.pdf ? (
                                                <a href={book.pdf} target="_blank" rel="noopener noreferrer">View PDF</a>
                                            ) : 'No PDF available'}
                                        </td>
                                        <td>{book.purchasesCount}</td>
                                        <td>
                                            <button onClick={() => handleEditBook(book)}>Edit</button>
                                            <button onClick={() => fetchSalesData(book.id)}>View Sales</button>
                                            <button onClick={() => fetchTransactionData(book.id)}>View Transactions</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No books available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <form onSubmit={handleBookSubmit} className="add-book-form">
                        <h3>{selectedBookId ? 'Edit Book' : 'Add New Book'}</h3>
                        <input type="text" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} placeholder="Title" required />
                        <textarea value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })} placeholder="Description" required />
                        <input type="number" value={newBook.price} onChange={e => setNewBook({ ...newBook, price: e.target.value })} placeholder="Price" required />
                        <input type="text" value={newBook.genre} onChange={e => setNewBook({ ...newBook, genre: e.target.value })} placeholder="Genre" required />
                        <input type="text" value={newBook.publisher} onChange={e => setNewBook({ ...newBook, publisher: e.target.value })} placeholder="Publisher" required />
                        <input type="file" onChange={e => setNewBook({ ...newBook, pdf: e.target.files[0] })} accept="application/pdf" required />
                        <input type="file" onChange={e => setNewBook({ ...newBook, thumbnail: e.target.files[0] })} accept="image/*" required />

                        <div className="authors-tags">
                            <input type="text" value={authorInput} onChange={e => setAuthorInput(e.target.value)} placeholder="Add Author" />
                            <button type="button" onClick={handleAddAuthor}>Add Author</button>
                            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add Tag" />
                            <button type="button" onClick={handleAddTag}>Add Tag</button>
                        </div>

                        <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
                    </form>
                </div>
            )}

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} modalType={modalType}>
                    {modalType === 'sales' ? (
                        <div>
                            <h3>Sales Data</h3>
                            <ul>
                                {salesData.length > 0 ? salesData.map(sale => (
                                    <li key={sale.id}>{sale.date} - {sale.amount} - {sale.quantity}</li>
                                )) : <p>No sales data available</p>}
                            </ul>
                        </div>
                    ) : (
                        <div>
                            <h3>Transaction Data</h3>
                            <ul>
                                {transactionData.length > 0 ? transactionData.map(transaction => (
                                    <li key={transaction.id}>{transaction.date} - {transaction.amount} - {transaction.user}</li>
                                )) : <p>No transaction data available</p>}
                            </ul>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default AdminDashboard;
