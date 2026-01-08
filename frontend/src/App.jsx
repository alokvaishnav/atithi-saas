import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
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
import SuperAdminDashboard from './pages/SuperAdmin/CommandCenter'; 
import TenantManager from './pages/SuperAdmin/TenantManager'; 
import GlobalConfig from './pages/SuperAdmin/GlobalConfig'; 
import Infrastructure from './pages/SuperAdmin/Infrastructure'; // 🟢 NEW
import SubscriptionPlans from './pages/SuperAdmin/SubscriptionPlans'; // 🟢 NEW

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
  if (user?.is_superuser || role === 'ADMIN') return children;

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
    
    // Strict Check: Must be Superuser or Owner or SUPERADMIN role
    if (user?.is_superuser || user?.role === 'SUPERADMIN' || user?.role === 'OWNER') {
        return children;
    }
    
    return <Navigate to="/dashboard" replace />;
};

// 🟢 SUPER ADMIN LAYOUT (Dedicated Workspace)
const SuperAdminLayout = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
             <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Simple Header for Super Admin */}
                <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800/60 gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">ATITHI <span className="text-purple-500">HQ</span></h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">SaaS Command Center</p>
                    </div>
                    {/* Navigation using Link components to prevent page reloads */}
                    <nav className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                        <Link to="/super-admin" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">Overview</Link>
                        <Link to="/super-admin/tenants" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">Tenants</Link>
                        <Link to="/super-admin/plans" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">Plans</Link>
                        <Link to="/super-admin/infrastructure" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">System</Link>
                        <Link to="/super-admin/config" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">Config</Link>
                        <Link to="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap">Hotel View</Link>
                    </nav>
                </header>
                <Outlet />
             </div>
        </div>
    );
};

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
        {/* ROOT: Redirect based on auth */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />
        
        {/* PUBLIC AUTH ROUTES */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} /> 
        
        {/* RECOVERY & PUBLIC SITES */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        
        {/* 🟢 NEW: Public Booking Engine Route */}
        <Route path="/book/:username" element={<BookingSite />} />
        
        {/* Legacy route support (optional) */}
        <Route path="/hotel/:username" element={<Navigate to={`/book/${window.location.pathname.split('/').pop()}`} replace />} />

        <Route path="/folio-live/:id" element={<DigitalFolio />} />

        {/* 🟢 SUPER ADMIN ROUTES (CEO Dashboard) */}
        <Route path="/super-admin" element={
            <SuperAdminRoute>
                <SuperAdminLayout />
            </SuperAdminRoute>
        }>
             <Route index element={<SuperAdminDashboard />} /> 
             <Route path="tenants" element={<TenantManager />} />
             <Route path="plans" element={<SubscriptionPlans />} /> {/* 🟢 Added */}
             <Route path="infrastructure" element={<Infrastructure />} /> {/* 🟢 Added */}
             <Route path="config" element={<GlobalConfig />} />
        </Route>

        {/* 🟢 HOUSEKEEPING MOBILE (Fullscreen) */}
        <Route path="/hk-mobile" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'HOUSEKEEPING']}>
            <HousekeepingMobile />
          </ProtectedRoute>
        } />

        {/* 🟢 HOTEL APP ROUTES (Wrapped in AppLayout) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/support" element={<Support />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />

            {/* FRONT OFFICE */}
            <Route path="/front-desk" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><FrontDesk /></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Rooms /></ProtectedRoute>} />
            <Route path="/guests" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Guests /></ProtectedRoute>} />
            <Route path="/guests/edit/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><EditGuest /></ProtectedRoute>} />
            
            {/* RESERVATIONS */}
            <Route path="/bookings" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Bookings /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><CalendarView /></ProtectedRoute>} />
            <Route path="/folio/:bookingId" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Folio /></ProtectedRoute>} />
            <Route path="/print-grc/:bookingId" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><PrintGRC /></ProtectedRoute>} />

            {/* POS & SERVICES */}
            <Route path="/pos" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><POS /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Services /></ProtectedRoute>} />

            {/* MANAGEMENT */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER']}><Staff /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}><Settings /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER']}><Pricing /></ProtectedRoute>} />

            {/* FINANCE */}
            <Route path="/accounting" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'ACCOUNTANT', 'MANAGER']}><Accounting /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'ACCOUNTANT', 'MANAGER']}><Expenses /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT']}><Reports /></ProtectedRoute>} />
            
            {/* OPERATIONS */}
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST']}><Inventory /></ProtectedRoute>} />
            <Route path="/housekeeping" element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}><Housekeeping /></ProtectedRoute>} />

            {/* Fallback */}
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