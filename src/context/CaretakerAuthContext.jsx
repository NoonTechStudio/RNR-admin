import React, { createContext, useContext, useState, useEffect } from 'react';

const CaretakerAuthContext = createContext();

export const useCaretakerAuth = () => {
  const context = useContext(CaretakerAuthContext);
  if (!context) {
    throw new Error('useCaretakerAuth must be used within a CaretakerAuthProvider');
  }
  return context;
};

export const CaretakerAuthProvider = ({ children }) => {
  const [caretaker, setCaretaker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkCaretakerAuthStatus();
  }, []);

  const checkCaretakerAuthStatus = async () => {
    try {
      const token = localStorage.getItem('caretakerToken');
      const caretakerInfo = localStorage.getItem('caretakerInfo');
      
      if (token && caretakerInfo) {
        setCaretaker(JSON.parse(caretakerInfo));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Caretaker auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;
      const response = await fetch(`${API_BASE_URL}/caretaker/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('caretakerToken', data.token);
        localStorage.setItem('caretakerInfo', JSON.stringify(data.caretaker));
        setCaretaker(data.caretaker);
        setIsAuthenticated(true);
        
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('caretakerToken');
    localStorage.removeItem('caretakerInfo');
    setCaretaker(null);
    setIsAuthenticated(false);
  };

  const value = {
    caretaker,
    loading,
    isAuthenticated,
    login,
    logout,
    checkCaretakerAuthStatus
  };

  return (
    <CaretakerAuthContext.Provider value={value}>
      {children}
    </CaretakerAuthContext.Provider>
  );
};