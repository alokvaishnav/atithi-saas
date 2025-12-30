import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 

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
    localStorage.clear();
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
            const storedToken = localStorage.getItem('access_token');
            const storedUser = localStorage.getItem('username');
            const storedRole = localStorage.getItem('user_role');
            const storedHotel = localStorage.getItem('hotel_name');
            const storedUserId = localStorage.getItem('user_id');
            const isSuperUser = localStorage.getItem('is_superuser') === 'true';

            if (storedToken && storedUser) {
                setToken(storedToken);
                setRole(storedRole);
                setHotelName(storedHotel || 'Atithi HMS');
                
                // Reconstruct User Object with Role Info
                setUser({
                    username: storedUser,
                    id: storedUserId,
                    is_superuser: isSuperUser,
                    role: storedRole
                });
                
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Auth Restoration Error:", error);
            logout(); 
        } finally {
            setLoading(false);
        }
    };

    initAuth();
  }, [logout]);

  // 3️⃣ Login Function: Correctly identifies Owner vs Receptionist
  const login = (data) => {
    // A. Save Tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    // B. Logic for Role Identity
    // If user is a superuser, we often treat them as 'OWNER' for UI purposes
    const detectedRole = data.is_superuser ? 'OWNER' : (data.user_role || 'STAFF');
    
    // C. Save User Profile Data
    localStorage.setItem('username', data.username);
    localStorage.setItem('user_role', detectedRole);
    localStorage.setItem('user_id', data.id || '');
    localStorage.setItem('is_superuser', data.is_superuser || false);
    
    // D. Save Config Data
    const hName = data.hotel_name || 'Atithi HMS';
    localStorage.setItem('hotel_name', hName);

    // E. Update React State
    setToken(data.access);
    setRole(detectedRole);
    setHotelName(hName);
    setUser({
        username: data.username,
        id: data.id,
        is_superuser: data.is_superuser,
        role: detectedRole
    });
    setIsAuthenticated(true);
  };

  // 4️⃣ RBAC Helper: Enhanced with Superuser bypass
  const hasRole = (allowedRoles) => {
      if (!role) return false;
      if (user?.is_superuser || role === 'OWNER') return true; 
      return allowedRoles.includes(role);
  };

  // 5️⃣ Live Settings Updater
  const updateGlobalProfile = (name) => {
      localStorage.setItem('hotel_name', name);
      setHotelName(name);
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