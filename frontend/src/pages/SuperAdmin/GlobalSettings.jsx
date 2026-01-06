import { useEffect, useState, useCallback } from 'react';
import { 
  Server, Shield, Building, Activity, 
  Search, Power, Trash2, Plus, Loader2, 
  Database, Cpu, CheckCircle, Edit3,
  TrendingUp, RefreshCw, X, Key, Calendar,
  ShieldCheck, History, Globe, Settings2,
  Zap, AlertTriangle, Copy, Mail, MessageCircle, Save, Megaphone
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext'; 

const GlobalSettings = () => {
  const { token, user } = useAuth(); 
  
  // --- DATA STATE ---
  const [tenants, setTenants] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ 
    total_hotels: 0, active_licenses: 0, platform_revenue: 0, total_rooms: 0 
  });
  const [logs, setLogs] = useState([]);
  
  // --- PLATFORM CONFIG STATE ---
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, ANNOUNCEMENTS, CONFIG
  const [platformConfig, setPlatformConfig] = useState({
    app_name: '', company_name: '', support_email: '', support_phone: '',
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '',
    welcome_email_subject: '', welcome_email_body: ''
  });

  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // --- MODAL STATES ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null); // For Inspection
  const [editingHotel, setEditingHotel] = useState(null);     // For Editing (Name/License)
  
  // --- FORM STATES ---
  const [formData, setFormData] = useState({ name: '', domain: '', admin_email: '', plan: 'PRO' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [editForm, setEditForm] = useState({ hotel_name: '', license_expiry: '' });

  // 🛡️ SECURITY: Double Check Access
  if (!user?.is_superuser && user?.role !== 'SUPERADMIN' && !loading) {
      return (
        <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 gap-4">
            <ShieldCheck size={64}/>
            <h1 className="text-2xl font-black uppercase tracking-widest">System Restricted</h1>
            <p className="text-slate-500 font-mono">ERR_ACCESS_DENIED_0x01</p>
        </div>
      );
  }

  // ==================================================================================
  // 1. DATA FETCHING ENGINE
  // ==================================================================================
  const fetchAllData = useCallback(async (isInitial = false) => {
    if (!token) return;
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const [statsRes, logsRes, configRes] = await Promise.all([
          fetch(`${API_URL}/api/super-admin/stats/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/logs/`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/super-admin/platform-settings/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setTenants(data.hotels || []);
        setStats(data.stats || { total_hotels: 0, active_licenses: 0, platform_revenue: 0, total_rooms: 0 });
        setAnnouncements(data.announcements || []);
      }
      if (logsRes.ok) setLogs(await logsRes.json());
      if (configRes.ok) setPlatformConfig(await configRes.json());

    } catch (err) { 
      console.error("SuperAdmin Engine Error:", err); 
    } finally { 
      setLoading(false); 
      setRefreshing(false);
    }
  }, [token]); 

  useEffect(() => { fetchAllData(true); }, [fetchAllData]);

  // ==================================================================================
  // 2. TENANT ACTIONS
  // ==================================================================================

  // A. Toggle Status (Active/Suspended)
  const toggleStatus = async (id, currentStatus) => {
    const originalTenants = [...tenants];
    setTenants(tenants.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t)); // Optimistic UI

    if(!window.confirm(`Confirm: ${currentStatus === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'} Node ID #${id}?`)) {
        setTenants(originalTenants); 
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/api/super-admin/stats/`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: 'toggle_status', hotel_id: id }) 
        });
        if(!res.ok) {
            setTenants(originalTenants);
            alert("Command Failed: Server rejected request.");
        }
    } catch (err) { 
        setTenants(originalTenants);
        console.error(err); 
    }
  };

  // B. Generate License Key
  const generateLicenseKey = (hotelId) => {
      const randomKey = `ATITHI-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-PRO`;
      navigator.clipboard.writeText(randomKey);
      alert(`LICENSE GENERATED & COPIED TO CLIPBOARD:\n\n${randomKey}`);
  };

  // C. Create New Tenant
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const res = await fetch(`${API_URL}/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                username: formData.domain, 
                email: formData.admin_email,
                password: 'DefaultPassword123!', 
                first_name: formData.name, 
                last_name: 'Admin',
                role: 'OWNER'
            })
        });

        if (res.ok) {
            setShowCreateModal(false);
            setFormData({ name: '', domain: '', admin_email: '', plan: 'PRO' });
            fetchAllData(false);
            alert("🚀 TENANT DEPLOYED SUCCESSFULLY\n\nCredentials sent to admin email.");
        } else {
            const err = await res.json();
            alert("Deployment Halted: " + (JSON.stringify(err) || "Unknown error"));
        }
    } catch (err) { 
        console.error(err);
        alert("Network Error: Could not reach control plane.");
    } finally { 
        setIsSubmitting(false); 
    }
  };

  // D. Edit Tenant (Name & License)
  const openEditModal = (hotel) => {
    setEditingHotel(hotel);
    // Populate form with existing data (handle nested hotel_settings object)
    setEditForm({
        hotel_name: hotel.hotel_settings?.hotel_name || hotel.hotel_name || '',
        license_expiry: hotel.hotel_settings?.license_expiry || ''
    });
  };

  const handleSaveTenantEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const res = await fetch(`${API_URL}/api/super-admin/stats/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                action: 'edit_tenant',
                hotel_id: editingHotel.id,
                ...editForm
            })
        });

        if(res.ok) {
            setMsg({ type: 'success', text: 'Tenant updated successfully' });
            setEditingHotel(null);
            fetchAllData(false); // Refresh data
            setTimeout(() => setMsg({type:'', text:''}), 3000);
        } else {
            setMsg({ type: 'error', text: 'Update failed on server' });
        }
    } catch (err) {
        setMsg({ type: 'error', text: 'Network Error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  // ==================================================================================
  // 3. ANNOUNCEMENTS & CONFIG ACTIONS
  // ==================================================================================

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await fetch(`${API_URL}/api/super-admin/stats/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: 'create_announcement', ...newAnnouncement })
        });
        setNewAnnouncement({ title: '', message: '' });
        fetchAllData(false);
        setMsg({ type: 'success', text: 'Announcement Broadcasted!' });
        setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err) { alert("Failed to post"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteAnnouncement = async (id) => {
      if(!confirm("Delete this announcement?")) return;
      try {
          await fetch(`${API_URL}/api/super-admin/stats/`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action: 'delete_announcement', id }) 
          });
          fetchAllData(false);
      } catch (err) {}
  };

  const handleSaveConfig = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const res = await fetch(`${API_URL}/api/super-admin/platform-settings/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(platformConfig)
          });
          if(res.ok) alert("Global System Configuration Updated Successfully! 🚀");
          else alert("Failed to save configuration.");
      } catch(err) { console.error(err); }
      finally { setIsSubmitting(false); }
  };

  // --- FILTER LOGIC ---
  const filteredTenants = tenants.filter(t => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (t.hotel_settings?.hotel_name || t.username || '').toLowerCase().includes(term);
    const emailMatch = (t.email || '').toLowerCase().includes(term);
    
    const isActive = t.is_active;
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'ACTIVE' && isActive) || 
                          (statusFilter === 'SUSPENDED' && !isActive);
    return (nameMatch || emailMatch) && matchesStatus;
  });

  // --- LOADING RENDER ---
  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
            <Loader2 className="animate-spin text-purple-500" size={60}/>
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={24}/>
        </div>
        <div className="flex flex-col items-center">
            <p className="text-purple-400 font-black uppercase tracking-[0.4em] text-xs">Connecting to Core...</p>
            <p className="text-slate-600 font-mono text-[10px] mt-2">v3.0.0-stable</p>
        </div>
    </div>
  );

  // ==================================================================================
  // MAIN RENDER
  // ==================================================================================
  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen font-sans text-white animate-in fade-in duration-700">
      
      {/* 1. TOP HEADER & TABS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <span className="bg-purple-600 p-2 rounded-xl shadow-xl shadow-purple-900/40"><Server size={24}/></span>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Platform Core</h2>
             {refreshing && <RefreshCw size={14} className="animate-spin text-slate-500" />}
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest ml-1 flex items-center gap-2">
            <Globe size={12}/> Global Infrastructure Management • {platformConfig.app_name || 'SaaS Engine'}
          </p>
        </div>
        
        <div className="flex gap-4">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
                {['DASHBOARD', 'ANNOUNCEMENTS', 'CONFIG'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            {activeTab === 'DASHBOARD' && (
                <button onClick={() => setShowCreateModal(true)} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                    <Plus size={18}/> New Tenant
                </button>
            )}
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 mb-6 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* --- VIEW: DASHBOARD --- */}
      {activeTab === 'DASHBOARD' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            
            {/* METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <MetricCard title="Total Nodes" val={stats.total_hotels} icon={Building} color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
                <MetricCard title="Active Tenants" val={stats.active_licenses || stats.total_hotels} icon={ShieldCheck} color="text-emerald-400" bg="bg-emerald-400/10" border="border-emerald-400/20" />
                <MetricCard title="Total Inventory" val={stats.total_rooms} icon={Database} color="text-orange-400" bg="bg-orange-400/10" border="border-orange-400/20" />
                <MetricCard title="Platform ARR" val={`₹${((stats.platform_revenue || 0) / 100000).toFixed(1)}L`} icon={TrendingUp} color="text-purple-400" bg="bg-purple-400/10" border="border-purple-400/20" />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left: Tenant List */}
                <div className="xl:col-span-2 bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Database className="text-purple-500" size={24}/>
                            <h3 className="text-xl font-black text-white uppercase italic">Tenant Hub</h3>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold outline-none focus:border-purple-500 w-40 transition-all"
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
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
                                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-purple-500 transition-all">
                                                    <Building size={18}/>
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-black text-white uppercase tracking-tight italic">
                                                        {t.hotel_settings?.hotel_name || t.username}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                        ID: {t.username}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                                t.plan === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {t.plan || 'PRO'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Inspect */}
                                                <button onClick={() => setSelectedTenant(t)} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-all" title="Inspect Node"><Activity size={16}/></button>
                                                
                                                {/* Edit Tenant */}
                                                <button onClick={() => openEditModal(t)} className="p-2 bg-slate-800 text-blue-400 rounded-lg hover:bg-blue-400/10 transition-all" title="Edit Tenant"><Edit3 size={16}/></button>
                                                
                                                {/* Generate Key */}
                                                <button onClick={() => generateLicenseKey(t.id)} className="p-2 bg-slate-800 text-yellow-400 rounded-lg hover:bg-yellow-400/10 transition-all" title="Generate Key"><Key size={16}/></button>
                                                
                                                {/* Toggle Status */}
                                                <button onClick={() => toggleStatus(t.id, t.is_active ? 'ACTIVE' : 'SUSPENDED')} className={`p-2 rounded-lg transition-all ${!t.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} hover:text-white`}>
                                                    <Power size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Logs */}
                <div className="bg-slate-900 rounded-[40px] border border-slate-800 p-8 flex flex-col h-[600px] xl:h-auto overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
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
                        )) : <p className="text-center text-slate-600 text-xs">No logs found.</p>}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW: ANNOUNCEMENTS --- */}
      {activeTab === 'ANNOUNCEMENTS' && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4">
             {/* Create Form */}
             <div className="md:col-span-1 bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800 h-fit">
                 <h3 className="font-black text-white mb-4 flex items-center gap-2"><Megaphone size={20} className="text-orange-400"/> New Announcement</h3>
                 <form onSubmit={handlePostAnnouncement} className="space-y-4">
                     <div>
                         <label className="text-[10px] font-black text-slate-500 uppercase">Title</label>
                         <input required className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-white font-bold outline-none focus:border-purple-500" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                     </div>
                     <div>
                         <label className="text-[10px] font-black text-slate-500 uppercase">Message</label>
                         <textarea required rows="4" className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-white text-sm outline-none focus:border-purple-500" value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})} />
                     </div>
                     <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-500 transition-colors flex justify-center items-center gap-2">
                         {isSubmitting ? <Loader2 className="animate-spin"/> : <Plus size={18}/>} Post to All Dashboards
                     </button>
                 </form>
             </div>

             {/* List */}
             <div className="md:col-span-2 space-y-4">
                 {announcements.map(ann => (
                     <div key={ann.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex justify-between items-start">
                         <div>
                             <h4 className="font-bold text-white text-lg">{ann.title}</h4>
                             <p className="text-slate-400 mt-1">{ann.message}</p>
                             <p className="text-xs text-slate-600 mt-4 font-mono">{new Date(ann.created_at).toLocaleString()}</p>
                         </div>
                         <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-400 hover:text-red-500 bg-slate-950 p-2 rounded-lg border border-slate-800"><Trash2 size={18}/></button>
                     </div>
                 ))}
                 {announcements.length === 0 && <div className="text-center text-slate-600 p-10 font-bold uppercase tracking-widest">No active announcements</div>}
             </div>
         </div>
      )}

      {/* --- VIEW: GLOBAL CONFIG --- */}
      {activeTab === 'CONFIG' && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleSaveConfig} className="bg-slate-900 p-10 rounded-[40px] border border-slate-800 shadow-2xl space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Settings2 size={250}/></div>
                  
                  {/* BRANDING */}
                  <div className="relative z-10">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                          <Settings2 size={16}/> Software Branding
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">App Name</label>
                              <input className="w-full p-4 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 focus:border-purple-500 outline-none transition-all" 
                                  value={platformConfig.app_name} onChange={e => setPlatformConfig({...platformConfig, app_name: e.target.value})} placeholder="My SaaS Name"/>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Company Name (Legal)</label>
                              <input className="w-full p-4 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 focus:border-purple-500 outline-none transition-all" 
                                  value={platformConfig.company_name} onChange={e => setPlatformConfig({...platformConfig, company_name: e.target.value})} placeholder="My Tech Pvt Ltd"/>
                          </div>
                      </div>
                  </div>

                  {/* CONTACT INFO */}
                  <div className="relative z-10">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                          <Globe size={16}/> Public Contact Info
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Support Email</label>
                              <input className="w-full p-4 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 focus:border-purple-500 outline-none transition-all" 
                                  value={platformConfig.support_email} onChange={e => setPlatformConfig({...platformConfig, support_email: e.target.value})}/>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Support Phone / WhatsApp</label>
                              <input className="w-full p-4 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 focus:border-purple-500 outline-none transition-all" 
                                  value={platformConfig.support_phone} onChange={e => setPlatformConfig({...platformConfig, support_phone: e.target.value})}/>
                          </div>
                      </div>
                  </div>

                  {/* SYSTEM SMTP */}
                  <div className="relative z-10">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
                          <Mail size={16}/> System SMTP (Global)
                      </h3>
                      <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 mb-6 text-xs text-slate-400">
                          These credentials will be used to send <strong>Welcome Emails</strong> and <strong>Password Resets</strong> to your tenants.
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input className="w-full p-4 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 outline-none focus:border-purple-500 transition-all" 
                              value={platformConfig.smtp_host} onChange={e => setPlatformConfig({...platformConfig, smtp_host: e.target.value})} placeholder="SMTP Host (e.g., smtp.gmail.com)"/>
                          <input className="w-full p-4 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 outline-none focus:border-purple-500 transition-all" 
                              value={platformConfig.smtp_user} onChange={e => setPlatformConfig({...platformConfig, smtp_user: e.target.value})} placeholder="SMTP Username"/>
                          <input type="password" className="w-full p-4 bg-slate-950 rounded-2xl font-bold text-white border border-slate-800 outline-none focus:border-purple-500 transition-all" 
                              value={platformConfig.smtp_password} onChange={e => setPlatformConfig({...platformConfig, smtp_password: e.target.value})} placeholder="SMTP Password"/>
                      </div>
                  </div>

                  <div className="pt-6 flex justify-end relative z-10">
                      <button type="submit" disabled={isSubmitting} className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 shadow-xl shadow-purple-900/40 flex items-center gap-3 transition-all active:scale-95">
                          {isSubmitting ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                          Save System Configuration
                      </button>
                  </div>

              </form>
          </div>
      )}

      {/* --- MODAL 1: CREATE TENANT --- */}
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

      {/* --- MODAL 2: INSPECTION MODAL --- */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-slate-900 p-12 rounded-[50px] w-full max-w-xl border border-slate-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Globe size={250}/></div>

                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">{selectedTenant.hotel_settings?.hotel_name || selectedTenant.username}</h3>
                        <p className="text-purple-400 font-mono text-sm mt-1 uppercase tracking-widest">Instance Node: {selectedTenant.username}.atithi.live</p>
                    </div>
                    <button onClick={() => setSelectedTenant(null)} className="p-3 bg-slate-800 rounded-full hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
                    <DetailBox label="Onboarded On" val={new Date(selectedTenant.date_joined).toLocaleDateString('en-GB')} />
                    <DetailBox label="Service Level" val={selectedTenant.plan || 'PRO'} />
                    <DetailBox label="Deployment Status" val={selectedTenant.is_active ? 'ACTIVE' : 'SUSPENDED'} highlight={!selectedTenant.is_active ? 'text-red-500' : 'text-emerald-500'} />
                    <DetailBox label="Last Login" val={selectedTenant.last_login ? new Date(selectedTenant.last_login).toLocaleDateString() : 'NEVER'} />
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

      {/* --- MODAL 3: EDIT TENANT (Name & License) --- */}
      {editingHotel && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
              <div className="bg-slate-900 p-8 rounded-[40px] w-full max-w-md border border-slate-700 shadow-2xl relative">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">Modify Tenant</h3>
                      <button onClick={() => setEditingHotel(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveTenantEdit} className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hotel Name</label>
                          <input className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-white focus:border-blue-500 outline-none" 
                              value={editForm.hotel_name} onChange={e => setEditForm({...editForm, hotel_name: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">License Expiry (YYYY-MM-DD)</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-slate-500" size={18}/>
                            <input type="date" className="w-full pl-10 p-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-white focus:border-blue-500 outline-none" 
                                value={editForm.license_expiry} onChange={e => setEditForm({...editForm, license_expiry: e.target.value})} />
                          </div>
                          <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-widest">Leave empty for Lifetime Access</p>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors uppercase tracking-widest text-xs">
                          {isSubmitting ? <Loader2 className="animate-spin inline mr-2"/> : null} Save Changes
                      </button>
                  </form>
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

export default GlobalSettings;