import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Services from './pages/Services';


// 👇 Additional Features
import CalendarView from './pages/CalendarView';
import Reports from './pages/Reports';
import FrontDesk from './pages/FrontDesk';
import Folio from './pages/Folio';
import POS from './pages/POS'; // 👈 IMPORT THIS

// 🔒 THE GUARD
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected App */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-slate-50">
                <Sidebar />
                
                <main className="flex-1 overflow-y-auto">
                  {/* Header */}
                  <header className="bg-white shadow-sm p-6 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-slate-800">Atithi Manager</h2>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-500">Welcome, Owner</span>
                      <button 
                        onClick={() => {
                          localStorage.removeItem('access_token');
                          localStorage.removeItem('refresh_token');
                          window.location.href = '/login';
                        }}
                        className="text-red-500 text-sm font-semibold hover:text-red-700 border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                      >
                        Logout
                      </button>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">A</div>
                    </div>
                  </header>

                  {/* Dashboard Content */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/guests" element={<Guests />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/services" element={<Services />} />
                    
                    {/* 👇 ALL NEW ROUTES */}
                    <Route path="/calendar" element={<CalendarView />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/front-desk" element={<FrontDesk />} />
                    <Route path="/folio/:bookingId" element={<Folio />} />
                    <Route path="/pos" element={<POS />} />
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