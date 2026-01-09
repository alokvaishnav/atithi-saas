import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert, Menu, Hotel } from 'lucide-react'; 
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
import BookingSite from './pages/public/BookingSite'; 

// --- CORE OPERATIONS ---
import Dashboard from './pages/Dashboard';
import FrontDesk from './pages/FrontDesk';
import Bookings from './pages/Bookings';
import CalendarView from './pages/CalendarView';
import Folio from './pages/Folio';
import POS from './pages/POS';
import PrintGRC from './pages/PrintGRC';
import OnboardingWizard from './pages/OnboardingWizard'; 

// --- MANAGEMENT MODULES ---
import Rooms from './pages/Rooms';
import Guests from './pages/Guests';
import EditGuest from './pages/EditGuest'; 
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Housekeeping from './pages/Housekeeping';
import HousekeepingMobile from './pages/HousekeepingMobile'; 

// --- ADMIN & FINANCE ---
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Staff from './pages/Staff';       
import Accounting from './pages/Accounting'; 
import Support from './pages/Support'; 
import Settings from './pages/Settings'; 
import Pricing from './pages/Pricing';

// --- SUPER ADMIN (CEO TOOLS) ---
// 🟢 IMPORTING THE EXTERNAL LAYOUT FILE (Correct)
import SuperAdminLayout from './pages/SuperAdmin/SuperAdminLayout'; 
import SuperAdminDashboard from './pages/SuperAdmin/CommandCenter'; 
import TenantManager from './pages/SuperAdmin/TenantManager'; 
import GlobalConfig from './pages/SuperAdmin/GlobalConfig'; 
import Infrastructure from './pages/SuperAdmin/Infrastructure'; 
import SubscriptionPlans from './pages/SuperAdmin/SubscriptionPlans'; 

// 🦴 LOADING SKELETON
const AppSkeleton = () => (
  <div className="flex h-screen bg-slate-50 overflow-hidden">
    <div className="w-72 bg-slate-950 h-full hidden md:flex flex-col p-4 border-r border-slate-800">
      <div className="h-16 bg-slate-800 rounded-xl mb-8 animate-pulse w-full"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-slate-800/50 rounded-lg animate-pulse w-full"></div>
        ))}
      </div>
    </div>
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

// 🔒 THE PROFESSIONAL GUARD (Standard Users)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading, user } = useAuth(); 

  if (loading) return <AppSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Superuser bypasses role checks
  if (user?.is_superuser || role === 'ADMIN' || role === 'SUPER-ADMIN') return children;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center p-8 md:p-12 bg-white shadow-2xl rounded-[40px] border border-red-100 max-w-md animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase italic">Access Restricted</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm md:text-base">
            The <strong>{role || 'User'}</strong> role is not authorized here.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="inline-block w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase text-xs tracking-widest"
          >
            Return to HQ
          </button>
        </div>
      </div>
    );
  }
  return children;
};

// 🟢 SUPER ADMIN GUARD (CEO Access Only)
const SuperAdminRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();
    
    if (loading) return <AppSkeleton />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    // Strict Check: Must be Superuser or SUPER-ADMIN role
    if (user?.is_superuser || user?.role === 'SUPER-ADMIN') {
        return children;
    }
    
    // If unauthorized, send to hotel dashboard
    return <Navigate to="/dashboard" replace />;
};

// ❌ I REMOVED THE DUPLICATE LOCAL 'SuperAdminLayout' FUNCTION HERE
// It is now correctly imported from './pages/SuperAdmin/SuperAdminLayout'

