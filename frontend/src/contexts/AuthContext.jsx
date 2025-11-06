import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to safely get token from localStorage
  const getStoredToken = () => {
    try {
      const storedToken = localStorage.getItem('token');
      // Validate token format - JWT tokens are typically long strings
      if (storedToken && 
          storedToken !== 'null' && 
          storedToken !== 'undefined' && 
          storedToken.length > 50) {
        return storedToken;
      }
      return null;
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
      return null;
    }
  };

  // Function to check authentication status
  const checkAuth = async () => {
    const storedToken = getStoredToken();
    
    if (storedToken) {
      try {
        console.log('Checking authentication with stored token');
        const response = await authAPI.getCurrentUser();
        setUser(response.data.user);
        setToken(storedToken);
        console.log('User authenticated successfully');
      } catch (error) {
        console.error('Token validation failed:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      console.log('No valid token found in storage');
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const extractUserAndToken = (responseData) => {
    console.log('Extracting user and token from response:', responseData);
    
    // Handle different possible response structures
    let user = null;
    let token = null;

    // Structure 1: response.data.data.user and response.data.data.token
    if (responseData.data && responseData.data.user && responseData.data.token) {
      user = responseData.data.user;
      token = responseData.data.token;
    }
    // Structure 2: response.data.user and response.data.token  
    else if (responseData.user && responseData.token) {
      user = responseData.user;
      token = responseData.token;
    }
    // Structure 3: Direct properties
    else if (responseData.data) {
      user = responseData.data.user || responseData.user;
      token = responseData.data.token || responseData.token;
    }

    console.log('Extracted - user:', user, 'token:', token ? `Present (${token.length} chars)` : 'Missing');
    return { user, token };
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login...');
      const response = await authAPI.login(email, password);
      const { user, token } = extractUserAndToken(response.data);
      
      // Validate we got proper data
      if (!user || !token) {
        console.error('Missing user or token in response:', response.data);
        throw new Error('Authentication response incomplete');
      }
      
      // Validate token format
      if (token.length < 50) {
        console.error('Invalid token format received:', token);
        throw new Error('Invalid authentication token received from server');
      }
      
      console.log('Login successful, storing token and user');
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      console.log('Attempting registration...');
      const response = await authAPI.register(username, email, password);
      const { user, token } = extractUserAndToken(response.data);
      
      // Validate we got proper data
      if (!user || !token) {
        console.error('Missing user or token in response:', response.data);
        throw new Error('Registration response incomplete');
      }
      
      // Validate token format
      if (token.length < 50) {
        console.error('Invalid token format received:', token);
        throw new Error('Invalid authentication token received from server');
      }
      
      console.log('Registration successful, storing token and user');
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log('Logging out...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};