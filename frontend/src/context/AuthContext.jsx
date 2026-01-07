import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { API_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🔐 CORE STATE
  const [user, setUser] = useState(null); 
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [hotelName, setHotelName] = useState('Atithi HMS');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 1️⃣ HELPER: Sanitize Token
  // Removes extra quotes, whitespace, and handles "null" strings
  // This fixes the "400 Bad Request" caused by double-stringified tokens
  const cleanToken = (str) => {
      if (!str || typeof str !== 'string') return null;
      if (str === 'null' || str === 'undefined') return null;
      return str.replace(/"/g, '').trim();
  };

  // 2️⃣ HELPER: Validate JWT Structure
  // A valid JWT must have 3 parts separated by dots (header.payload.signature)
  const isValidJwtStructure = (str) => {
      if (!str) return false;
      const parts = str.split('.');
      return parts.length === 3;
  };

  // 3️⃣ Centralized Logout
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setRole(null);
    setToken(null);
    setHotelName('Atithi HMS');
    setIsAuthenticated(false);
    navigate('/login'); 
  }, [navigate]);

  // 4️⃣ App Initialization
  useEffect(() => {
    const initAuth = () => {
        try {
            const rawToken = localStorage.getItem('access_token');
            const storedUserData = localStorage.getItem('user_data');

            // Step A: Sanitize the token
            const validToken = cleanToken(rawToken);

            // Step B: Validate Structure & User Data
            if (isValidJwtStructure(validToken) && storedUserData) {
                const parsedUser = JSON.parse(storedUserData);
                
                setToken(validToken); // 🟢 Load the CLEAN token
                setUser(parsedUser);
                
                // Role Logic
                const activeRole = parsedUser.role === 'ADMIN' 
                    ? 'ADMIN' 
                    : (parsedUser.is_superuser ? 'OWNER' : (parsedUser.role || 'STAFF'));
                
                setRole(activeRole);
                
                // Hotel Name Logic
                const settingsName = parsedUser.hotel_settings?.hotel_name;
                const flatName = parsedUser.hotel_name;
                setHotelName(settingsName || flatName || 'Atithi HMS');
                
                setIsAuthenticated(true);
            } else {
                // If data exists but is corrupt/invalid, wipe it to stop loops
                if (rawToken || storedUserData) {
                    console.warn("AuthContext: Found corrupted session data. Auto-cleaning.");
                    localStorage.clear();
                }
            }
        } catch (error) {
            console.error("AuthContext: Restoration Error:", error);
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    };

    initAuth();
  }, []);

  // 5️⃣ Login Function
  const login = async (username, password) => {
    try {
        const res = await fetch(`${API_URL}/api/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            // A. Sanitize & Validate Token immediately
            const validToken = cleanToken(data.access);
            
            if (!isValidJwtStructure(validToken)) {
                console.error("Login failed: Server returned malformed token.");
                return { success: false, msg: "Server Error: Invalid security token." };
            }

            // B. Save Clean Data (No quotes!)
            localStorage.setItem('access_token', validToken);
            localStorage.setItem('refresh_token', data.refresh);
            
            // C. Role Logic
            const detectedRole = data.role === 'ADMIN' 
                ? 'ADMIN' 
                : (data.is_superuser ? 'OWNER' : (data.role || 'STAFF'));
            
            const settings = data.hotel_settings || {};
            const displayHotelName = settings.hotel_name || data.hotel_name || 'Atithi HMS';

            const userData = {
                username: data.username,
                id: data.id,
                is_superuser: data.is_superuser,
                role: detectedRole,
                hotel_name: displayHotelName,
                hotel_settings: settings 
            };

            localStorage.setItem('user_data', JSON.stringify(userData));

            // D. Update State
            setToken(validToken);
            setRole(detectedRole);
            setHotelName(displayHotelName);
            setUser(userData);
            setIsAuthenticated(true);
            
            return { success: true };
        } else {
            return { success: false, msg: data.detail || "Login failed" };
        }
    } catch (err) {
        console.error("Login Network Error:", err);
        return { success: false, msg: "Server connection failed" };
    }
  };

  const hasRole = (allowedRoles) => {
      if (!role) return false;
      if (role === 'ADMIN' || user?.is_superuser || role === 'OWNER') return true; 
      return allowedRoles.includes(role);
  };

  const updateGlobalProfile = (name) => {
      setHotelName(name);
      if (user) {
          const updatedUser = { 
              ...user, 
              hotel_name: name,
              hotel_settings: { ...user.hotel_settings, hotel_name: name }
          };
          setUser(updatedUser);
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
  };

  return (
    <AuthContext.Provider value={{ 
        user, role, token, hotelName, loading, 
        isAuthenticated, login, logout, hasRole, updateGlobalProfile 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);