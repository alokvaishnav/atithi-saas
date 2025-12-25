import { useEffect, useState } from 'react';
import { 
  Users, Server, Save, Search, Building2, 
  CheckCircle, XCircle, Loader2, ShieldAlert
} from 'lucide-react';
import { API_URL } from '../config';

const SuperAdmin = () => {
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'settings'
  const [tenants, setTenants] = useState([]);
  
  // State for SaaS Configuration
  const [config, setConfig] = useState({
    company_name: '', 
    support_email: '', 
    support_phone: '', 
    admin_whatsapp: '', // 👈 Added for WhatsApp Support Button
    software_version: '2.5'
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('access_token');

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Tenants (Users who are OWNERS)
        // We use the /staff endpoint which returns UserSerializer data (including subscription)
        const userRes = await fetch(`${API_URL}/api/staff/`, { headers });
        const users = await userRes.json();
        
        if(Array.isArray(users)) {
            // Filter only Hotel Owners to display in the tenant list
            const owners = users.filter(u => u.role === 'OWNER');
            setTenants(owners);
        }

        // 2. Fetch SaaS Config
        const configRes = await fetch(`${API_URL}/api/support-info/`, { headers });
        const configData = await configRes.json();
        
        // If config exists, load it into state
        if (Array.isArray(configData) && configData.length > 0) {
          setConfig(configData[0]);
        }

      } catch (err) {
        console.error("Super Admin Load Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // --- SAVE CONFIG ---
  const handleConfigSave = async (e) => {
    e.preventDefault();
    try {
      // Determine if we are creating new settings or updating existing ones
      const method = config.id ? 'PUT' : 'POST';
      const url = config.id 
        ? `${API_URL}/api/support-info/${config.id}/` 
        : `${API_URL}/api/support-info/`;

      const res = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if(res.ok) {
          alert("✅ Global Settings Updated Successfully!");
      } else {
          alert("❌ Update failed. Please check your inputs.");
      }

    } catch (err) {
      console.error(err);
      alert("Network Error: Could not save settings.");
    }
  };

  // Filter logic for search bar
  const filteredTenants = tenants.filter(t => 
    t.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.hotel_name && t.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin text-slate-400" />
        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Admin Console...</span>
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Super Admin Console</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">SaaS Infrastructure Management</p>
        </div>
        
        {/* TAB SWITCHER */}
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 self-start md:self-auto">
            <button 
                onClick={() => setActiveTab('tenants')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'tenants' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <span className="flex items-center gap-2"><Building2 size={14}/> Hotel Tenants</span>
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <span className="flex items-center gap-2"><Server size={14}/> Global Settings</span>
            </button>
        </div>
      </div>

      {/* --- TAB 1: TENANTS --- */}
      {activeTab === 'tenants' && (
        <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
            
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
                        <span className="text-3xl font-black text-slate-900">{tenants.length}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Hotel Partners</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle size={24}/></div>
                        <span className="text-3xl font-black text-slate-900">
                            {tenants.filter(t => t.subscription?.is_active).length}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Subscriptions</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl"><XCircle size={24}/></div>
                        <span className="text-3xl font-black text-slate-900">
                            {tenants.filter(t => !t.subscription?.is_active).length}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expired / Trial Ended</p>
                </div>
            </div>

            {/* TENANT TABLE */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                    <Search className="text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Search hotels, emails, or names..." 
                        className="w-full outline-none font-bold text-slate-700 placeholder:text-slate-300 bg-transparent"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-6">Hotel Name</th>
                                <th className="p-6">Owner Contact</th>
                                <th className="p-6">Plan Status</th>
                                <th className="p-6">Expiry</th>
                                <th className="p-6">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTenants.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-6">
                                        <p className="font-bold text-slate-800 text-sm">{t.hotel_name || 'Unconfigured Hotel'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {t.id}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-medium text-slate-600">{t.email}</p>
                                        <p className="text-xs text-slate-400 mt-1">{t.phone || 'No Phone'}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            t.subscription?.plan_name === 'ENTERPRISE' ? 'bg-purple-100 text-purple-600' :
                                            t.subscription?.plan_name === 'PRO' ? 'bg-blue-100 text-blue-600' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            {t.subscription?.plan_name || 'TRIAL'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-bold text-slate-700">{t.subscription?.days_left} Days</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Remaining</p>
                                    </td>
                                    <td className="p-6">
                                        {t.subscription?.is_active ? (
                                            <span className="inline-flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-widest bg-green-50 px-3 py-1 rounded-lg">
                                                <CheckCircle size={14}/> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest bg-red-50 px-3 py-1 rounded-lg">
                                                <ShieldAlert size={14}/> Locked
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTenants.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                                        No hotels found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB 2: SETTINGS --- */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm animate-in slide-in-from-right-4 fade-in duration-500">
            <div className="mb-8 border-b border-slate-100 pb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <Server className="text-blue-600"/> SaaS Configuration
                </h3>
                <p className="text-slate-500 text-sm mt-2">
                    Update the contact details displayed on the <strong>Support Page</strong> for all your hotel clients.
                </p>
            </div>
            
            <form onSubmit={handleConfigSave} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Software Company Name</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                        value={config.company_name} 
                        onChange={e => setConfig({...config, company_name: e.target.value})}
                        placeholder="e.g. Atithi SaaS Corp"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Support Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                            value={config.support_email} 
                            onChange={e => setConfig({...config, support_email: e.target.value})}
                            placeholder="support@atithi.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Support Phone</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                            value={config.support_phone} 
                            onChange={e => setConfig({...config, support_phone: e.target.value})}
                            placeholder="+91 99999 88888"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                        Admin WhatsApp (Support) <span className="bg-green-100 text-green-600 px-2 rounded text-[9px]">Important</span>
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-green-50 text-green-800 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-green-500 outline-none placeholder:text-green-300 transition-all" 
                        placeholder="+91..."
                        value={config.admin_whatsapp} 
                        onChange={e => setConfig({...config, admin_whatsapp: e.target.value})}
                    />
                    <p className="text-[10px] text-slate-400 ml-2">Clients will be redirected to this number when they click "WhatsApp Support".</p>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Software Version</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                        value={config.software_version} 
                        onChange={e => setConfig({...config, software_version: e.target.value})}
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                >
                    <Save size={18}/> Update System Settings
                </button>
            </form>
        </div>
      )}

    </div>
  );
};

export default SuperAdmin;