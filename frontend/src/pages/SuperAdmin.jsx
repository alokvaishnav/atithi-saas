import { useEffect, useState, useCallback } from 'react';
import { 
  Server, Shield, Building, Activity, 
  Search, Power, Trash2, Plus, Loader2, 
  Database, Cpu, AlertTriangle, Eye, CheckCircle,
  TrendingUp, CreditCard, RefreshCw, Filter, X, Key,
  ShieldCheck, History, DollarSign, Globe, Settings2,
  Zap 
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; // 🟢 Import Context

const SuperAdmin = () => {
  const { token, user } = useAuth(); // 🟢 Global Auth
  
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({ total_hotels: 0, active_licenses: 0, platform_revenue: 0, total_rooms: 0 });
  const [logs, setLogs] = useState([]); // System Audit Trail
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', domain: '', admin_email: '', plan: 'PRO' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ SECURITY: Double Check
  if (!user?.is_superuser && !loading) {
      return (
        <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 gap-4">
            <ShieldCheck size={64}/>
            <h1 className="text-2xl font-black uppercase tracking-widest">System Restricted</h1>
        </div>
      );
  }

  // --- FETCH TENANTS & GLOBAL STATS ---
  const fetchStats = useCallback(async (isInitial = false) => {
    if (!token) return;
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const res = await fetch(`${API_URL}/api/super-admin/stats/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTenants(data.hotels || []);
        setStats(data.stats || stats);
        
        // Fetch Logs if needed
        const logRes = await fetch(`${API_URL}/api/logs/`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (logRes.ok) setLogs(await logRes.json());
      }
    } catch (err) { 
      console.error("SuperAdmin Engine Error:", err); 
    } finally { 
      setLoading(false); 
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(true); }, [fetchStats]);

  // --- ACTIONS ---
  const toggleStatus = async (id, currentStatus) => {
    if(!window.confirm(`Are you sure you want to ${currentStatus === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'} this hotel?`)) return;
    
    try {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const res = await fetch(`${API_URL}/api/super-admin/tenants/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) {
            setTenants(tenants.map(t => t.id === id ? { ...t, status: newStatus } : t));
            fetchStats(false);
        }
    } catch (err) { console.error(err); }
  };

  const generateLicenseKey = (hotelId) => {
      const random = Math.random().toString(36).substring(2, 10).toUpperCase();
      alert(`New License Generated for ID ${hotelId}:\nATITHI-${random}`);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const res = await fetch(`${API_URL}/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                hotel_name: formData.name,
                username: formData.domain,
                email: formData.admin_email,
                password: 'DefaultPassword123!', // In real app, generate random or send invite link
                user_role: 'OWNER'
            })
        });

        if (res.ok) {
            setShowCreateModal(false);
            setFormData({ name: '', domain: '', admin_email: '', plan: 'PRO' });
            fetchStats(false);
            alert("Tenant Deployed Successfully 🚀");
        } else {
            alert("Deployment failed. Instance name likely exists.");
        }
    } catch (err) { 
        console.error(err); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  // --- FILTER LOGIC ---
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
            <Loader2 className="animate-spin text-purple-500" size={60}/>
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={24}/>
        </div>
        <p className="text-purple-400 font-black uppercase tracking-[0.4em] text-xs">Accessing System Core...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen font-sans text-white animate-in fade-in duration-700">
      
      {/* 1. TOP HEADER & SEARCH */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <span className="bg-purple-600 p-2 rounded-xl shadow-xl shadow-purple-900/40"><Server size={24}/></span>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Platform Core</h2>
             {refreshing && <RefreshCw size={14} className="animate-spin text-slate-500" />}
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest ml-1 flex items-center gap-2">
            <Globe size={12}/> Global Infrastructure Management
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Cluster ID or Property..." 
                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-purple-500 outline-none font-bold text-sm transition-all" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            <button onClick={() => setShowPricingModal(true)} className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-2">
                <Settings2 size={18}/> Pricing Config
            </button>
            <button onClick={() => setShowCreateModal(true)} className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-500 flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition-all active:scale-95">
                <Plus size={18}/> Onboard Hotel
            </button>
        </div>
      </div>

      {/* 2. INFRASTRUCTURE HEALTH GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard title="Platform Nodes" val={stats.total_hotels} icon={Building} color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
        <MetricCard title="Active Licenses" val={stats.active_licenses} icon={ShieldCheck} color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" />
        <MetricCard title="Total Inventory" val={stats.total_rooms} icon={Database} color="text-orange-400" bg="bg-orange-400/10" border="border-orange-400/20" />
        <MetricCard title="Platform ARR" val={`₹${(stats.platform_revenue / 100000).toFixed(1)}L`} icon={TrendingUp} color="text-purple-400" bg="bg-purple-400/10" border="border-purple-400/20" />
      </div>

      {/* 3. HOTEL REGISTRY & AUDIT TRAIL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left: Tenant Databases */}
        <div className="xl:col-span-2 bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <Database className="text-purple-500" size={24}/>
                    <h3 className="text-xl font-black text-white uppercase italic">Tenant Hub</h3>
                </div>
                <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    {['ALL', 'ACTIVE', 'SUSPENDED'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setStatusFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50">
                        <tr>
                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node Identity</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tier</th>
                            <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ops Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {filteredTenants.map(t => (
                            <tr key={t.id} className="hover:bg-slate-800/40 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-purple-500 transition-all">
                                            <Building size={22}/>
                                        </div>
                                        <div>
                                            <span className="block text-base font-black text-white uppercase tracking-tight italic">{t.name}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {t.owner || 'NODE_01'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${
                                        t.plan === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                        {t.plan || 'PRO'}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button onClick={() => setSelectedTenant(t)} className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white hover:bg-slate-700 transition-all"><Eye size={18}/></button>
                                        <button onClick={() => generateLicenseKey(t.id)} className="p-3 bg-slate-800 text-blue-400 rounded-xl hover:bg-blue-400/10 transition-all"><Key size={18}/></button>
                                        <button onClick={() => toggleStatus(t.id, t.status || 'ACTIVE')} className={`p-3 rounded-xl transition-all ${t.status === 'SUSPENDED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} hover:text-white`}><Power size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Right: Global System Logs */}
        <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-8 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
                <History className="text-blue-500" size={20}/>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Platform Audit Trail</h3>
            </div>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className="flex gap-4 items-start pb-4 border-l border-slate-800 ml-2 pl-4 relative">
                        <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${log.action === 'CREATE' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-300 leading-snug">{log.details}</p>
                            <p className="text-[9px] text-slate-600 font-black uppercase mt-1 tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-4">
                        <Activity size={48} strokeWidth={1}/>
                        <p className="text-[10px] font-black uppercase">No platform events</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 4. ONBOARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <form onSubmit={handleCreate} className="bg-slate-900 p-10 rounded-[40px] w-full max-w-lg border border-slate-700 space-y-6 shadow-2xl relative">
                <button type="button" onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X/></button>
                
                <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Onboard Instance</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Initiating New Infrastructure Deployment</p>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Legal Property Entity</label>
                        <input required className="w-full p-5 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 outline-none focus:border-purple-500 transition-all shadow-inner" 
                            placeholder="Grand Atithi Plaza"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Cluster ID (Username)</label>
                            <input required className="w-full p-5 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 outline-none focus:border-purple-500 transition-all shadow-inner" 
                                placeholder="grand_01"
                                value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Service Tier</label>
                            <select className="w-full p-5 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 outline-none focus:border-purple-500 transition-all shadow-inner"
                                value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                                <option value="PRO">PRO • Standard</option>
                                <option value="ENTERPRISE">ENTERPRISE • Scale</option>
                            </select>
                         </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Root Administrator Email</label>
                        <input required type="email" className="w-full p-5 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 outline-none focus:border-purple-500 transition-all shadow-inner" 
                            placeholder="owner@property.com"
                            value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} />
                    </div>
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-500 shadow-2xl shadow-purple-900/50 transition-all flex justify-center items-center gap-3">
                        {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Cpu size={18}/> DEPLOY TO PRODUCTION</>}
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* 5. INSPECTION MODAL */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-slate-900 p-12 rounded-[50px] w-full max-w-xl border border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Globe size={250}/></div>

                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">{selectedTenant.name}</h3>
                        <p className="text-purple-400 font-mono text-sm mt-1 uppercase tracking-widest">Instance Node: {selectedTenant.owner}.atithi.live</p>
                    </div>
                    <button onClick={() => setSelectedTenant(null)} className="p-3 bg-slate-800 rounded-full hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
                    <DetailBox label="Onboarded On" val={new Date(selectedTenant.joined).toLocaleDateString('en-GB')} />
                    <DetailBox label="Service Level" val={selectedTenant.plan || 'PRO'} />
                    <DetailBox label="Deployment Status" val={selectedTenant.status || 'ACTIVE'} highlight={selectedTenant.status === 'SUSPENDED' ? 'text-red-500' : 'text-emerald-500'} />
                    <DetailBox label="Cluster Storage" val="2.8 GB / 50 GB" />
                </div>

                <div className="flex gap-4 relative z-10">
                      <button className="flex-1 py-5 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                        <RefreshCw size={18}/> Cold Resync
                      </button>
                      <button className="flex-1 py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-500 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                        <Trash2 size={18}/> Termination
                      </button>
                </div>
            </div>
        </div>
      )}

      {/* 6. PRICING CONFIG MODAL */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-slate-900 p-10 rounded-[40px] w-full max-w-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
                <button onClick={() => setShowPricingModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"><X/></button>
                <div className="mb-10 text-center">
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Global Billing Core</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Manage platform subscription rates</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <PricingControl title="PRO TIER" current="₹2,999" icon={Zap} />
                    <PricingControl title="ENTERPRISE" current="₹8,999" icon={Shield} />
                </div>

                <button onClick={() => setShowPricingModal(false)} className="w-full py-5 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px]">Save Global Parameters</button>
            </div>
        </div>
      )}

    </div>
  );
};

// Sub-components
const MetricCard = ({ title, val, icon: Icon, color, bg, border }) => (
    <div className={`bg-slate-900 p-7 rounded-[35px] border ${border} relative overflow-hidden group hover:shadow-2xl transition-all`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-all ${color}`}><Icon size={56}/></div>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</h3>
        <p className={`text-4xl font-black ${color} tracking-tighter italic`}>{val}</p>
    </div>
);

const DetailBox = ({ label, val, highlight = "text-white" }) => (
    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
        <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] block mb-2">{label}</span>
        <span className={`text-base font-black uppercase tracking-tight ${highlight}`}>{val}</span>
    </div>
);

const PricingControl = ({ title, current, icon: Icon }) => (
    <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 group hover:border-purple-500 transition-all shadow-inner">
        <div className="flex items-center gap-3 mb-6">
            <Icon className="text-purple-500" size={20}/>
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs">{title}</h4>
        </div>
        <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white italic">{current}</span>
            <button className="text-[10px] font-black text-purple-400 hover:text-white uppercase tracking-widest">Change</button>
        </div>
    </div>
);

export default SuperAdmin;

