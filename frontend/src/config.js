import axios from 'axios';

// ✅ CONNECT TO YOUR AWS SERVER
// This is the Public IP of your Django Backend
export const API_URL = "http://16.171.144.127";

// ℹ️ If you are testing on your local laptop, use this instead:
// export const API_URL = "http://127.0.0.1:8000";

// Create the Axios Instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
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

// 🛡️ RESPONSE INTERCEPTOR: Handle Expired Sessions
// If the server says "401 Unauthorized" (Token Expired), we auto-logout the user.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            console.warn("Session expired. Redirecting to login...");
            localStorage.clear(); // Clear old data
            window.location.href = '/login'; // Force redirect
        }
        return Promise.reject(error);
    }
);

export default api;