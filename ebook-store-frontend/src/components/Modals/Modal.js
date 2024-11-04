import React, { useEffect } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes for type checking
import './Modal.css'; // Ensure you have the necessary styles

const Modal = ({ isOpen, onClose, data = [], modalType }) => { // Default to an empty array
    // Focus on the modal when it's opened
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            document.body.style.overflow = 'unset'; // Re-enable scrolling
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <button className="modal-close" onClick={onClose} aria-label="Close modal">X</button>
                <h2 id="modal-title">{modalType === 'transactions' ? 'Transaction Data' : 'Sales Data'}</h2>
                {data.length === 0 ? (
                    <p>No {modalType === 'transactions' ? 'transaction' : 'sales'} data available.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>{modalType === 'transactions' ? 'Price' : 'Amount'}</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.id}>
                                    <td>{item.user?.name || 'Unknown User'}</td>
                                    <td>{modalType === 'transactions' ? item.price : item.amount}</td>
                                    <td>{new Date(item.date || item.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// PropTypes for validation
Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    data: PropTypes.array, // data should be an array
    modalType: PropTypes.oneOf(['transactions', 'sales']).isRequired, // Ensure modalType is either 'transactions' or 'sales'
};

export default Modal;
