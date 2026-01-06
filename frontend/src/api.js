import axios from 'axios';

// 🔌 Connect to your Backend
// Use environment variable if available, otherwise fallback to your AWS IP
// 🟢 EXPORT IS REQUIRED: Other components import { API_URL } from this file
export const API_URL = import.meta.env?.VITE_API_URL || 'http://16.171.144.127/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 seconds timeout to prevent hanging requests
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// 🔒 REQUEST INTERCEPTOR: Automatically attach the Token to every request
api.interceptors.request.use(
    (config) => {
        // Check if we have a token saved in the browser
        const token = localStorage.getItem('access_token');
        
        // If yes, attach it to the header like a VIP pass
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // If something goes wrong before the request is sent
        return Promise.reject(error);
    }
);

// 🛡️ RESPONSE INTERCEPTOR: Handle Session Expiry (401 Errors)
api.interceptors.response.use(
    (response) => {
        // If the request succeeds, just return the data
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is 401 (Unauthorized) and we haven't retried yet
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            
            // Mark as retried to prevent infinite loops
            originalRequest._retry = true;

            console.warn("⚠️ Session expired or invalid token. Logging out...");

            // 1. Clear ALL session data to ensure a clean slate
            localStorage.clear(); // Removes access_token, refresh_token, user_data, etc.

            // 2. Force Redirect to Login (Only if not already there)
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            
            // Note: If you implement Refresh Tokens later, that logic goes here 
            // before the logout redirect.
        }

        // Handle Network Errors (Server Down / No Internet)
        if (!error.response) {
            console.error("🚨 Network Error: Unable to reach the server.");
        }

        return Promise.reject(error);
    }
);

export default api;