import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LicenseLock from './components/LicenseLock'; // 👈 ADDED: Import License Lock
import { ShieldAlert, LogOut } from 'lucide-react';

// ✅ 1. IMPORT ALL REAL PAGES
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Services from './pages/Services';
import Expenses from './pages/Expenses'; 

// ✅ 2. ENTERPRISE MODULES
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
import Support from './pages/Support'; 
import Settings from './pages/Settings'; 

import Pricing from './pages/Pricing';

// 🔒 THE PROFESSIONAL GUARD (Role & Token Security)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  // A. Check if logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // B. Check if role is authorized
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-12 bg-white shadow-2xl rounded-[40px] border border-red-100 max-w-md animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase italic">Access Restricted</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            The <strong>{userRole}</strong> role is not authorized to access this department.
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
        {/* 🔓 PUBLIC ROUTES (Guests & Login) */}
        <Route path="/login" element={<Login />} />
        <Route path="/folio-live/:id" element={<DigitalFolio />} />

        {/* 🔒 PROTECTED APP ARCHITECTURE */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              {/* 🔐 LICENSE LOCK: WRAPS THE ENTIRE APP */}
              <LicenseLock>
                <div className="flex h-screen bg-slate-50 overflow-hidden">
                  
                  {/* SIDEBAR NAVIGATION */}
                  <Sidebar />
                  
                  <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    
                    {/* GLOBAL PROFESSIONAL HEADER */}
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
                            <LogOut size={20} />
                          </button>
                          
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-slate-200 transform hover:scale-105 transition-transform cursor-pointer">
                            {userRole.charAt(0)}
                          </div>
                        </div>
                      </div>
                    </header>

                    {/* DEPARTMENT VIEWPORT */}
                    <div className="flex-1 overflow-y-auto">
                      <Routes>
                        {/* ✅ STANDARD ACCESS (All Staff) */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/front-desk" element={<FrontDesk />} />
                        <Route path="/rooms" element={<Rooms />} />
                        <Route path="/guests" element={<Guests />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/calendar" element={<CalendarView />} />
                        <Route path="/folio/:bookingId" element={<Folio />} />
                        <Route path="/pos" element={<POS />} />
                        <Route path="/print-grc/:bookingId" element={<PrintGRC />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/expenses" element={<Expenses />} />

                        {/* 🛡️ HR & STAFF (Restricted) */}
                        <Route path="/staff" element={
                          <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                            <Staff />
                          </ProtectedRoute>
                        } />

                        {/* 💳 PRICING PAGE (Accessible to authenticated users) */}
                        <Route path="/pricing" element={
                          <ProtectedRoute>
                            <Pricing />
                          </ProtectedRoute>
                        } />

                        {/* ⚙️ SETTINGS (Owner Only) */}
                        <Route path="/settings" element={
                          <ProtectedRoute allowedRoles={['OWNER']}>
                            <Settings />
                          </ProtectedRoute>
                        } />

                        {/* 💰 ACCOUNTING (Restricted) */}
                        <Route path="/accounting" element={
                          <ProtectedRoute allowedRoles={['OWNER', 'ACCOUNTANT', 'MANAGER']}>
                            <Accounting />
                          </ProtectedRoute>
                        } />

                        {/* 📊 REPORTS (Restricted) */}
                        <Route path="/reports" element={
                          <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                            <Reports />
                          </ProtectedRoute>
                        } />
                        
                        {/* 🧹 HOUSEKEEPING (Restricted) */}
                        <Route path="/housekeeping" element={
                          <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}>
                            <Housekeeping />
                          </ProtectedRoute>
                        } />

                        {/* 🍽️ SERVICES (Restricted) */}
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
              </LicenseLock>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;