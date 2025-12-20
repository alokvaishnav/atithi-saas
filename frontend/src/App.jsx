import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Services from './pages/Services';

// Additional Enterprise Features
import CalendarView from './pages/CalendarView';
import Reports from './pages/Reports';
import FrontDesk from './pages/FrontDesk';
import Folio from './pages/Folio';
import POS from './pages/POS';
import Housekeeping from './pages/Housekeeping';
import Staff from './pages/Staff';
import PrintGRC from './pages/PrintGRC';
import DigitalFolio from './pages/DigitalFolio'; 
import Accounting from './pages/Accounting'; 
import Support from './pages/Support'; // 👈 Added Support Import
import Settings from './pages/Settings'; // 👈 Added Settings Import

// 🔒 THE PROFESSIONAL GUARD (Role & Token Security)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  // 1. Check if logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if role is authorized for this specific department
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-12 bg-white shadow-2xl rounded-[40px] border border-red-100 max-w-md animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase italic">Access Restricted</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            The <strong>{userRole}</strong> role is not authorized to access this department. Please contact the administrator.
          </p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase text-xs tracking-widest"
          >
            Return to HQ
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
        {/* 🔓 PUBLIC ROUTES (No Token Needed for Guests) */}
        <Route path="/login" element={<Login />} />
        <Route path="/folio-live/:id" element={<DigitalFolio />} />

        {/* 🔒 PROTECTED APP ARCHITECTURE */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-slate-50 overflow-hidden">
                <Sidebar />
                
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {/* Global Professional Header */}
                  <header className="bg-white border-b border-slate-200 p-5 px-10 flex justify-between items-center z-10 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic leading-none">ATITHI ENTERPRISE</h2>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">Property Operations Cloud</p>
                    </div>

                    <div className="flex items-center space-x-8">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-black text-slate-800 leading-none">Management Console</p>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Identity: {userRole}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 border-l pl-8 border-slate-100">
                        <button 
                          onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                          }}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-xl"
                          title="System Logout"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                        
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-slate-200 transform hover:scale-105 transition-transform cursor-pointer">
                          {userRole.charAt(0)}
                        </div>
                      </div>
                    </div>
                  </header>

                  {/* Department Viewport */}
                  <div className="flex-1 overflow-y-auto">
                    <Routes>
                      {/* Standard Access Routes (Available to all logged-in staff) */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/front-desk" element={<FrontDesk />} />
                      <Route path="/rooms" element={<Rooms />} />
                      <Route path="/guests" element={<Guests />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/calendar" element={<CalendarView />} />
                      <Route path="/folio/:bookingId" element={<Folio />} />
                      <Route path="/pos" element={<POS />} />
                      <Route path="/print-grc/:bookingId" element={<PrintGRC />} />
                      <Route path="/support" element={<Support />} /> {/* 👈 Open to all staff */}
                      
                      {/* 🛡️ HR & Personnel Restricted Access */}
                      <Route path="/staff" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                          <Staff />
                        </ProtectedRoute>
                      } />

                      {/* ⚙️ Configuration Restricted Access */}
                      <Route path="/settings" element={
                        <ProtectedRoute allowedRoles={['OWNER']}>
                          <Settings />
                        </ProtectedRoute>
                      } />

                      {/* 💰 Financial & Accounting Restricted Access */}
                      <Route path="/accounting" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'ACCOUNTANT', 'MANAGER']}>
                          <Accounting />
                        </ProtectedRoute>
                      } />

                      <Route path="/reports" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                          <Reports />
                        </ProtectedRoute>
                      } />
                      
                      {/* 🧹 Operational Restricted Access */}
                      <Route path="/housekeeping" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}>
                          <Housekeeping />
                        </ProtectedRoute>
                      } />

                      <Route path="/services" element={
                        <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}>
                          <Services />
                        </ProtectedRoute>
                      } />

                      {/* Catch-all Redirect */}
                      <Route path="*" element={<Navigate to="/" replace />} />
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