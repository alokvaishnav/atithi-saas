import { useEffect, useState, useCallback } from 'react';
import { 
  Server, Shield, Building, Activity, 
  Search, Power, Trash2, Plus, Loader2, 
  Database, Cpu, CheckCircle, Edit3,
  TrendingUp, RefreshCw, X, Key, Calendar,
  ShieldCheck, History, Globe, Settings2,
  Zap, AlertTriangle, Copy, Mail, MessageCircle, Save, Megaphone,
  BarChart3, Lock, Users, HardDrive, CreditCard, Tag, Check, DollarSign
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext'; 

const GlobalSettings = () => {
  const { token, user, logout } = useAuth();
  
  // --- CORE DATA ---
  // 🟢 SAFETY: Initialize with empty array
  const [tenants, setTenants] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ 
    total_hotels: 0, active_licenses: 0, platform_revenue: 0, total_rooms: 0 
  });
  const [logs, setLogs] = useState([]);
  
  // 🟢 DYNAMIC PLANS STATE (Default Plans)
  const [plans, setPlans] = useState([
      { id: 1, name: 'Standard', price: 1999, currency: 'INR', interval: 'month', max_rooms: 20, features: ['Dashboard', 'Front Desk', 'Housekeeping'], color: 'blue' },
      { id: 2, name: 'Business', price: 4999, currency: 'INR', interval: 'month', max_rooms: 50, features: ['All Standard', 'Inventory', 'POS', 'Reports'], color: 'purple' },
      { id: 3, name: 'Enterprise', price: 9999, currency: 'INR', interval: 'month', max_rooms: 9999, features: ['All Business', 'Multi-User', 'Audit Logs', 'API Access'], color: 'orange' }
  ]);

  const [systemHealth, setSystemHealth] = useState({ status: 'ONLINE', latency: 0, db: 'CONNECTED' });
  
  // --- CONFIG STATE ---
  const [activeTab, setActiveTab] = useState('COMMAND'); // COMMAND, TENANTS, PLANS, INFRA, CONFIG
  const [platformConfig, setPlatformConfig] = useState({
    app_name: '', company_name: '', support_email: '', support_phone: '',
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '',
    maintenance_mode: false
  });

  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // --- MODALS ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false); 
  const [editingTenant, setEditingTenant] = useState(null); 
  const [editingPlan, setEditingPlan] = useState(null); 
  
  // --- FORMS ---
  // Default plan is now the first plan in the list
  const [formData, setFormData] = useState({ name: '', domain: '', admin_email: '', plan: 'Standard' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });
  const [tenantForm, setTenantForm] = useState({ 
      hotel_name: '', license_expiry: '', plan: 'Standard', max_rooms: 100, 
      reset_password: '' 
  });
  const [planForm, setPlanForm] = useState({
      name: '', price: '', max_rooms: '', features: '', color: 'blue'
  });

  // 🛡️ SECURITY CHECK
  const isAuthorized = user?.is_superuser || user?.role === 'SUPERADMIN' || user?.role === 'OWNER';

  if (!isAuthorized && !loading) return <AccessDenied user={user} logout={logout} />;

  // ==================================================================================
  // 1. DATA ENGINE (Optimized & Safe)
  // ==================================================================================
  const fetchAllData = useCallback(async (isInitial = false) => {
    if (!token) return;

    // Helper for headers to avoid repetition
    const getHeaders = () => ({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    });

    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const start = Date.now();

      // 1. Fetch all core data in parallel
      const [statsRes, logsRes, configRes, plansRes] = await Promise.all([
        fetch(`${API_URL}/api/super-admin/stats/`, { headers: getHeaders() }).catch(e => null),
        fetch(`${API_URL}/api/logs/`, { headers: getHeaders() }).catch(e => null),
        fetch(`${API_URL}/api/super-admin/platform-settings/`, { headers: getHeaders() }).catch(e => null),
        fetch(`${API_URL}/api/plans/`, { headers: getHeaders() }).catch(e => null)
      ]);

      // 2. Calculate Latency & Health
      const latency = Date.now() - start;
      setSystemHealth(prev => ({ 
        ...prev, 
        latency, 
        status: statsRes?.ok ? 'ONLINE' : 'DEGRADED' 
      }));

      // 3. Process Stats & Tenants
      if (statsRes && statsRes.ok) {
        const data = await statsRes.json();
        
        // 🟢 CRITICAL SAFETY: Ensure arrays are actually arrays to prevent .map() crashes
        setTenants(Array.isArray(data.hotels) ? data.hotels : []);
        setStats(data.stats || { 
          total_hotels: 0, 
          active_licenses: 0, 
          platform_revenue: 0, 
          total_rooms: 0 
        });
        setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
      } else {
        setTenants([]); // Fallback
      }

      // 4. Process Plans (New)
      if (plansRes && plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(Array.isArray(plansData) ? plansData : []);
      }

      // 5. Process Logs
      if (logsRes && logsRes.ok) {
        const logData = await logsRes.json();
        setLogs(Array.isArray(logData) ? logData : []);
      }

      // 6. Process Config
      if (configRes && configRes.ok) {
        setPlatformConfig(await configRes.json());
      }

    } catch (err) {
      console.error("SuperAdmin Engine Error:", err);
      setSystemHealth({ status: 'OFFLINE', latency: 0, db: 'DISCONNECTED' });
      setMsg({ type: 'error', text: 'Failed to sync with server' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, API_URL]);

  // Initial Load
  useEffect(() => { 
    fetchAllData(true); 
  }, [fetchAllData]);

  // ==================================================================================
  // 2. TENANT ACTIONS (Create, Update, Toggle)
  // ==================================================================================

  // 🟢 CREATE NEW TENANT
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Determine Limits based on Plan
    const selectedPlanObj = plans.find(p => p.name === formData.plan);
    const maxRoomsLimit = selectedPlanObj ? selectedPlanObj.max_rooms : 20;

    try {
      const res = await fetch(`${API_URL}/api/register/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          username: formData.domain,
          email: formData.admin_email,
          password: 'DefaultPassword123!', // ⚠️ Security Note: Consider generating random passwords
          first_name: formData.name,
          last_name: 'Admin',
          role: 'OWNER',
          plan: formData.plan,
          max_rooms: maxRoomsLimit
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        // Reset Form
        setFormData({ name: '', domain: '', admin_email: '', plan: plans[0]?.name || 'Standard' });
        
        // Refresh Data
        await fetchAllData(false);
        
        // Success Message
        setMsg({ type: 'success', text: '🚀 Tenant Deployed Successfully' });
        setTimeout(() => setMsg({ type: '', text: '' }), 3000);
      } else {
        const errData = await res.json();
        setMsg({ type: 'error', text: errData.detail || "Deployment Failed" });
      }
    } catch (err) {
      setMsg({ type: 'error', text: "Network Connection Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 UPDATE EXISTING TENANT
  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    
    setIsSubmitting(true);
    try {
      // Note: Using the stats endpoint for updates based on existing backend logic
      const res = await fetch(`${API_URL}/api/super-admin/stats/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          action: 'edit_tenant',
          hotel_id: editingTenant.id,
          ...tenantForm
        })
      });

      if (res.ok) {
        setEditingTenant(null);
        await fetchAllData(false); // Refresh list
        setMsg({ type: 'success', text: 'Tenant Configuration Updated' });
      } else {
        setMsg({ type: 'error', text: 'Failed to update tenant details' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: "Network Error during update" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  // 🟢 TOGGLE STATUS (Active/Inactive)
  const handleToggleStatus = async (id, currentStatus) => {
    // Optional: Add a custom UI confirmation instead of browser confirm
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this tenant?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/super-admin/stats/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          action: 'toggle_status', 
          hotel_id: id 
        })
      });

      if (res.ok) {
        await fetchAllData(false);
        setMsg({ type: 'success', text: 'Status updated successfully' });
      } else {
        setMsg({ type: 'error', text: 'Failed to change status' });
      }
    } catch (e) {
      console.error(e);
      setMsg({ type: 'error', text: 'Network Error' });
    } finally {
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    }
  };

  // ==================================================================================
  // 3. PLAN MANAGEMENT ACTIONS
  // ==================================================================================

  const handleSavePlan = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      // NOTE: In a real app, send this to backend (POST /api/plans/). 
      // For now, we simulate strictly in UI state.
      const featuresArray = typeof planForm.features === 'string'
      ? planForm.features.split(',').map(f => f.trim()).filter(f => f !== '')
      : planForm.features;

      const payload = {
          name: planForm.name,
          price: planForm.price,
          currency: 'INR',
          interval: 'month',
          max_rooms: planForm.max_rooms,
          features: featuresArray,
          color: planForm.color
      };

      try {
          const url = editingPlan 
            ? `${API_URL}/api/plans/${editingPlan.id}/` 
            : `${API_URL}/api/plans/`;

          const method = editingPlan ? 'PATCH' : 'POST';

          const res = await fetch(url, {
              method: method,
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              setMsg({ type: 'success', text: 'Subscription Plan Saved Successfully' });
              setShowPlanModal(false);
              setEditingPlan(null);
              fetchAllData(false); // Refresh list
          } else {
              alert("Failed to save plan. Check console.");
          }
      } catch (err) {
          console.error(err);
          alert("Network Error");
      } finally {
          setIsSubmitting(false);
      }
  

      if (editingPlan) {
          setPlans(plans.map(p => p.id === editingPlan.id ? newPlanObj : p));
      } else {
          setPlans([...plans, newPlanObj]);
      }
      
      setShowPlanModal(false);
      setEditingPlan(null);
      setMsg({ type: 'success', text: 'Subscription Plan Updated' });
      setTimeout(() => setMsg({type:'', text:''}), 3000);
  };

  const handleDeletePlan = async (id) => {
      if(!confirm("Delete this plan from database?")) return;
      try {
          await fetch(`${API_URL}/api/plans/${id}/`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchAllData(false);
      } catch (err) {
          alert("Delete failed");
      }
  };

  const openPlanModal = (plan = null) => {
      if (plan) {
          setEditingPlan(plan);
          setPlanForm({
              name: plan.name,
              price: plan.price,
              max_rooms: plan.max_rooms,
              features: plan.features.join(', '),
              color: plan.color || 'blue'
          });
      } else {
          setEditingPlan(null);
          setPlanForm({ name: '', price: '', max_rooms: '', features: '', color: 'blue' });
      }
      setShowPlanModal(true);
  };

  // ==================================================================================
  // 4. CONFIG & BROADCAST ACTIONS
  // ==================================================================================

  const handleSaveConfig = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const res = await fetch(`${API_URL}/api/super-admin/platform-settings/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(platformConfig)
          });
          if(res.ok) alert("System Configuration Saved");
      } catch(err) {}
      finally { setIsSubmitting(false); }
  };

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
        alert("Broadcast Sent!");
    } catch (err) {}
    finally { setIsSubmitting(false); }
  };

  // --- UI HELPERS ---
  const openEditModal = (t) => {
      setEditingTenant(t);
      setTenantForm({
          hotel_name: t.hotel_settings?.hotel_name || t.hotel_name || '',
          license_expiry: t.hotel_settings?.license_expiry || '',
          plan: t.plan || plans[0]?.name || 'Standard',
          max_rooms: t.hotel_settings?.max_rooms || 100,
          reset_password: ''
      });
  };

  // 🟢 CRITICAL SAFETY: FILTER LOGIC
  // We double check tenants is an array before filtering
  const safeTenantsList = Array.isArray(tenants) ? tenants : [];
  
  const filteredTenants = safeTenantsList.filter(t => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (t.hotel_settings?.hotel_name || t.username || '').toLowerCase().includes(term);
    const emailMatch = (t.email || '').toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  if (loading) return <LoadingScreen />;

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
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">System Latency</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${systemHealth.latency < 200 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                        <span className="text-sm font-mono text-white">{systemHealth.latency}ms</span>
                    </div>
                </div>
                <button onClick={logout} className="w-full py-3 text-red-400 hover:bg-slate-800 rounded-xl font-bold uppercase text-xs transition-colors">Log Out</button>
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-8 relative">
            
            {/* Header Actions */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{activeTab.replace('_', ' ')}</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        {platformConfig.app_name || 'Atithi SaaS'} • {user?.username}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => fetchAllData(false)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:text-white text-slate-400 transition-all">
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''}/>
                    </button>
                    {activeTab === 'TENANTS' && (
                        <button onClick={() => setShowCreateModal(true)} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 shadow-lg transition-all">
                            <Plus size={16}/> Deploy Tenant
                        </button>
                    )}
                    {activeTab === 'PLANS' && (
                        <button onClick={() => openPlanModal()} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 shadow-lg transition-all">
                            <Plus size={16}/> Create Plan
                        </button>
                    )}
                </div>
            </div>

            {/* ERROR/SUCCESS MSG */}
            {msg.text && (
                <div className={`p-4 mb-6 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="font-bold text-xs uppercase tracking-wider">{msg.text}</span>
                </div>
            )}

            {/* --- TAB: COMMAND CENTER --- */}
            {activeTab === 'COMMAND' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <MetricCard title="Total ARR" val={`₹${((stats.platform_revenue || 0)/100000).toFixed(2)}L`} icon={TrendingUp} color="text-emerald-400" />
                        <MetricCard title="Active Nodes" val={stats.total_hotels} icon={Building} color="text-blue-400" />
                        <MetricCard title="Total Licenses" val={stats.active_licenses} icon={ShieldCheck} color="text-purple-400" />
                        <MetricCard title="Global Inventory" val={stats.total_rooms} icon={Database} color="text-orange-400" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2"><BarChart3 size={18} className="text-purple-500"/> Revenue Intelligence</h3>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400">Monthly</span>
                                    <span className="px-3 py-1 bg-purple-600 rounded-lg text-[10px] font-bold text-white shadow-lg">Annual</span>
                                </div>
                            </div>
                            <div className="flex items-end justify-between h-48 gap-4">
                                {[35, 42, 28, 55, 60, 48, 72, 65, 85, 90, 78, 95].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div style={{height: `${h}%`}} className="w-full bg-slate-800 rounded-t-lg group-hover:bg-purple-500 transition-all duration-500 relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {h}%
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">M{i+1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                            <h3 className="font-black text-white uppercase text-sm tracking-widest mb-6 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-500"/> Critical Alerts</h3>
                            <div className="space-y-4">
                                {logs.filter(l => l.action === 'ERROR' || l.details.includes('Failed')).slice(0,5).map((l, i) => (
                                    <div key={i} className="flex gap-3 items-start p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <X size={14} className="text-red-500 mt-1 shrink-0"/>
                                        <div>
                                            <p className="text-xs font-bold text-red-200">{l.details}</p>
                                            <p className="text-[10px] text-red-400 mt-1">{new Date(l.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && <p className="text-slate-500 text-xs italic">System nominal. No critical alerts.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: TENANT MANAGER --- */}
            {activeTab === 'TENANTS' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div className="relative w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 py-3 text-xs font-bold text-white outline-none focus:border-purple-500" placeholder="Search Node ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Total: {safeTenantsList.length} Nodes
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6">Node Identity</th>
                                    <th className="p-6">Plan</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredTenants.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400">{t.username[0].toUpperCase()}</div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{t.hotel_settings?.hotel_name || t.username}</p>
                                                    <p className="text-[10px] text-slate-500">{t.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6"><span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-black">{t.plan || 'PRO'}</span></td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black ${t.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {t.is_active ? 'ONLINE' : 'SUSPENDED'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right flex justify-end gap-2">
                                            <button onClick={() => openEditModal(t)} className="p-2 bg-slate-800 hover:bg-purple-600 hover:text-white rounded-lg text-slate-400 transition-all"><Settings2 size={16}/></button>
                                            <button onClick={() => handleToggleStatus(t.id)} className="p-2 bg-slate-800 hover:bg-red-600 hover:text-white rounded-lg text-slate-400 transition-all"><Power size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TAB: SUBSCRIPTION PLANS (NEW) --- */}
            {activeTab === 'PLANS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {plans.map(plan => (
                        <div key={plan.id} className="bg-slate-900 rounded-[35px] border border-slate-800 p-8 relative overflow-hidden group hover:border-purple-500 transition-all duration-300">
                            <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity bg-${plan.color}-500/20 rounded-bl-[40px]`}>
                                <Tag size={80} className={`text-${plan.color}-500`}/>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className={`text-sm font-black uppercase tracking-widest text-${plan.color}-400 mb-2`}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-3xl font-black text-white">₹{plan.price}</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase">/{plan.interval}</span>
                                </div>
                                
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-800 p-1.5 rounded-lg text-slate-400"><Database size={12}/></div>
                                        <p className="text-xs font-bold text-slate-300">{plan.max_rooms} Max Rooms</p>
                                    </div>
                                    {plan.features.map((feat, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="bg-green-500/10 p-1.5 rounded-lg text-green-500"><Check size={12}/></div>
                                            <p className="text-xs font-bold text-slate-400">{feat}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => openPlanModal(plan)} className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">
                                        Edit Plan
                                    </button>
                                    <button onClick={() => handleDeletePlan(plan.id)} className="p-3 bg-slate-800 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={() => openPlanModal()} className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[35px] flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-white hover:border-purple-500 hover:bg-slate-900 transition-all min-h-[400px]">
                        <div className="bg-slate-800 p-4 rounded-full"><Plus size={32}/></div>
                        <span className="font-bold text-xs uppercase tracking-widest">Create New Tier</span>
                    </button>
                </div>
            )}

            {/* --- TAB: INFRASTRUCTURE --- */}
            {activeTab === 'INFRA' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* System Announcements */}
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                        <h3 className="font-black text-white uppercase text-sm tracking-widest mb-6 flex items-center gap-2"><Megaphone size={18} className="text-orange-400"/> Global Broadcast</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Title</label>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-orange-500" 
                                    value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Message</label>
                                <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-orange-500 min-h-[100px]"
                                    value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}/>
                            </div>
                            <button onClick={handlePostAnnouncement} className="w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-black uppercase text-xs tracking-widest text-white transition-all shadow-lg shadow-orange-900/20">
                                Send Broadcast to All Tenants
                            </button>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-slate-800 space-y-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Active Broadcasts</p>
                            {announcements.map(a => (
                                <div key={a.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-white">{a.title}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <button className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Infrastructure Logs */}
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col h-[600px]">
                        <h3 className="font-black text-white uppercase text-sm tracking-widest mb-6 flex items-center gap-2"><HardDrive size={18} className="text-blue-400"/> System Logs</h3>
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                            {logs.map((l, i) => (
                                <div key={i} className="flex gap-3 items-start border-l-2 border-slate-800 pl-4 py-1">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${l.action === 'ERROR' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-300">{l.details}</p>
                                        <p className="text-[10px] text-slate-600 font-mono mt-1">{new Date(l.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: GLOBAL CONFIG --- */}
            {activeTab === 'CONFIG' && (
                <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800">
                        <h3 className="font-black text-white uppercase text-xl tracking-tighter mb-8 flex items-center gap-3"><Settings2 size={24} className="text-purple-500"/> Platform Configuration</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Branding</h4>
                                <Input label="App Name" val={platformConfig.app_name} set={v => setPlatformConfig({...platformConfig, app_name: v})} />
                                <Input label="Company Name" val={platformConfig.company_name} set={v => setPlatformConfig({...platformConfig, company_name: v})} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Support</h4>
                                <Input label="Support Email" val={platformConfig.support_email} set={v => setPlatformConfig({...platformConfig, support_email: v})} />
                                <Input label="Support Phone" val={platformConfig.support_phone} set={v => setPlatformConfig({...platformConfig, support_phone: v})} />
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Mail size={14}/> SMTP Gateway</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Host" val={platformConfig.smtp_host} set={v => setPlatformConfig({...platformConfig, smtp_host: v})} />
                                <Input label="User" val={platformConfig.smtp_user} set={v => setPlatformConfig({...platformConfig, smtp_user: v})} />
                                <div className="col-span-2">
                                    <Input label="Password" type="password" val={platformConfig.smtp_password} set={v => setPlatformConfig({...platformConfig, smtp_password: v})} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
                            <div className="flex items-center gap-3 mr-auto">
                                <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${platformConfig.maintenance_mode ? 'bg-red-500' : 'bg-slate-700'}`} onClick={() => setPlatformConfig({...platformConfig, maintenance_mode: !platformConfig.maintenance_mode})}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${platformConfig.maintenance_mode ? 'translate-x-6' : ''}`}></div>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maintenance Mode</span>
                            </div>
                            <button onClick={handleSaveConfig} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* --- MODAL: EDIT TENANT --- */}
        {editingTenant && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                    <button onClick={() => setEditingTenant(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X/></button>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">Modify Tenant</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Node: {editingTenant.username}</p>
                    
                    <div className="space-y-4">
                        <Input label="Legal Entity Name" val={tenantForm.hotel_name} set={v => setTenantForm({...tenantForm, hotel_name: v})} />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Service Plan</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500"
                                    value={tenantForm.plan} onChange={e => setTenantForm({...tenantForm, plan: e.target.value})}>
                                    {/* 🟢 DYNAMIC PLANS DROPDOWN */}
                                    {plans.map(p => (
                                        <option key={p.id} value={p.name}>{p.name} • ₹{p.price}</option>
                                    ))}
                                </select>
                            </div>
                            <Input label="Max Rooms" type="number" val={tenantForm.max_rooms} set={v => setTenantForm({...tenantForm, max_rooms: v})} />
                        </div>
                        <Input label="License Expiry (YYYY-MM-DD)" type="date" val={tenantForm.license_expiry} set={v => setTenantForm({...tenantForm, license_expiry: v})} />
                        
                        <div className="pt-4 border-t border-slate-800 mt-4">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Danger Zone</p>
                            <Input label="Reset Admin Password" placeholder="Enter new password to reset..." val={tenantForm.reset_password} set={v => setTenantForm({...tenantForm, reset_password: v})} />
                        </div>
                    </div>

                    <button onClick={handleUpdateTenant} disabled={isSubmitting} className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : 'Save Modifications'}
                    </button>
                </div>
            </div>
        )}

        {/* --- MODAL: EDIT/CREATE PLAN --- */}
        {showPlanModal && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                    <button onClick={() => setShowPlanModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X/></button>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                    
                    <form onSubmit={handleSavePlan} className="space-y-4">
                        <Input label="Plan Name (e.g. Gold Tier)" val={planForm.name} set={v => setPlanForm({...planForm, name: v})} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Monthly Price (INR)" type="number" val={planForm.price} set={v => setPlanForm({...planForm, price: v})} />
                            <Input label="Max Room Limit" type="number" val={planForm.max_rooms} set={v => setPlanForm({...planForm, max_rooms: v})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Features (Comma Separated)</label>
                            <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500 h-24"
                                value={planForm.features} onChange={e => setPlanForm({...planForm, features: e.target.value})} placeholder="Dashboard, Inventory, POS..."/>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Theme Color</label>
                            <div className="flex gap-3">
                                {['blue', 'purple', 'orange', 'emerald', 'red'].map(c => (
                                    <div key={c} onClick={() => setPlanForm({...planForm, color: c})} 
                                        className={`w-8 h-8 rounded-full bg-${c}-500 cursor-pointer border-2 ${planForm.color === c ? 'border-white' : 'border-transparent'}`}></div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full mt-6 bg-white text-slate-900 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">
                            Save Plan Configuration
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL: CREATE TENANT --- */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                    <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X/></button>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">Deploy New Node</h3>
                    <div className="space-y-4">
                        <Input label="Hotel Name" val={formData.name} set={v => setFormData({...formData, name: v})} placeholder="Grand Hotel"/>
                        <Input label="Cluster ID (Username)" val={formData.domain} set={v => setFormData({...formData, domain: v})} placeholder="grand_01"/>
                        <Input label="Admin Email" type="email" val={formData.admin_email} set={v => setFormData({...formData, admin_email: v})} placeholder="admin@hotel.com"/>
                        
                        {/* 🟢 DYNAMIC PLANS SELECTOR */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Subscription Tier</label>
                            <select 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500"
                                value={formData.plan} 
                                onChange={e => setFormData({...formData, plan: e.target.value})}
                            >
                                {plans.map(p => (
                                    <option key={p.id} value={p.name}>{p.name} ({p.currency} {p.price})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleCreateTenant} disabled={isSubmitting} className="w-full mt-8 bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : 'Initialize Deployment'}
                    </button>
                </div>
            </div>
        )}

    </div>
  );
};

// --- SUB COMPONENTS ---
const MetricCard = ({ title, val, icon: Icon, color, bg, border }) => (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
        <div className={`absolute top-4 right-4 p-3 bg-slate-950 rounded-xl ${color}`}><Icon size={20}/></div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-3xl font-black text-white italic tracking-tighter">{val}</h3>
    </div>
);

const Input = ({ label, val, set, type="text", placeholder="" }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{label}</label>
        <input type={type} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500 transition-colors placeholder:text-slate-700" 
            value={val} onChange={e => set(e.target.value)} placeholder={placeholder}/>
    </div>
);

const AccessDenied = ({ user, logout }) => (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 gap-6">
        <ShieldCheck size={80} className="text-red-600"/>
        <div className="text-center">
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">Access Denied</h1>
            <p className="text-red-500 font-mono mt-2">ERR_PERMISSIONS_INSUFFICIENT</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-left min-w-[300px]">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Session Data</p>
            <div className="space-y-2 font-mono text-sm text-slate-300">
                <p>User: <span className="text-white">{user?.username}</span></p>
                <p>Role: <span className="text-yellow-400">{user?.role}</span></p>
            </div>
        </div>
        <button onClick={logout} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 font-bold text-xs uppercase tracking-widest">Log Out</button>
    </div>
);

const LoadingScreen = () => (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-purple-500" size={60}/>
        <p className="text-purple-400 font-black uppercase tracking-[0.4em] text-xs">Initializing Core...</p>
    </div>
);

export default GlobalSettings;
