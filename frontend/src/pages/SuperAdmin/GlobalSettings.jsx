import { useState } from 'react';
import { 
  Server, Building, Activity, CreditCard, 
  HardDrive, Settings2, ShieldCheck, Loader2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 

// Import your new sub-pages
import CommandCenter from './CommandCenter';
import TenantManager from './TenantManager';
import SubscriptionPlans from './SubscriptionPlans';
import Infrastructure from './Infrastructure';
import GlobalConfig from './GlobalConfig';

const GlobalSettings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('COMMAND'); 
  const [loading, setLoading] = useState(false);

  // 🛡️ SECURITY CHECK
  const isAuthorized = user?.is_superuser || user?.role === 'SUPERADMIN' || user?.role === 'OWNER';
  
  if (!isAuthorized) return <AccessDenied user={user} logout={logout} />;

  const renderContent = () => {
    switch (activeTab) {
        case 'COMMAND': return <CommandCenter />;
        case 'TENANTS': return <TenantManager />;
        case 'PLANS': return <SubscriptionPlans />;
        case 'INFRA': return <Infrastructure />;
        case 'CONFIG': return <GlobalConfig />;
        default: return <CommandCenter />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-white overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
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
            
            <nav className="flex-1 p-4 space-y-2">
                {[
                    { id: 'COMMAND', icon: Activity, label: 'Command Center' },
                    { id: 'TENANTS', icon: Building, label: 'Tenant Manager' },
                    { id: 'PLANS', icon: CreditCard, label: 'Subscription Plans' },
                    { id: 'INFRA', icon: HardDrive, label: 'Infrastructure' },
                    { id: 'CONFIG', icon: Settings2, label: 'Global Config' }
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <item.icon size={18}/> {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button onClick={logout} className="w-full py-3 text-red-400 hover:bg-slate-800 rounded-xl font-bold uppercase text-xs transition-colors">Log Out</button>
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-8 relative">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{activeTab.replace('_', ' ')}</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    System Control • {user?.username}
                </p>
            </div>
            {renderContent()}
        </div>
    </div>
  );
};

const AccessDenied = ({ user, logout }) => (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 gap-6">
        <ShieldCheck size={80} className="text-red-600"/>
        <div className="text-center">
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">Access Denied</h1>
            <p className="text-red-500 font-mono mt-2">ERR_PERMISSIONS_INSUFFICIENT</p>
        </div>
        <button onClick={logout} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 font-bold text-xs uppercase tracking-widest">Log Out</button>
    </div>
);

export default GlobalSettings;