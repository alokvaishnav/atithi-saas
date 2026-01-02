import axios from 'axios';

// 🔌 Connect to your Backend
// 🟢 EXPORT IS REQUIRED: Other components import { API_URL } from this file
export const API_URL = 'http://16.171.144.127/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔒 INTERCEPTOR: Automatically attach the Token to every request
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

export default api;