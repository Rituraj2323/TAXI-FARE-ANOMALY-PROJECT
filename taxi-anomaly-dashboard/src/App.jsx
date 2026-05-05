/**
 * Main Application Component
 * Handles global state (Authentication) and Routing for the Taxi Anomaly Dashboard.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PassengerPanel from './pages/PassengerPanel';
import './index.css';

// Create a Context for Authentication to share user state across components
const AuthContext = createContext(null);

// Custom hook to easily access auth state
export function useAuth() { return useContext(AuthContext); }

/**
 * AuthProvider Component
 * Manages user session using LocalStorage and provides login/logout functions.
 */
function AuthProvider({ children }) {
  // Initialize state from localStorage to persist login across page refreshes
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('taxi_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('taxi_token') || null);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('taxi_user', JSON.stringify(userData));
    localStorage.setItem('taxi_token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('taxi_user');
    localStorage.removeItem('taxi_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * ProtectedRoute Component
 * Redirects unauthenticated users to the Login page.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * App Router
 * Defines the navigation structure of the application.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Public Route: Passenger Fare Checker (Standalone Tool) */}
          <Route path="/passenger" element={<PassengerPanel />} />
          
          {/* Protected Route: Admin Dashboard */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          {/* Fallback: Redirect any unknown path to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
