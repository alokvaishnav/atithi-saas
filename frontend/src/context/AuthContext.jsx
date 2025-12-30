import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 

// Create the Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🔐 CORE STATE
  const [user, setUser] = useState(null); // Now stores full object: { username, id, email, is_superuser }
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [hotelName, setHotelName] = useState('Atithi HMS');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // 1️⃣ Centralized Logout (Wrapped in useCallback for stability)
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
            
            // Advanced Fields
            const storedUserId = localStorage.getItem('user_id');
            const isSuperUser = localStorage.getItem('is_superuser') === 'true';

            if (storedToken && storedUser) {
                setToken(storedToken);
                setRole(storedRole);
                setHotelName(storedHotel || 'Atithi HMS');
                
                // Reconstruct User Object
                setUser({
                    username: storedUser,
                    id: storedUserId,
                    is_superuser: isSuperUser
                });
                
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Auth Restoration Error:", error);
            logout(); // Safety fallback
        } finally {
            setLoading(false);
        }
    };

    initAuth();
  }, [logout]);

  // 3️⃣ Login Function: Saves Data & Updates State
  const login = (data) => {
    // A. Save Critical Data to LocalStorage
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    // B. Save User Profile Data
    localStorage.setItem('username', data.username);
    localStorage.setItem('user_role', data.user_role || 'RECEPTIONIST');
    localStorage.setItem('user_id', data.id || '');
    localStorage.setItem('is_superuser', data.is_superuser || false);
    
    // C. Save Config Data
    const hName = data.hotel_name || 'Atithi HMS';
    localStorage.setItem('hotel_name', hName);

    // D. Update React State
    setToken(data.access);
    setRole(data.user_role || 'RECEPTIONIST');
    setHotelName(hName);
    setUser({
        username: data.username,
        id: data.id,
        is_superuser: data.is_superuser
    });
    setIsAuthenticated(true);
  };

  // 4️⃣ RBAC Helper: Check if user has permission
  const hasRole = (allowedRoles) => {
      if (!role) return false;
      if (user?.is_superuser) return true; // Super Admin bypass
      if (role === 'OWNER') return true;   // Owners usually have full access
      
      return allowedRoles.includes(role);
  };

  // 5️⃣ Live Settings Updater (For Settings Page)
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
        hasRole,             // 👈 New Feature: Check permissions easily
        updateGlobalProfile 
    }}>
      {/* 🛡️ Prevent UI flickering: Only render app when auth is checked */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook for easy access in components
export const useAuth = () => useContext(AuthContext);