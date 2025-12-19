import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Services from './pages/Services'; // 👈 1. IMPORT THIS

// 🔒 THE GUARD: This checks if you are allowed to enter
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  
  // If no token found, kick user back to Login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // If token exists, let them in
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Route: Anyone can see the Login Page */}
        <Route path="/login" element={<Login />} />

        {/* 2. Protected App: Only logged-in users can see this */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-slate-50">
                {/* Sidebar stays on the left */}
                <Sidebar />
                
                <main className="flex-1 overflow-y-auto">
                  {/* Header with Logout Button */}
                  <header className="bg-white shadow-sm p-6 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-slate-800">Atithi Manager</h2>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-500">Welcome, Owner</span>
                      
                      {/* Logout Button */}
                      <button 
                        onClick={() => {
                          // Delete the keys and go to login
                          localStorage.removeItem('access_token');
                          localStorage.removeItem('refresh_token');
                          window.location.href = '/login';
                        }}
                        className="text-red-500 text-sm font-semibold hover:text-red-700 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                      >
                        Logout
                      </button>

                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        A
                      </div>
                    </div>
                  </header>

                  {/* Dashboard Content */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/guests" element={<Guests />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/bookings" element={<Bookings />} />
                    
                    {/* 👇 2. ADD THIS ROUTE */}
                    <Route path="/services" element={<Services />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;