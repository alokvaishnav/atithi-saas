import { 
  LayoutDashboard, BedDouble, Users, CalendarCheck, 
  LogOut, ShoppingBag, Utensils, CalendarDays, FileText, 
  ConciergeBell, Sparkles // 👈 Added Sparkles for Housekeeping
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define Groups (Updated for Enterprise Operations)
  const groups = [
    {
      title: "Main",
      items: [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
      ]
    },
    {
      title: "Front Office",
      items: [
        { icon: <ConciergeBell size={18} />, label: 'Reception Desk', path: '/front-desk' },
        { icon: <BedDouble size={18} />, label: 'Room Status', path: '/rooms' },
        { icon: <Users size={18} />, label: 'Guest Management', path: '/guests' },
      ]
    },
    {
      title: "Operations",
      items: [
        { icon: <Sparkles size={18} />, label: 'Housekeeping', path: '/housekeeping' }, // 👈 NEW
        { icon: <Utensils size={18} />, label: 'POS Terminal', path: '/pos' },
        { icon: <ShoppingBag size={18} />, label: 'Services & Menu', path: '/services' },
      ]
    },
    {
      title: "Reservations",
      items: [
        { icon: <CalendarCheck size={18} />, label: 'Booking List', path: '/bookings' },
        { icon: <CalendarDays size={18} />, label: 'Timeline Chart', path: '/calendar' },
      ]
    },
    {
      title: "Night Audit",
      items: [
        { icon: <FileText size={18} />, label: 'Tax & Audit Reports', path: '/reports' }, // 👈 UPDATED LABEL
      ]
    }
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  };

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col shrink-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">A</div>
        <h1 className="text-xl font-bold text-blue-400">Atithi<span className="text-white">HMS</span></h1>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-4 space-y-6">
        {groups.map((group, index) => (
          <div key={index}>
            <div className="px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    location.pathname === item.path 
                      ? 'bg-blue-600 text-white shadow-lg font-medium' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm"
        >
          <LogOut size={18} />
          <span>Logout System</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;