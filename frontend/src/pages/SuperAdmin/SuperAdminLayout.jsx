import { useState, useEffect } from 'react';
import { 
    Server, Building, Activity, CreditCard, 
    HardDrive, Settings2, ShieldCheck, LogOut 
} from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

const SuperAdminLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    // 🛡️ SECURITY CHECK
    const isAuthorized = user?.is_superuser || user?.role === 'SUPER-ADMIN' || user?.role === 'OWNER';
    
    if (!isAuthorized) return <AccessDenied logout={logout} />;

    // Navigation Menu Configuration
    const navItems = [
        { id: 'stats', path: '/super-admin/stats', icon: Activity, label: 'Command Center' },
        { id: 'tenants', path: '/super-admin/tenants', icon: Building, label: 'Tenant Manager' },
        { id: 'plans', path: '/super-admin/plans', icon: CreditCard, label: 'Subscription Plans' },
        { id: 'infra', path: '/super-admin/infrastructure', icon: HardDrive, label: 'Infrastructure' },
        { id: 'config', path: '/super-admin/config', icon: Settings2, label: 'Global Config' }
    ];

    return (
        <div className="flex h-screen bg-slate-950 font-sans text-white overflow-hidden">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Server size={20} className="text-white"/>
                        </div>
                        <div>
                            <h1 className="font-black text-lg tracking-tight">GLOBAL HQ</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">SaaS Control</p>
                        </div>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map(item => {
                        // Check if current URL includes the path (for active state)
                        const isActive = location.pathname.includes(item.path);
                        
                        return (
                            <Link 
                                key={item.id}
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all group ${
                                    isActive 
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <item.icon size={18} className={isActive ? "text-white" : "text-slate-500 group-hover:text-white transition-colors"}/> 
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={logout} 
                        className="w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-xl font-bold uppercase text-xs transition-colors"
                    >
                        <LogOut size={16}/> Log Out
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
                {/* Header / Breadcrumb Area */}
                <div className="px-8 pt-8 pb-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                {navItems.find(i => location.pathname.includes(i.path))?.label || 'Dashboard'}
                            </h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                                System Control • {user?.username}
                            </p>
                        </div>
                        {/* Optional: Add Global Actions here like "Server Status: Online" */}
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Connection</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Content Rendered Here via Router */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

// 🔒 Security Fallback UI
const AccessDenied = ({ logout }) => (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 gap-6">
        <div className="p-6 bg-red-900/20 rounded-full border-2 border-red-900/50">
            <ShieldCheck size={64} className="text-red-500"/>
        </div>
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">Access Denied</h1>
            <p className="text-red-400 font-mono text-sm">ERR_PERMISSIONS_INSUFFICIENT</p>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">
                Your account does not have the required Superuser privileges to access the Global SaaS Controller.
            </p>
        </div>
        <button onClick={logout} className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all">
            Terminate Session
        </button>
    </div>
);

export default SuperAdminLayout;