import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Hotel } from 'lucide-react';
import Sidebar from './Sidebar';
import LicenseLock from './LicenseLock';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 🟢 Use Global Auth Data for Dynamic Header
  const { hotelName, user } = useAuth();

  return (
    <LicenseLock>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
        
        {/* SIDEBAR (Responsive) */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
          
          {/* MOBILE HEADER (Only visible on small screens) */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-20 shadow-sm sticky top-0">
              <div className="flex items-center gap-3">
                  {/* Toggle Sidebar Button */}
                  <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
                    aria-label="Open Menu"
                  >
                      <Menu size={24} />
                  </button>
                  
                  {/* Hotel Branding */}
                  <div className="flex items-center gap-2">
                      <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                          <Hotel size={14} className="text-white" />
                      </div>
                      <span className="font-black text-slate-800 uppercase tracking-widest text-sm truncate max-w-[150px]">
                          {hotelName || "Atithi"}
                      </span>
                  </div>
              </div>

              {/* User Avatar (Mobile) */}
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md uppercase tracking-wider border-2 border-slate-100">
                  {user?.username?.charAt(0) || 'U'}
              </div>
          </header>

          {/* PAGE CONTENT SCROLLABLE AREA */}
          {/* Uses 'custom-scrollbar' from index.css */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 scroll-smooth">
              {/* Renders the child route component (Dashboard, Rooms, etc.) */}
              <Outlet />
          </main>

        </div>
      </div>
    </LicenseLock>
  );
};

export default Layout;