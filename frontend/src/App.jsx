import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Loader2, Menu } from 'lucide-react'; 
import { useState } from 'react'; 
import { AuthProvider, useAuth } from './context/AuthContext';

// --- COMPONENTS ---
import Sidebar from './components/Sidebar';
import LicenseLock from './components/LicenseLock'; 

// --- PUBLIC PAGES ---
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'; 
import DigitalFolio from './pages/DigitalFolio';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// --- CORE OPERATIONS ---
import Dashboard from './pages/Dashboard';
import FrontDesk from './pages/FrontDesk';
import Bookings from './pages/Bookings';
import CalendarView from './pages/CalendarView';
import Folio from './pages/Folio';
import POS from './pages/POS';
import PrintGRC from './pages/PrintGRC';

// --- MANAGEMENT MODULES ---
import Rooms from './pages/Rooms';
import Guests from './pages/Guests';
import EditGuest from './pages/EditGuest'; 
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Housekeeping from './pages/Housekeeping';

// --- ADMIN & FINANCE ---
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Staff from './pages/Staff';       
import Accounting from './pages/Accounting'; 
import Support from './pages/Support'; 
import Settings from './pages/Settings'; 
import Pricing from './pages/Pricing';
import SuperAdmin from './pages/SuperAdmin'; // 👈 NEW IMPORT

// 🦴 LOADING SKELETON (UX Improvement)
const AppSkeleton = () => (
  <div className="flex h-screen bg-slate-50 overflow-hidden">
    {/* Sidebar Skeleton */}
    <div className="w-72 bg-slate-900 h-full hidden md:flex flex-col p-4 border-r border-slate-800">
      <div className="h-16 bg-slate-800 rounded-xl mb-8 animate-pulse w-full"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-slate-800/50 rounded-lg animate-pulse w-full"></div>
        ))}
      </div>
    </div>
    {/* Content Skeleton */}
    <div className="flex-1 flex flex-col">
      <div className="h-16 bg-white border-b border-slate-200 w-full animate-pulse"></div>
      <div className="p-6 space-y-6">
        <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse"></div>
           <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse"></div>
           <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

// 🔒 THE PROFESSIONAL GUARD
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth(); 

  // 0. Loading State (Shows Skeleton instead of Spinner)
  if (loading) {
    return <AppSkeleton />;
  }

  // A. Check if logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // B. Check if role is authorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center p-8 md:p-12 bg-white shadow-2xl rounded-[40px] border border-red-100 max-w-md animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase italic">Access Restricted</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm md:text-base">
            The <strong>{role}</strong> role is not authorized to access this department.
          </p>
          <a href="/dashboard" className="inline-block w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase text-xs tracking-widest">
            Return to HQ
          </a>
        </div>
      </div>
    );
  }

  return children;
};

// 🏗️ THE APP LAYOUT (Sidebar + Header + Content)
const AppLayout = () => {
    const { role, logout, hotelName, loading } = useAuth(); 
    const [sidebarOpen, setSidebarOpen] = useState(false); // 👈 Mobile Menu State

    return (
      <ProtectedRoute loading={loading}>
        <LicenseLock>
          <div className="flex h-screen bg-slate-50 overflow-hidden">
            
            {/* 🛡️ SIDEBAR with Mobile Props */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="bg-white border-b border-slate-200 p-4 md:p-5 md:px-10 flex justify-between items-center z-10 shadow-sm sticky top-0">
                
                <div className="flex items-center gap-4">
                    {/* 🍔 MOBILE HAMBURGER BUTTON */}
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>

                    <div>
                        <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tighter italic leading-none truncate max-w-[200px] md:max-w-none">
                            {hotelName || "ATITHI ENTERPRISE"}
                        </h2>
                        <p className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1 hidden md:block">Property Operations Cloud</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 md:space-x-8">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-slate-800 leading-none">Management Console</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Identity: {role}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 md:border-l md:pl-8 border-slate-100">
                    <button 
                      onClick={() => { if(window.confirm("Logout?")) logout() }} 
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-xl"
                      title="System Logout"
                    >
                      <LogOut size={20} />
                    </button>
                    
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-slate-200 transform hover:scale-105 transition-transform cursor-pointer text-sm md:text-base">
                      {role ? role.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/front-desk" element={<FrontDesk />} />
                  <Route path="/rooms" element={<Rooms />} />
                  <Route path="/guests" element={<Guests />} />
                  <Route path="/guests/edit/:id" element={<EditGuest />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/folio/:bookingId" element={<Folio />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/print-grc/:bookingId" element={<PrintGRC />} />
                  <Route path="/support" element={<Support />} />
                  
                  {/* 👇 NEW SUPER ADMIN ROUTE */}
                  <Route path="/super-admin" element={
                    // Note: Your backend will also enforce admin-only access
                    <SuperAdmin />
                  } />

                  <Route path="/staff" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                      <Staff />
                    </ProtectedRoute>
                  } />

                  <Route path="/pricing" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                      <Pricing />
                    </ProtectedRoute>
                  } />

                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['OWNER']}>
                      <Settings />
                    </ProtectedRoute>
                  } />

                  <Route path="/accounting" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'ACCOUNTANT', 'MANAGER']}>
                      <Accounting />
                    </ProtectedRoute>
                  } />
                  <Route path="/expenses" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'ACCOUNTANT', 'MANAGER']}>
                      <Expenses />
                    </ProtectedRoute>
                  } />

                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/inventory" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}>
                      <Inventory />
                    </ProtectedRoute>
                  } />

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

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </LicenseLock>
      </ProtectedRoute>
    );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth(); 

  if (loading) return <AppSkeleton />;

  return (
    <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        
        {/* 👇 PASSWORD RESET ROUTES */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

        <Route path="/folio-live/:id" element={<DigitalFolio />} />
        <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;