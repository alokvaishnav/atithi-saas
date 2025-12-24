import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- COMPONENTS ---
import Sidebar from './components/Sidebar';
// Note: If you haven't created LicenseLock yet, you can create a simple wrapper or remove it.
import LicenseLock from './components/LicenseLock'; 

// --- PUBLIC PAGES ---
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'; 
import DigitalFolio from './pages/DigitalFolio'; 

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
import EditGuest from './pages/EditGuest'; // Optional: If you use a separate page instead of modal
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

// 🔒 THE PROFESSIONAL GUARD
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth(); 

  // 0. Loading State (Prevents flicker)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin text-blue-600" />
        <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">Verifying Access...</span>
      </div>
    );
  }

  // A. Check if logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // B. Check if role is authorized
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-12 bg-white shadow-2xl rounded-[40px] border border-red-100 max-w-md animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase italic">Access Restricted</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
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
    const { role, logout, hotelName } = useAuth(); 

    return (
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
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic leading-none">
                        {hotelName || "ATITHI ENTERPRISE"}
                    </h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">Property Operations Cloud</p>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-slate-800 leading-none">Management Console</p>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Identity: {role}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 border-l pl-8 border-slate-100">
                    <button 
                      onClick={() => { if(window.confirm("Logout?")) logout() }} 
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-xl"
                      title="System Logout"
                    >
                      <LogOut size={20} />
                    </button>
                    
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-slate-200 transform hover:scale-105 transition-transform cursor-pointer">
                      {role ? role.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                </div>
              </header>

              {/* DEPARTMENT VIEWPORT */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <Routes>
                  {/* ✅ STANDARD ACCESS (All Staff) */}
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
                  
                  {/* 🛡️ HR & STAFF (Restricted) */}
                  <Route path="/staff" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                      <Staff />
                    </ProtectedRoute>
                  } />

                  {/* 💳 PRICING PAGE */}
                  <Route path="/pricing" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                      <Pricing />
                    </ProtectedRoute>
                  } />

                  {/* ⚙️ SETTINGS (Owner Only) */}
                  <Route path="/settings" element={
                    <ProtectedRoute allowedRoles={['OWNER']}>
                      <Settings />
                    </ProtectedRoute>
                  } />

                  {/* 💰 ACCOUNTING & FINANCE (Restricted) */}
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

                  {/* 📊 REPORTS (Restricted) */}
                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  
                  {/* 📦 INVENTORY (Restricted) */}
                  <Route path="/inventory" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}>
                      <Inventory />
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

                  {/* Catch-all inside App -> Go to Dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </LicenseLock>
      </ProtectedRoute>
    );
};

// 🧠 Main Content Wrapper (Accesses Context)
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth(); 

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900"><Loader2 className="text-white animate-spin"/></div>;

  return (
    <Routes>
        {/* 🔓 PUBLIC ROUTES */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/folio-live/:id" element={<DigitalFolio />} />

        {/* 🔒 PROTECTED APP ARCHITECTURE */}
        {/* Any route not matched above falls into AppLayout, which checks Auth */}
        <Route path="/*" element={<AppLayout />} />

    </Routes>
  );
}

// 🚀 ROOT COMPONENT
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