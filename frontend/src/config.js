import axios from 'axios';

// ✅ CONNECT TO YOUR SERVER
// 1. Try to find VITE_API_URL in .env file
// 2. If not found, use your hardcoded AWS IP
// 🟢 EXPORT IS REQUIRED: Used by components doing manual 'fetch()' calls
export const API_URL = import.meta.env?.VITE_API_URL || "http://16.171.144.127";

// Create the Axios Instance
const api = axios.create({
    // 🟢 CRITICAL: We append '/api' here for Axios, but keep API_URL as root for manual fetch.
    baseURL: `${API_URL}/api`,
    timeout: 15000, // 15 seconds timeout (prevents infinite hanging)
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// 🔒 REQUEST INTERCEPTOR: Automatically attach the Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🛡️ RESPONSE INTERCEPTOR: Handle Errors & Session Expiry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 1. Handle 401 Unauthorized (Token Expired)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.warn("⚠️ Session expired. Logging out...");
            
            // Clear all auth data
            localStorage.clear();
            
            // Redirect to login ONLY if we aren't already there (prevents loops)
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // 2. Handle Network Errors (Server Down / Offline)
        if (!error.response) {
            console.error("🚨 Network Error: Unable to reach the server at " + API_URL);
            // Optional: You could trigger a global toast/alert here
        }

        return Promise.reject(error);
    }
);

export default api;