// 🏗️ THE HOTEL APP LAYOUT (Sidebar + Header)
const AppLayout = () => {
    const { user, hotelName } = useAuth(); 
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const hotelSettings = user?.hotel_settings || {};
    const displayLogo = hotelSettings.logo; 

    return (
      <LicenseLock>
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <header className="bg-white border-b border-slate-200 p-4 md:hidden flex justify-between items-center z-10 shadow-sm sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        {displayLogo ? (
                           <img src={displayLogo} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                        ) : (
                           <div className="bg-blue-600 p-1.5 rounded-lg"><Hotel size={14} className="text-white" /></div>
                        )}
                        <span className="font-black text-slate-800 uppercase tracking-widest text-sm truncate max-w-[150px]">
                            {hotelName || "Atithi"}
                        </span>
                    </div>
                </div>
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
              {/* This Outlet renders the child routes like Dashboard, Rooms, etc. */}
              <Outlet />
            </div>
          </main>
        </div>
      </LicenseLock>
    );
};

// 🚦 MAIN ROUTING LOGIC
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth(); 

  if (loading) return <AppSkeleton />;

  return (
    <Routes>
        {/* ================================================================= */}
        {/* 🟢 1. PUBLIC ROUTES (No Auth Required) */}
        {/* ================================================================= */}
        
        {/* Public Booking Engine - This MUST be accessible without login */}
        <Route path="/book/:username" element={<BookingSite />} />
        
        {/* Public Digital Folio (For Guests) */}
        <Route path="/folio-live/:id" element={<DigitalFolio />} />
        
        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        
        {/* Legacy Redirect */}
        <Route path="/hotel/:username" element={<Navigate to={`/book/${window.location.pathname.split('/').pop()}`} replace />} />

        {/* Landing Page Redirect */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />


        {/* ================================================================= */}
        {/* 🔴 2. SUPER ADMIN ROUTES (CEO Only) */}
        {/* ================================================================= */}
        <Route path="/super-admin" element={
            <SuperAdminRoute>
                <SuperAdminLayout />
            </SuperAdminRoute>
        }>
             <Route index element={<SuperAdminDashboard />} /> 
             {/* Stats Route for Login Redirection */}
             <Route path="stats" element={<SuperAdminDashboard />} /> 
             
             <Route path="tenants" element={<TenantManager />} />
             <Route path="plans" element={<SubscriptionPlans />} />
             <Route path="infrastructure" element={<Infrastructure />} />
             <Route path="config" element={<GlobalConfig />} />
        </Route>


        {/* ================================================================= */}
        {/* 🔵 3. HOTEL APP ROUTES (Owners, Managers, Staff) */}
        {/* ================================================================= */}
        
        {/* Housekeeping Mobile View (Fullscreen) */}
        <Route path="/hk-mobile" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'HOUSEKEEPING']}>
            <HousekeepingMobile />
          </ProtectedRoute>
        } />

        {/* Main Hotel Dashboard (Wrapped in Sidebar Layout) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/support" element={<Support />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />

            {/* Front Office */}
            <Route path="/front-desk" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><FrontDesk /></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Rooms /></ProtectedRoute>} />
            <Route path="/guests" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Guests /></ProtectedRoute>} />
            <Route path="/guests/edit/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><EditGuest /></ProtectedRoute>} />
            
            {/* Reservations */}
            <Route path="/bookings" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Bookings /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><CalendarView /></ProtectedRoute>} />
            <Route path="/folio/:bookingId" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Folio /></ProtectedRoute>} />
            <Route path="/print-grc/:bookingId" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><PrintGRC /></ProtectedRoute>} />

            {/* Operations */}
            <Route path="/pos" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><POS /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Services /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Inventory /></ProtectedRoute>} />
            <Route path="/housekeeping" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}><Housekeeping /></ProtectedRoute>} />

            {/* Admin Management */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER']}><Staff /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}><Settings /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER']}><Pricing /></ProtectedRoute>} />

            {/* Finance */}
            <Route path="/accounting" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'ACCOUNTANT', 'MANAGER']}><Accounting /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'ACCOUNTANT', 'MANAGER']}><Expenses /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT']}><Reports /></ProtectedRoute>} />
            
            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
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