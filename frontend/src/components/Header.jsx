import { useAuth } from '../context/AuthContext'; // 👈 Import Context
import { Bell, Search, LogOut, UserCircle } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth(); // 👈 Get User & Logout function

  // 🛡️ Logout Confirmation (Consistent with Sidebar)
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <header className="bg-white border-b border-slate-100 h-20 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm/50 backdrop-blur-xl bg-white/80">
      
      {/* Search Bar */}
      <div className="relative w-96 hidden md:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search bookings, guests, or rooms..." 
          className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800 leading-none">
              {user || "User"}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              Active Now
            </p>
          </div>
          
          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-md text-slate-500">
            <UserCircle size={24} />
          </div>

          <button 
            onClick={handleLogout} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;