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

  // 1️⃣ HELPER: Validate JWT Format
  // A valid JWT must have 3 parts separated by dots (header.payload.signature)
  const isValidToken = (str) => {
      return str && 
             typeof str === 'string' && 
             str.split('.').length === 3 && 
             !str.includes('"') && 
             !str.includes('null') &&
             !str.includes('undefined');
  };

  // 2️⃣ Centralized Logout
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setRole(null);
    setToken(null);
    setHotelName('Atithi HMS');
    setIsAuthenticated(false);
    navigate('/login'); 
  }, [navigate]);

  // 3️⃣ App Initialization
  useEffect(() => {
    const initAuth = () => {
        try {
            const storedToken = localStorage.getItem('access_token');
            const storedUserData = localStorage.getItem('user_data');

            // 🟢 CRITICAL FIX: Only load if token is structurally valid
            if (isValidToken(storedToken) && storedUserData) {
                const parsedUser = JSON.parse(storedUserData);
                
                setToken(storedToken);
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
                // If data exists but is invalid (corrupted), clear it silently
                if (storedToken || storedUserData) {
                    console.warn("Found corrupted session data. Cleaning up.");
                    localStorage.clear();
                }
            }
        } catch (error) {
            console.error("Auth Restoration Error:", error);
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    };

    initAuth();
  }, []);

  // 4️⃣ Login Function
  const login = async (username, password) => {
    try {
        const res = await fetch(`${API_URL}/api/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            // A. Validate Token Integrity
            if (!isValidToken(data.access)) {
                return { success: false, msg: "Server returned invalid token format." };
            }

            // B. Save Clean Data
            localStorage.setItem('access_token', data.access);
            // Ignore refresh token for now to simplify
            
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
            setToken(data.access);
            setRole(detectedRole);
            setHotelName(displayHotelName);
            setUser(userData);
            setIsAuthenticated(true);
            
            return { success: true };
        } else {
            return { success: false, msg: data.detail || "Login failed" };
        }
    } catch (err) {
        console.error("Login Error:", err);
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