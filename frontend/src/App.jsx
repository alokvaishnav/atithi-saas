import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Loader2, Menu, User, Hotel } from 'lucide-react'; 
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
import SuperAdmin from './pages/SuperAdmin'; 

// 🦴 LOADING SKELETON (UX Improvement)
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

// 🔒 THE PROFESSIONAL GUARD
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading, user } = useAuth(); 

  if (loading) return <AppSkeleton />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Superuser bypasses role checks
  if (user?.is_superuser) return children;

  // If roles are defined and user doesn't have them
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center p-8 md:p-12 bg-white shadow-2xl rounded-[40px] border border-red-100 max-w-md animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase italic">Access Restricted</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm md:text-base">
            The <strong>{role || 'User'}</strong> role is not authorized to access this department.
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

// 🏗️ THE APP LAYOUT (Authenticated Shell)
const AppLayout = () => {
    const { role, logout, hotelName, user } = useAuth(); 
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
      <LicenseLock>
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
          
          {/* SIDEBAR */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* MAIN CONTENT WRAPPER */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            
            {/* Mobile Header (Visible only on small screens) */}
            <header className="bg-white border-b border-slate-200 p-4 md:hidden flex justify-between items-center z-10 shadow-sm sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Hotel size={14} className="text-white" />
                        </div>
                        <span className="font-black text-slate-800 uppercase tracking-widest text-sm truncate max-w-[150px]">
                            {hotelName || "Atithi"}
                        </span>
                    </div>
                </div>
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
            </header>

            {/* Desktop Header (Optional / Integrated into pages usually, but kept for Logout access) */}
            <div className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-20 pointer-events-none">
                 {/* This area usually handled inside pages like Dashboard, but we ensure global styles here */}
            </div>

            {/* SCROLLABLE PAGE AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
              <Routes>
                {/* 🟢 GENERAL ACCESS (Everyone) */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/support" element={<Support />} />

                {/* 🟠 FRONT OFFICE & RESERVATIONS */}
                <Route path="/front-desk" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><FrontDesk /></ProtectedRoute>} />
                <Route path="/rooms" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><Rooms /></ProtectedRoute>} />
                <Route path="/guests" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><Guests /></ProtectedRoute>} />
                <Route path="/guests/edit/:id" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><EditGuest /></ProtectedRoute>} />
                
                <Route path="/bookings" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><Bookings /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><CalendarView /></ProtectedRoute>} />
                <Route path="/folio/:bookingId" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><Folio /></ProtectedRoute>} />
                <Route path="/print-grc/:bookingId" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><PrintGRC /></ProtectedRoute>} />

                {/* 🔴 POS & SERVICES (Restricted: No Housekeeping) */}
                <Route path="/pos" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><POS /></ProtectedRoute>} />
                <Route path="/services" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><Services /></ProtectedRoute>} />

                {/* 👑 SUPER ADMIN (Owner Only) */}
                <Route path="/super-admin" element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <SuperAdmin />
                  </ProtectedRoute>
                } />

                {/* 🔐 STAFF MANAGEMENT */}
                <Route path="/staff" element={
                  <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <Staff />
                  </ProtectedRoute>
                } />

                {/* ⚙️ SETTINGS */}
                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['OWNER']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/pricing" element={
                  <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <Pricing />
                  </ProtectedRoute>
                } />

                {/* 📊 FINANCE & REPORTS */}
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
                
                {/* 📦 INVENTORY */}
                <Route path="/inventory" element={
                  <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}>
                    <Inventory />
                  </ProtectedRoute>
                } />

                {/* 🧹 HOUSEKEEPING */}
                <Route path="/housekeeping" element={
                  <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}>
                    <Housekeeping />
                  </ProtectedRoute>
                } />

                {/* Fallback for authenticated users */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
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
        {/* ROOT LOGIC: Redirect based on auth status */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />
        
        {/* PUBLIC AUTH ROUTES */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} /> 
        
        {/* PASSWORD RECOVERY */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

        {/* EXTERNAL GUEST FACING (No Auth Required) */}
        <Route path="/folio-live/:id" element={<DigitalFolio />} />

        {/* CATCH ALL: If logged in, show AppLayout. If not, Login will catch it via ProtectedRoute logic inside */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
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