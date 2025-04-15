import axios from "axios";

export const AxiosInstance = axios.create({
    baseURL : import.meta.env.VITE_API_URL + "/api" || "http://localhost:5000/api/auth" ,
    withCredentials : true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
})

// Add response interceptor
AxiosInstance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        // Handle unauthorized errors
        window.location.href = '/signin';
      }
      return Promise.reject(error);
    }
  );