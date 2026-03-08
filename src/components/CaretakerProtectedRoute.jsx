import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCaretakerAuth } from '../context/CaretakerAuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

const CaretakerProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useCaretakerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/caretaker/login" state={{ from: location }} replace />;
  }

  return children;
};

export default CaretakerProtectedRoute;