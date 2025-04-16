import axios from "axios";

// Prioritize environment variable, then fallback to hardcoded production URL
const BASE_URL = import.meta.env.VITE_API_URL || "https://chatspacev3.onrender.com";

export const AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Request interceptor for API calls
AxiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Network errors (no response)
    if (!error.response) {
      console.error('Network error: Unable to reach the server');
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection.'));
    }
    
    // Authorization errors
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear token and redirect to login
      localStorage.removeItem('token');
      
      // Check if we're already on the signin page to prevent redirect loops
      if (!window.location.pathname.includes('/signin')) {
        window.location.href = '/signin';
      }
    }
    
    // Handle other common error statuses
    if (error.response.status === 403) {
      console.error('Forbidden: You do not have permission to access this resource');
    }
    
    if (error.response.status === 404) {
      console.error('Not found: The requested resource was not found');
    }
    
    if (error.response.status >= 500) {
      console.error('Server error: Something went wrong on the server');
    }
    
    return Promise.reject(error);
  }
);