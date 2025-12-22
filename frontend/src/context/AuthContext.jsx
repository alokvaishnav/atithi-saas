import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 IMPORT HOOK

// Create the Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [hotelName, setHotelName] = useState('Atithi HMS');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate(); // 👈 INITIALIZE HOOK

  // 1️⃣ Load Data on App Start
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('username');
    const storedRole = localStorage.getItem('user_role');
    const storedHotel = localStorage.getItem('hotel_name');
    
    if (token) {
        setIsAuthenticated(true);
        if (storedUser) setUser(storedUser);
        if (storedRole) setRole(storedRole);
        if (storedHotel) setHotelName(storedHotel);
    }
  }, []);

  // 2️⃣ Login Function (Updates State & Storage)
  const login = (data) => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user_role', data.user_role || 'RECEPTIONIST');
    localStorage.setItem('username', data.username);
    
    const hName = data.hotel_name || 'Atithi HMS';
    localStorage.setItem('hotel_name', hName);

    setUser(data.username);
    setRole(data.user_role || 'RECEPTIONIST');
    setHotelName(hName);
    setIsAuthenticated(true);
  };

  // 3️⃣ Logout Function (FIXED: Uses Client-Side Navigation)
  const logout = () => {
    localStorage.clear();
    setUser(null);
    setRole(null);
    setHotelName('Atithi HMS');
    setIsAuthenticated(false);
    navigate('/login'); // 👈 USE NAVIGATE (No more 404 Error)
  };

  // 4️⃣ Live Update Helper (For Settings Page)
  const updateGlobalProfile = (name) => {
      localStorage.setItem('hotel_name', name);
      setHotelName(name);
  };

  return (
    <AuthContext.Provider value={{ 
        user, role, hotelName, isAuthenticated, 
        login, logout, updateGlobalProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);