import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { API_URL } from '../config';

// Create the Context
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
  const location = useLocation();

  // 1️⃣ Centralized Logout
  const logout = useCallback(() => {
    localStorage.clear(); // Wipe everything
    setUser(null);
    setRole(null);
    setToken(null);
    setHotelName('Atithi HMS');
    setIsAuthenticated(false);
    navigate('/login'); 
  }, [navigate]);

  // 2️⃣ App Initialization: Restore Session from Storage
  useEffect(() => {
    const initAuth = () => {
        try {
            // We use a single JSON object for safer storage
            const storedToken = localStorage.getItem('access_token');
            const storedUserData = localStorage.getItem('user_data');

            // 🟢 ROBUST CHECK: Ensure token is valid and not string "null"/"undefined"
            if (storedToken && storedToken !== 'null' && storedToken !== 'undefined' && storedUserData) {
                const parsedUser = JSON.parse(storedUserData);
                
                setToken(storedToken);
                setUser(parsedUser);
                
                // 🟢 CRITICAL FIX: Ensure Role is Read Correctly
                // Prioritize ADMIN, then Superuser -> OWNER, fallback to STAFF
                const activeRole = parsedUser.role === 'ADMIN' 
                    ? 'ADMIN' 
                    : (parsedUser.is_superuser ? 'OWNER' : (parsedUser.role || 'STAFF'));
                
                setRole(activeRole);
                
                // 🟢 EXTRACT HOTEL NAME (Handle nested settings or flat key)
                const settingsName = parsedUser.hotel_settings?.hotel_name;
                const flatName = parsedUser.hotel_name;
                setHotelName(settingsName || flatName || 'Atithi HMS');
                
                setIsAuthenticated(true);
            } else {
                // If data is partial or invalid, ensure we start clean
                setLoading(false);
            }
        } catch (error) {
            console.error("Auth Restoration Error:", error);
            // If data is corrupted, clear it to prevent loops
            logout(); 
        } finally {
            setLoading(false);
        }
    };

    initAuth();
  }, [logout]);

  // 3️⃣ Login Function: Handles API Call & State Update
  const login = async (username, password) => {
    try {
        const res = await fetch(`${API_URL}/api/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            // A. Save Tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // B. Logic for Role Identity
            // FIX: Explicitly check for 'ADMIN' role first
            const detectedRole = data.role === 'ADMIN' 
                ? 'ADMIN' 
                : (data.is_superuser ? 'OWNER' : (data.role || 'STAFF'));
            
            // C. Extract Hotel Settings (Logo, Name, etc.)
            const settings = data.hotel_settings || {};
            const displayHotelName = settings.hotel_name || data.hotel_name || 'Atithi HMS';

            // D. Construct & Save User Profile Data
            const userData = {
                username: data.username,
                id: data.id,
                is_superuser: data.is_superuser,
                role: detectedRole,
                hotel_name: displayHotelName,
                hotel_settings: settings // Store the full settings object
            };

            // Save as one blob to prevent sync issues
            localStorage.setItem('user_data', JSON.stringify(userData));

            // E. Update React State
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

  // 4️⃣ RBAC Helper: Enhanced with Superuser bypass
  const hasRole = (allowedRoles) => {
      if (!role) return false;
      // ADMIN role and Superusers bypass role checks
      if (role === 'ADMIN' || user?.is_superuser || role === 'OWNER') return true; 
      return allowedRoles.includes(role);
  };

  // 5️⃣ Live Settings Updater
  // Updates the context and localStorage when user changes settings
  const updateGlobalProfile = (name) => {
      // Update state
      setHotelName(name);
      
      // Update local storage to persist change
      if (user) {
          const updatedUser = { 
              ...user, 
              hotel_name: name,
              // Update nested settings too so refresh keeps the name
              hotel_settings: { ...user.hotel_settings, hotel_name: name }
          };
          setUser(updatedUser);
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        role, 
        token,
        hotelName, 
        loading, 
        isAuthenticated, 
        login, 
        logout, 
        hasRole, 
        updateGlobalProfile 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);