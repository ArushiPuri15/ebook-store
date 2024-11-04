import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isAdmin, children }) => {
    if (!isAdmin) {
        return <Navigate to="/" />; // Redirect to home if not admin
    }
    return children; // Render the protected component
};

export default ProtectedRoute;
