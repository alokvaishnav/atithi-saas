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
                // Explicitly check for Super Admin status during restore
                let activeRole = parsedUser.role || 'STAFF';
                
                // Fix: Ensure Super Admin is recognized even if DB role says 'OWNER'
                if (parsedUser.is_superuser === true || activeRole === 'SUPER-ADMIN') {
                    activeRole = 'SUPER-ADMIN';
                }
                
                setRole(activeRole);
                
                // Restore Hotel Name
                const settingsName = parsedUser.hotel_settings?.hotel_name;
                const flatName = parsedUser.hotel_name;
                // If it's Super Admin, default to "SaaS Core" if no specific hotel is selected (impersonation)
                const defaultName = activeRole === 'SUPER-ADMIN' ? 'SaaS Core' : 'Atithi HMS';
                
                setHotelName(settingsName || flatName || defaultName);
                
                setIsAuthenticated(true);
            } else {
                if (rawToken || storedUserData) {
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

  // 🟢 5️⃣ CAPABILITY CHECK (The "Secret Handshake")
  // Checks if user can access Super Admin endpoints
  const checkPrivileges = async (accessToken, initialUserData) => {
      try {
          // 🟢 FIXED URL: Use correct endpoint /api/super-admin/config/
          const res = await fetch(`${API_URL}/api/super-admin/config/`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (res.ok) {
              console.log("🔐 Capability Check: SaaS Admin Detected. Upgrading privileges.");
              
              const upgradedUser = {
                  ...initialUserData,
                  is_superuser: true,
                  role: 'SUPER-ADMIN', // 🟢 Force role upgrade
                  hotel_name: 'SaaS Core' 
              };

              // Persist the upgrade
              localStorage.setItem('user_data', JSON.stringify(upgradedUser));
              setUser(upgradedUser);
              setRole('SUPER-ADMIN');
              setHotelName('SaaS Core');
              return upgradedUser;
          }
      } catch (e) {
          // Normal user, do nothing
      }
      return initialUserData;
  };

  // 6️⃣ Login Function
  const login = async (username, password) => {
    try {
        const res = await fetch(`${API_URL}/api/token/`, { // Changed from /api/login/ to standard /api/token/ if using simple JWT, but keeping your structure
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
            
            // C. Initial Role Logic
            let detectedRole = data.role === 'ADMIN' ? 'OWNER' : (data.role || 'STAFF');
            
            // 🟢 FIX: Prioritize Superuser flag immediately
            // Convert boolean string/value to actual boolean
            const isSuperUser = data.user?.is_superuser === true || data.is_superuser === true;

            if (isSuperUser) {
                detectedRole = 'SUPER-ADMIN';
            }

            const settings = data.hotel_settings || {};
            const displayHotelName = settings.hotel_name || data.hotel_name || (isSuperUser ? 'SaaS Core' : 'Atithi HMS');

            // Construct standardized user object
            let userData = {
                username: data.username || data.user?.username,
                id: data.id || data.user?.id,
                is_superuser: isSuperUser,
                role: detectedRole,
                hotel_name: displayHotelName,
                hotel_settings: settings 
            };

            // 🟢 D. RUN CAPABILITY CHECK
            // Only verify if backend didn't explicitly say they are superuser (Double check)
            if (!isSuperUser) {
                userData = await checkPrivileges(validToken, userData);
            }

            // E. Final Save & Update State
            localStorage.setItem('user_data', JSON.stringify(userData));
            setToken(validToken);
            setRole(userData.role);
            setHotelName(userData.hotel_name);
            setUser(userData);
            setIsAuthenticated(true);
            
            // 🟢 CRITICAL FIX: Return the user object so Login.jsx can read it for redirection
            return { success: true, user: userData };
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