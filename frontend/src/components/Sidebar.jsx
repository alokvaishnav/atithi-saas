import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, BedDouble, Users, CalendarCheck, 
  LogOut, ShoppingBag, Utensils, CalendarDays, FileText, 
  ConciergeBell, Sparkles, ShieldCheck, UserCog, Wallet, 
  BookOpen, ChevronRight, Settings, Package, X, 
  Server
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 
import axios from 'axios';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔐 USE AUTH CONTEXT
  const { hotelName, role, user, token, logout, updateGlobalProfile } = useAuth(); 

  // State for SaaS Platform Branding
  const [platformInfo, setPlatformInfo] = useState({
    appName: 'Atithi SaaS',
    companyName: 'Tech Support',
    supportPhone: ''
  });

  // MOBILE AUTO-CLOSE
  useEffect(() => {
    if (onClose && window.innerWidth < 768) {
        onClose();
    }
  }, [location.pathname, onClose]);

  // 1. FETCH HOTEL BRANDING (Tenant Name)
  useEffect(() => {
    const fetchHotelBranding = async () => {
      if (!token) return;
      
      // 🟢 OPTIMIZATION: Only Admins/Owners need to sync settings actively.
      // Staff should rely on the name loaded during Login (stored in Context).
      // This prevents 403/404 errors for restricted users.
      const canAccessSettings = ['ADMIN', 'OWNER', 'MANAGER'].includes(role) || user?.is_superuser;
      
      if (!canAccessSettings) return;

      try {
        const res = await axios.get(`${API_URL}/api/settings/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = res.data;
        // Handle DRF responses (List or Object)
        const settings = Array.isArray(data) ? data[0] : data;
        
        if (settings && settings.hotel_name) {
            updateGlobalProfile(settings.hotel_name.toUpperCase());
        }
      } catch (err) {
        // Silent fail: Keep using the cached name from Context
        // console.warn("Branding sync skipped");
      }
    };
    
    // Only fetch if name is default or missing, AND user has permission
    if (!hotelName || hotelName === 'ATITHI HMS' || hotelName === 'Atithi HMS') {
        fetchHotelBranding();
    }
  }, [token, role, user, hotelName, updateGlobalProfile]); 

  // 2. FETCH PLATFORM BRANDING
  useEffect(() => {
    const fetchPlatformSettings = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/api/super-admin/platform-settings/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data) {
                setPlatformInfo({
                    appName: res.data.app_name || 'Atithi SaaS',
                    companyName: res.data.company_name || 'Tech Support',
                    supportPhone: res.data.support_phone || ''
                });
            }
        } catch (error) {
            // Fallback to defaults if endpoint doesn't exist yet
        }
    };
    fetchPlatformSettings();
  }, [token]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout(); 
      // Navigate is handled by AuthContext but explicit call ensures UI update
      navigate('/login');
    }
  };

  // 🧭 RBAC Navigation Groups
  const groups = [
    {
      title: "Main",
      roles: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'HOUSEKEEPING'],
      items: [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/dashboard' },
      ]
    },
    {
      title: "Front Office",
      roles: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST'],
      items: [
        { icon: <ConciergeBell size={18} />, label: 'Reception Desk', path: '/front-desk' },
        { icon: <BedDouble size={18} />, label: 'Room Status', path: '/rooms' },
        { icon: <Users size={18} />, label: 'Guest Profiles', path: '/guests' },
      ]
    },
    {
      title: "Operations",
      roles: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING'],
      items: [
        { icon: <Sparkles size={18} />, label: 'Housekeeping', path: '/housekeeping' },
        // 🔒 Hide POS/Inventory from Housekeeping staff
        ...(role !== 'HOUSEKEEPING' ? [
            { icon: <Utensils size={18} />, label: 'POS Terminal', path: '/pos' },
            { icon: <ShoppingBag size={18} />, label: 'Services & Menu', path: '/services' },
            { icon: <Package size={18} />, label: 'Inventory', path: '/inventory' } 
        ] : [])
      ]
    },
    {
      title: "Reservations",
      roles: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST'],
      items: [
        { icon: <CalendarCheck size={18} />, label: 'Booking List', path: '/bookings' },
        { icon: <CalendarDays size={18} />, label: 'Timeline Chart', path: '/calendar' },
      ]
    },
    {
      title: "Finance & Reports",
      roles: ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'], 
      items: [
        { icon: <Wallet size={18} />, label: 'Expenses', path: '/expenses' },
        // 🔒 Staff Directory for Admin/Owners
        ...(['ADMIN', 'OWNER', 'MANAGER'].includes(role) || user?.is_superuser ? [
            { icon: <UserCog size={18} />, label: 'Staff Directory', path: '/staff' }
        ] : []),
        { icon: <FileText size={18} />, label: 'Audit Reports', path: '/reports' },
      ]
    },
    {
      title: "Configuration",
      roles: ['ADMIN', 'OWNER', 'MANAGER'], 
      items: [
        { icon: <Settings size={18} />, label: 'Property Settings', path: '/settings' },
      ]
    },
    {
      title: "Help Desk",
      roles: ['ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'HOUSEKEEPING'],
      items: [
        { icon: <BookOpen size={18} />, label: 'Support Portal', path: '/support' },
      ]
    }
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* SIDEBAR CONTAINER */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* BRAND HEADER */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 text-white">
              {hotelName ? hotelName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-black text-white italic tracking-tighter leading-none uppercase truncate max-w-[140px]">
                {hotelName || "Loading..."}
              </h1>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">
                {platformInfo.appName}
              </p>
            </div>
          </div>
          
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar py-6">
          
          {/* 👑 SUPER ADMIN SECTION */}
          {(user?.is_superuser || role === 'ADMIN' || role === 'SUPERADMIN') && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 mb-6">
                <div className="px-4 mb-3 text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] opacity-80">
                  SaaS Control Plane
                </div>
                <button
                  onClick={() => navigate('/super-admin')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-xs group outline-none ${
                    location.pathname === '/super-admin' 
                      ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20 font-bold' 
                      : 'text-purple-300 hover:bg-purple-500/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`${location.pathname === '/super-admin' ? 'text-white' : 'text-purple-400'} transition-colors`}>
                      <Server size={18} />
                    </span>
                    <span className="uppercase tracking-widest">Global HQ</span>
                  </div>
                  <ChevronRight size={12} className={`transition-opacity ${location.pathname === '/super-admin' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              </div>
          )}

          {groups.map((group, index) => (
            // Logic: Show group if role matches OR user is ADMIN/Superuser
            (group.roles.includes(role) || role === 'ADMIN' || user?.is_superuser) && group.items.length > 0 && (
              <div key={index} className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="px-4 mb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-xs group outline-none ${
                        location.pathname === item.path 
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 font-bold' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`${location.pathname === item.path ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
                          {item.icon}
                        </span>
                        <span className="uppercase tracking-widest">{item.label}</span>
                      </div>
                      <ChevronRight size={12} className={`transition-opacity ${location.pathname === item.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </nav>

        {/* SUPPORT / FOOTER INFO */}
        <div className="px-6 pb-2">
            <div className="text-[10px] text-slate-600 text-center uppercase tracking-widest">
                Support: {platformInfo.supportPhone || platformInfo.companyName}
            </div>
        </div>

        {/* USER SESSION FOOTER */}
        <div className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-md sticky bottom-0">
          <div className="px-4 py-3 mb-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <ShieldCheck size={16} className={(user?.is_superuser || role === 'ADMIN') ? "text-purple-400" : "text-blue-400"}/>
              </div>
              <div className="overflow-hidden">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter leading-none mb-1">
                    {(user?.is_superuser || role === 'ADMIN') ? 'System Admin' : 'Active Identity'}
                  </p>
                  <p className="text-[11px] font-black text-white tracking-tight uppercase truncate">
                    {user?.username || role || 'Staff'}
                  </p>
              </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center space-x-3 px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-red-500/20 group outline-none"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span>Exit System</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;