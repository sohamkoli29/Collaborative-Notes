import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

// Helper function to safely get token
const getToken = () => {
  try {
    const token = localStorage.getItem('token');
    // Basic validation
    if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request with token to:', config.url);
    } else {
      console.log('API Request without token to:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('API Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response success:', response.config.url, response.status);
    console.log('Full response data:', JSON.stringify(response.data, null, 2));
    return response;
  },
  (error) => {
    console.error('API Response error:', error.config?.url, error.response?.status);
    console.error('Error response data:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Token invalid, removing from storage');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (username, email, password) => 
    api.post('/auth/signup', { username, email, password }),
  
  getCurrentUser: () => 
    api.get('/auth/me'),
};

export default api;