import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, BedDouble, Users, CalendarCheck, 
  LogOut, ShoppingBag, Utensils, CalendarDays, FileText, 
  ConciergeBell, Sparkles, ShieldCheck, UserCog, Wallet, 
  BookOpen, ChevronRight 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hotelName, setHotelName] = useState("ATITHI HMS");
  
  // 🛡️ Retrieve the role stored during the login process
  const userRole = localStorage.getItem('user_role') || 'RECEPTIONIST';

  // 🏨 Fetch dynamic branding from Property Settings
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/api/settings/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHotelName(data[0].hotel_name.toUpperCase());
        }
      } catch (err) {
        console.log("Using default branding");
      }
    };
    fetchBranding();
  }, []);

  // Define Groups with Professional Role-Based Access Control (RBAC)
  const groups = [
    {
      title: "Main",
      roles: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'],
      items: [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
      ]
    },
    {
      title: "Front Office",
      roles: ['OWNER', 'MANAGER', 'RECEPTIONIST'],
      items: [
        { icon: <ConciergeBell size={18} />, label: 'Reception Desk', path: '/front-desk' },
        { icon: <BedDouble size={18} />, label: 'Room Status', path: '/rooms' },
        { icon: <Users size={18} />, label: 'Guest Profiles', path: '/guests' },
      ]
    },
    {
      title: "Operations",
      roles: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING'],
      items: [
        { icon: <Sparkles size={18} />, label: 'Housekeeping', path: '/housekeeping' },
        ...(userRole !== 'HOUSEKEEPING' ? [
            { icon: <Utensils size={18} />, label: 'POS Terminal', path: '/pos' },
            { icon: <ShoppingBag size={18} />, label: 'Services & Menu', path: '/services' }
        ] : [])
      ]
    },
    {
      title: "Reservations",
      roles: ['OWNER', 'MANAGER', 'RECEPTIONIST'],
      items: [
        { icon: <CalendarCheck size={18} />, label: 'Booking List', path: '/bookings' },
        { icon: <CalendarDays size={18} />, label: 'Timeline Chart', path: '/calendar' },
      ]
    },
    {
      title: "Finance & HR",
      roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'], 
      items: [
        { icon: <Wallet size={18} />, label: 'Expenses & Costs', path: '/expenses' }, // 🆕 ADDED THIS
        { icon: <UserCog size={18} />, label: 'Staff Directory', path: '/staff' },
        { icon: <FileText size={18} />, label: 'Tax & Audit Reports', path: '/reports' },
      ]
    },
    {
      title: "Help Desk",
      roles: ['OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'HOUSEKEEPING'],
      items: [
        { icon: <BookOpen size={18} />, label: 'Support Portal', path: '/support' },
      ]
    }
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear(); 
      window.location.href = '/login';
    }
  };

  return (
    <div className="h-screen w-72 bg-slate-950 text-white flex flex-col shrink-0 overflow-hidden border-r border-slate-800 shadow-2xl">
      {/* Brand Header */}
      <div className="p-8 border-b border-white/5 flex items-center gap-3 bg-slate-950">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
          {hotelName.charAt(0)}
        </div>
        <div>
          <h1 className="text-sm font-black text-white italic tracking-tighter leading-none">{hotelName}</h1>
          <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">Enterprise Cloud HMS</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-4 space-y-8 overflow-y-auto scrollbar-hide py-8">
        {groups.map((group, index) => (
          group.roles.includes(userRole) && (
            <div key={index} className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="px-4 mb-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-xs group ${
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

      {/* User Session Footer */}
      <div className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-md sticky bottom-0">
        <div className="px-4 py-3 mb-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <ShieldCheck size={16} className="text-blue-400"/>
            </div>
            <div>
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter leading-none mb-1">Identity</p>
               <p className="text-[11px] font-black text-white tracking-tight">{userRole}</p>
            </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-red-500/20 group"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          <span>Exit System</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;