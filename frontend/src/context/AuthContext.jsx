import { createContext, useState, useEffect, useContext } from 'react';

// Create the Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1️⃣ State Definitions
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [hotelName, setHotelName] = useState('Atithi HMS');
  const [loading, setLoading] = useState(true); // 👈 Critical: Prevents premature redirects on refresh

  // 2️⃣ Load Data on App Start (Restore Session)
  useEffect(() => {
    const restoreSession = () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('username');
      const storedRole = localStorage.getItem('user_role');
      const storedHotel = localStorage.getItem('hotel_name');
      
      if (token && storedUser) {
        // Restore user state so the app knows we are logged in
        setUser({ username: storedUser, user_role: storedRole });
        setRole(storedRole);
        setHotelName(storedHotel || 'Atithi HMS');
      }
      
      setLoading(false); // ✅ Session check complete, allow app to render
    };

    restoreSession();
  }, []);

  // 3️⃣ Login Function (Updates State & Storage)
  const login = (data) => {
    // Save to Storage
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    // Handle potential differences in backend response keys
    const userRole = data.user_role || data.role || 'RECEPTIONIST';
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('username', data.username);
    
    const hName = data.hotel_name || 'Atithi HMS';
    localStorage.setItem('hotel_name', hName);

    // Update State (Triggers UI updates)
    setUser({ username: data.username, user_role: userRole });
    setRole(userRole);
    setHotelName(hName);
  };

  // 4️⃣ Logout Function
  const logout = () => {
    localStorage.clear();
    setUser(null);
    setRole(null);
    setHotelName('Atithi HMS');
    // Note: We don't use navigate() here to avoid Router Context errors.
    // The <Layout> component in App.jsx detects 'user' is null and redirects automatically.
  };

  // 5️⃣ Live Update Helper (For Settings Page)
  const updateGlobalProfile = (name) => {
      localStorage.setItem('hotel_name', name);
      setHotelName(name);
  };

  return (
    <AuthContext.Provider value={{ 
        user, role, hotelName, loading,
        login, logout, updateGlobalProfile 
    }}>
      {/* 🛡️ Only render children when initial auth check is done */}
      {!loading && children} 
    </AuthContext.Provider>
  );
};

// Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);