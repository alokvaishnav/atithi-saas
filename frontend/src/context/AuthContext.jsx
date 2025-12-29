import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

// Create the Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [hotelName, setHotelName] = useState('Atithi HMS');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // ✅ FIX: Define the loading state so the app doesn't crash
  const [loading, setLoading] = useState(true); 
  
  const navigate = useNavigate(); 

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
    
    // ✅ FIX: Mark loading as complete after checking storage
    setLoading(false); 
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

  // 3️⃣ Logout Function
  const logout = () => {
    localStorage.clear();
    setUser(null);
    setRole(null);
    setHotelName('Atithi HMS');
    setIsAuthenticated(false);
    navigate('/login'); 
  };

  // 4️⃣ Live Update Helper (For Settings Page)
  const updateGlobalProfile = (name) => {
      localStorage.setItem('hotel_name', name);
      setHotelName(name);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        role, 
        hotelName, 
        loading, 
        isAuthenticated: !!user || isAuthenticated, 
        login, 
        logout, 
        updateGlobalProfile 
    }}>
      {/* 🛡️ Only render children when initial auth check is done */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);