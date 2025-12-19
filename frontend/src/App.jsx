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
import POS from './pages/POS';
import Housekeeping from './pages/Housekeeping';

// 🔒 THE PROFESSIONAL GUARD (Role & Token Security)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  // 1. Check if logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if role is authorized for this specific route
  // If allowedRoles is provided, check against it.
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-10 bg-white shadow-2xl rounded-3xl border border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">Your current role <strong>({userRole})</strong> does not have permission to access this department.</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  const userRole = localStorage.getItem('user_role') || 'STAFF';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected App Architecture */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-slate-50 overflow-hidden">
                <Sidebar />
                
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {/* Dynamic Professional Header */}
                  <header className="bg-white border-b border-slate-200 p-4 px-8 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight italic">ATITHI MANAGER</h2>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Enterprise HMS Cloud</p>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-slate-700 leading-none">Administrator</p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Role: {userRole}</span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          localStorage.clear();
                          window.location.href = '/login';
                        }}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Logout"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      </button>
                      
                      <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-slate-200">
                        {userRole.charAt(0)}
                      </div>
                    </div>
                  </header>

                  {/* Internal Department Routes with Role-Specific Guards */}
                  <div className="flex-1 overflow-y-auto">
                    <Routes>
                      {/* Standard Access */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/front-desk" element={<FrontDesk />} />
                      <Route path="/rooms" element={<Rooms />} />
                      <Route path="/guests" element={<Guests />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/calendar" element={<CalendarView />} />
                      <Route path="/folio/:bookingId" element={<Folio />} />
                      <Route path="/pos" element={<POS />} />
                      
                      {/* Operationally Restricted Access */}
                      <Route path="/services" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}>
                          <Services />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/housekeeping" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}>
                          <Housekeeping />
                        </ProtectedRoute>
                      } />

                      {/* Financially Restricted Access */}
                      <Route path="/reports" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                          <Reports />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </div>
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