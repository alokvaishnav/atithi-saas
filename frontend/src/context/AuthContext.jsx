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
    localStorage.clear();
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

            const validToken = cleanToken(rawToken);

            if (isValidJwtStructure(validToken) && storedUserData) {
                const parsedUser = JSON.parse(storedUserData);
                
                setToken(validToken);
                setUser(parsedUser);
                
                // 🟢 ADVANCED ROLE LOGIC (Restoration)
                // If is_superuser is true, ALWAYS force role to OWNER/SUPERADMIN
                // This prevents "Staff" defaults for global admins.
                let activeRole = parsedUser.role || 'STAFF';
                if (parsedUser.is_superuser) activeRole = 'OWNER';
                
                setRole(activeRole);
                
                const settingsName = parsedUser.hotel_settings?.hotel_name;
                const flatName = parsedUser.hotel_name;
                setHotelName(settingsName || flatName || 'Atithi HMS');
                
                setIsAuthenticated(true);
            } else {
                if (rawToken || storedUserData) {
                    console.warn("AuthContext: Session invalid. Cleaning up.");
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
            // A. Validate Token
            const validToken = cleanToken(data.access);
            if (!isValidJwtStructure(validToken)) {
                return { success: false, msg: "Server Error: Invalid security token." };
            }

            // B. Save Token
            localStorage.setItem('access_token', validToken);
            localStorage.setItem('refresh_token', data.refresh);
            
            // 🟢 C. ADVANCED ROLE RESOLUTION
            // Priority:
            // 1. If is_superuser is TRUE -> Role is 'OWNER' (Overrides everything)
            // 2. If explicit role is 'ADMIN' -> Role is 'ADMIN'
            // 3. Fallback -> 'STAFF'
            let detectedRole = data.role;
            if (data.is_superuser) {
                detectedRole = 'OWNER'; 
            } else if (!detectedRole) {
                detectedRole = 'STAFF';
            }
            
            const settings = data.hotel_settings || {};
            const displayHotelName = settings.hotel_name || data.hotel_name || 'Atithi HMS';

            const userData = {
                username: data.username,
                id: data.id,
                is_superuser: data.is_superuser, 
                role: detectedRole, // Save the resolved role
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