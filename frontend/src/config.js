import axios from 'axios';

// ==============================================
// 1. CONFIGURATION & SERVER CONNECTION
// ==============================================

// 🟢 AWS SERVER IP:   http://16.171.144.127
// 🔵 LOCAL DEV:       http://localhost:8000
// Logic: Tries .env file first, falls back to AWS IP.

export const API_URL = (import.meta.env?.VITE_API_URL || "http://16.171.144.127").replace(/\/$/, "");

// ==============================================
// 2. AXIOS INSTANCE (For API Calls)
// ==============================================
const api = axios.create({
    // 🟢 CRITICAL: We append '/api' here for Axios calls
    baseURL: `${API_URL}/api`,
    timeout: 30000, // Increased to 30s to handle PDF generation/Reports
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ==============================================
// 3. REQUEST INTERCEPTOR (Attach Token)
// ==============================================
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

// ==============================================
// 4. RESPONSE INTERCEPTOR (Error Handling)
// ==============================================
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // A. Handle 401 Unauthorized (Token Expired)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.warn("⚠️ Session expired. Logging out...");
            
            // Clear all auth data to prevent infinite loops
            localStorage.clear();
            
            // Redirect to login ONLY if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // B. Handle Network Errors (Server Down / Offline)
        if (!error.response) {
            console.error("🚨 Network Error: Unable to reach server at " + API_URL);
        }

        return Promise.reject(error);
    }
);

export default api;