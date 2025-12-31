import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Hotel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LicenseLock from './LicenseLock';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 🟢 Use Global Auth Data for Dynamic Header
  const { hotelName, user } = useAuth();

  return (
    <LicenseLock>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
        
        {/* Sidebar (Responsive) */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10 shadow-sm sticky top-0">
              <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                  >
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

              {/* User Avatar (Mobile) */}
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md uppercase">
                  {user?.username?.charAt(0) || 'U'}
              </div>
          </div>

          {/* Page Content Scrollable Area */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
              <Outlet />
          </main>

        </div>
      </div>
    </LicenseLock>
  );
};

export default Layout;