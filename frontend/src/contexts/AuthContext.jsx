import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginAPI, register as registerAPI } from '../services/api';
import toast from 'react-hot-toast';
import websocketService from '../services/websocket'; // Added Import

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Helper to safely extract error message from backend response
const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    // If detail is an array (Pydantic validation error), extract the first message
    if (Array.isArray(detail)) {
      return detail[0].msg || 'Validation error';
    }
    // If it's a string, return it
    return detail;
  }
  return 'An error occurred';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await loginAPI(username, password);
      const { access_token, user: userData } = response.data; 
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.username}! 👋`);
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      const msg = getErrorMessage(error);
      toast.error(msg);
      return false;
    }
  };

  const register = async (username, email, password, fullName) => {
    try {
      const response = await registerAPI(username, email, password, fullName);
      const { access_token, user: userData } = response.data; 
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      toast.success(`Account created! Welcome, ${userData.username}! 🎉`);
      return true;
    } catch (error) {
      console.error("Registration Error:", error);
      const msg = getErrorMessage(error);
      toast.error(msg);
      return false;
    }
  };

  const logout = () => {
    // CRITICAL FIX: Disconnect WebSocket on logout
    websocketService.disconnect();
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};