import { 
  LayoutDashboard, BedDouble, Users, CalendarCheck, 
  LogOut, ShoppingBag, Utensils, CalendarDays, FileText, 
  ConciergeBell, Sparkles, ShieldCheck 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🛡️ Retrieve the role stored during the login process
  const userRole = localStorage.getItem('user_role') || 'RECEPTIONIST';

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
        // Conditional POS access: Hidden for pure Housekeeping roles
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
      title: "Night Audit",
      roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'], // Restricted to high-level access
      items: [
        { icon: <FileText size={18} />, label: 'Tax & Audit Reports', path: '/reports' },
      ]
    }
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear(); // Clears all tokens and roles
      window.location.href = '/login';
    }
  };

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col shrink-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black">A</div>
        <h1 className="text-xl font-black text-blue-400">Atithi<span className="text-white text-opacity-50 font-normal">HMS</span></h1>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-4 space-y-6">
        {groups.map((group, index) => (
          // 🛡️ Filter: Only render the group if current userRole is authorized
          group.roles.includes(userRole) && (
            <div key={index}>
              <div className="px-4 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                      location.pathname === item.path 
                        ? 'bg-blue-600 text-white shadow-lg font-bold' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-2 mb-3 bg-slate-800/50 rounded-xl border border-slate-700">
           <p className="text-[10px] text-slate-500 font-bold uppercase">Active Role</p>
           <div className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-blue-400"/>
              <p className="text-xs font-black text-white">{userRole}</p>
           </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-bold"
        >
          <LogOut size={18} />
          <span>Logout System</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;