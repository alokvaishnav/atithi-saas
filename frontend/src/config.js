import axios from 'axios';

// ==============================================
// 1. CONFIGURATION & SERVER CONNECTION
// ==============================================

// 🟢 AWS SERVER IP (Use your specific Public IP)
const SERVER_IP = "http://16.171.144.127";

// 🔵 Logic: Use .env if available, otherwise fallback to AWS IP.
// We replace any trailing slash to avoid double-slashes later.
export const API_URL = (import.meta.env?.VITE_API_URL || SERVER_IP).replace(/\/$/, "");

// ==============================================
// 2. AXIOS INSTANCE (For API Calls)
// ==============================================
const api = axios.create({
    // 🟢 CRITICAL: We append '/api' here for Axios calls.
    // This results in: http://16.171.144.127/api/...
    baseURL: `${API_URL}/api`,
    
    // Increased timeout for reports/slow connections
    timeout: 45000, 
    
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

        // B. Handle Network Errors (Server Down / Offline / CORS)
        if (!error.response) {
            console.error("🚨 Network Error: Unable to reach server at " + API_URL);
        } else if (error.response.status === 404) {
            console.error("🚨 404 Error: Resource not found at " + error.config.url);
        }

        return Promise.reject(error);
    }
);

export default api;