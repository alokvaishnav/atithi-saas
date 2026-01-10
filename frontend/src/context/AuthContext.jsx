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
  const cleanToken = (str) => {
      if (!str || typeof str !== 'string' || str === 'null' || str === 'undefined') return null;
      return str.replace(/"/g, '').trim();
  };

  // 2️⃣ HELPER: Validate JWT Structure
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
    localStorage.removeItem('hotel_name'); // Clear cached name
    setUser(null);
    setRole(null);
    setToken(null);
    setHotelName('Atithi HMS');
    setIsAuthenticated(false);
    navigate('/login'); 
  }, [navigate]);

  // 4️⃣ App Initialization (Restore Session)
  useEffect(() => {
    const initAuth = async () => {
        try {
            const rawToken = localStorage.getItem('access_token');
            const storedUserData = localStorage.getItem('user_data');
            const validToken = cleanToken(rawToken);

            if (isValidJwtStructure(validToken) && storedUserData) {
                const parsedUser = JSON.parse(storedUserData);
                
                setToken(validToken);
                setUser(parsedUser);
                
                // 🟢 ROLE RESTORATION LOGIC
                let activeRole = parsedUser.role || 'STAFF';
                
                // Ensure Super Admin is recognized correctly
                if (parsedUser.is_superuser === true || activeRole === 'SUPER-ADMIN') {
                    activeRole = 'SUPER-ADMIN';
                }
                
                setRole(activeRole);
                
                // Restore Hotel Name
                const settingsName = parsedUser.hotel_settings?.hotel_name;
                const flatName = parsedUser.hotel_name;
                const defaultName = activeRole === 'SUPER-ADMIN' ? 'SaaS Core' : 'Atithi HMS';
                
                setHotelName(settingsName || flatName || defaultName);
                
                setIsAuthenticated(true);
            } else {
                if (rawToken || storedUserData) {
                    localStorage.clear();
                }
            }
        } catch (error) {
            // Silently handle error and clear storage
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    };

    initAuth();
  }, []);

  // 5️⃣ Login Function (🟢 UPDATED: Now accepts hotel_code)
  const login = async (username, password, hotel_code) => {
    try {
        // Construct Payload
        const payload = { username, password };
        if (hotel_code) {
            payload.hotel_code = hotel_code;
        }

        // 🟢 Using the fixed /api/token/ endpoint
        const res = await fetch(`${API_URL}/api/token/`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // Send updated payload
        });

        const data = await res.json();

        if (res.ok) {
            // A. Validate Token
            const validToken = cleanToken(data.access);
            if (!isValidJwtStructure(validToken)) {
                return { success: false, msg: "Server Error: Invalid security token." };
            }

            // B. Save Token
            localStorage.setItem('access_token', validToken);
            localStorage.setItem('refresh_token', data.refresh);
            
            // C. Determine Role from Backend Response
            // Prioritize Superuser flag immediately
            const isSuperUser = data.user?.is_superuser === true || data.is_superuser === true;
            
            let detectedRole = data.role || 'STAFF';
            if (data.role === 'ADMIN') detectedRole = 'OWNER'; // Backend legacy mapping
            if (isSuperUser) detectedRole = 'SUPER-ADMIN';

            const settings = data.hotel_settings || {};
            const displayHotelName = settings.hotel_name || data.hotel_name || (isSuperUser ? 'SaaS Core' : 'Atithi HMS');

            // Construct standardized user object
            let userData = {
                username: data.username || data.user?.username,
                id: data.id || data.user?.id || data.user_id,
                is_superuser: isSuperUser,
                role: detectedRole,
                hotel_code: data.hotel_code || hotel_code, // 🟢 Save Hotel Code
                hotel_name: displayHotelName,
                hotel_settings: settings 
            };

            // D. Final Save & Update State (No extra checks needed)
            localStorage.setItem('user_data', JSON.stringify(userData));
            setToken(validToken);
            setRole(userData.role);
            setHotelName(userData.hotel_name);
            setUser(userData);
            setIsAuthenticated(true);
            
            // Return user object so Login.jsx can redirect correctly
            return { success: true, user: userData };
        } else {
            return { success: false, msg: data.detail || "Login failed" };
        }
    } catch (err) {
        // Silent failure
        console.error(err);
        return { success: false, msg: "Server connection failed" };
    }
  };

  const hasRole = (allowedRoles) => {
      if (!role) return false;
      // Allow Super Admin everywhere
      if (role === 'SUPER-ADMIN' || user?.is_superuser) return true; 
      // Allow Owners everywhere owners are expected
      if (role === 'OWNER') return true;
      
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