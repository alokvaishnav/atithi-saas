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
import SuperAdmin from './pages/SuperAdmin'; 

const AppSkeleton = () => (
  <div className="flex h-screen bg-slate-50 overflow-hidden">
    <div className="w-72 bg-slate-900 h-full hidden md:flex flex-col p-4 border-r border-slate-800">
      <div className="h-16 bg-slate-800 rounded-xl mb-8 animate-pulse w-full"></div>
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-16 bg-white border-b border-slate-200 w-full animate-pulse"></div>
      <div className="p-6 space-y-6">
        <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse w-full"></div>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth(); 
  if (loading) return <AppSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center p-8 bg-white shadow-2xl rounded-[40px] border border-red-100 max-w-md">
          <ShieldAlert size={40} className="text-red-500 mx-auto mb-6"/>
          <h2 className="text-2xl font-black text-slate-800 mb-3">Access Restricted</h2>
          <a href="/dashboard" className="inline-block w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black mt-4">Return to HQ</a>
        </div>
      </div>
    );
  }
  return children;
};

const AppLayout = () => {
    const { role, logout, hotelName, loading } = useAuth(); 
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
      <ProtectedRoute loading={loading}>
        <LicenseLock>
          <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <header className="bg-white border-b border-slate-200 p-4 md:p-5 flex justify-between items-center z-10 shadow-sm sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500"><Menu size={24} /></button>
                    <div><h2 className="text-lg md:text-2xl font-black text-slate-800 italic">{hotelName || "ATITHI ENTERPRISE"}</h2></div>
                </div>
                <button onClick={() => { if(window.confirm("Logout?")) logout() }} className="text-slate-400 hover:text-red-600"><LogOut size={20} /></button>
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
                  <Route path="/super-admin" element={<SuperAdmin />} />
                  <Route path="/staff" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}><Staff /></ProtectedRoute>} />
                  <Route path="/pricing" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}><Pricing /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute allowedRoles={['OWNER']}><Settings /></ProtectedRoute>} />
                  <Route path="/accounting" element={<ProtectedRoute allowedRoles={['OWNER', 'ACCOUNTANT', 'MANAGER']}><Accounting /></ProtectedRoute>} />
                  <Route path="/expenses" element={<ProtectedRoute allowedRoles={['OWNER', 'ACCOUNTANT', 'MANAGER']}><Expenses /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ACCOUNTANT']}><Reports /></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><Inventory /></ProtectedRoute>} />
                  <Route path="/housekeeping" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'HOUSEKEEPING', 'RECEPTIONIST']}><Housekeeping /></ProtectedRoute>} />
                  <Route path="/services" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'RECEPTIONIST']}><Services /></ProtectedRoute>} />
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