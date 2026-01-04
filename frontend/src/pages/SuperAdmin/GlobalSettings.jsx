import React, { useState, useEffect } from 'react';
import { 
  Save, Server, Mail, MessageSquare, Shield, 
  LayoutGrid, Settings, Users, DollarSign, 
  Search, Power, RefreshCw, Hotel
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const GlobalHQ = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'settings'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // --- DATA STATES ---
  const [stats, setStats] = useState({
    total_hotels: 0,
    active_licenses: 0,
    platform_revenue: 0,
    total_rooms: 0
  });
  const [hotels, setHotels] = useState([]);
  
  // --- FORM STATE (Settings) ---
  const [formData, setFormData] = useState({
    app_name: '', company_name: '', support_email: '', support_phone: '',
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '',
    welcome_email_subject: '', welcome_email_body: ''
  });

  // INITIAL FETCH
  useEffect(() => {
    fetchDashboardData();
    fetchSettings();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/super-admin/stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats);
      setHotels(res.data.hotels);
    } catch (err) {
      console.error("Failed to load dashboard stats");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/super-admin/platform-settings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setFormData(res.data);
    } catch (err) {
      console.error("Failed to load settings");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- ACTIONS ---

  const handleToggleStatus = async (hotelId) => {
    if(!window.confirm("Are you sure you want to change the access status for this hotel?")) return;
    
    try {
      const res = await axios.post(`${API_URL}/api/super-admin/stats/`, {
        action: 'toggle_status',
        hotel_id: hotelId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately
      setHotels(hotels.map(h => h.id === hotelId ? { ...h, is_active: !h.is_active } : h));
      setMsg({ type: 'success', text: `Hotel access ${res.data.new_status.toLowerCase()}.` });
    } catch (err) {
      setMsg({ type: 'error', text: 'Action Failed.' });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });

      await axios.post(`${API_URL}/api/super-admin/platform-settings/`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      
      setMsg({ type: 'success', text: 'Global Configuration Saved Successfully!' });
      setTimeout(() => window.location.reload(), 1500); // Reload to apply branding
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Command Center</h1>
          <p className="text-slate-500 font-medium">Monitor all tenants and configure platform infrastructure.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            System Settings
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 mb-6 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full ${msg.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}/>
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* --- TAB 1: OVERVIEW (Stats & Hotel List) --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Hotel} label="Total Hotels" value={stats.total_hotels} color="bg-blue-600" />
            <StatCard icon={Users} label="Active Licenses" value={stats.active_licenses} color="bg-emerald-500" />
            <StatCard icon={DollarSign} label="Platform Revenue" value={`₹${stats.platform_revenue.toLocaleString()}`} color="bg-purple-600" />
            <StatCard icon={LayoutGrid} label="Total Rooms Managed" value={stats.total_rooms} color="bg-orange-500" />
          </div>

          {/* HOTEL LIST TABLE */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-lg">Tenant Directory</h3>
              <button onClick={fetchDashboardData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                <RefreshCw size={18}/>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Hotel Name</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
                            {hotel.hotel_settings?.hotel_name?.[0] || 'H'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{hotel.hotel_settings?.hotel_name || "Unconfigured"}</p>
                            <p className="text-xs text-slate-400 font-mono">ID: {hotel.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{hotel.email}</td>
                      <td className="p-4 text-slate-500">{new Date(hotel.date_joined).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${hotel.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {hotel.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button 
                          onClick={() => handleToggleStatus(hotel.id)}
                          className={`p-2 rounded-lg border transition-all ${hotel.is_active ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`}
                          title={hotel.is_active ? "Suspend Access" : "Restore Access"}
                        >
                          <Power size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {hotels.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No hotels registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SETTINGS FORM (Existing Logic) --- */}
      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            
            {/* BRANDING */}
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" /> Platform Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">App Name</label>
                  <input type="text" name="app_name" value={formData.app_name} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-blue-500" placeholder="e.g. Atithi HMS" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company Legal Name</label>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-blue-500" placeholder="e.g. My Tech Pvt Ltd" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Email</label>
                  <input type="email" name="support_email" value={formData.support_email} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Phone</label>
                  <input type="text" name="support_phone" value={formData.support_phone} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <hr className="border-slate-100"/>

            {/* SMTP */}
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <Mail size={20} className="text-orange-500" /> Mail Server (SMTP)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" name="smtp_host" value={formData.smtp_host} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="SMTP Host" />
                <input type="text" name="smtp_port" value={formData.smtp_port} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="Port" />
                <input type="text" name="smtp_user" value={formData.smtp_user} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="Username" />
                <input type="password" name="smtp_password" value={formData.smtp_password} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="Password" />
              </div>
            </div>

            <hr className="border-slate-100"/>

            {/* WELCOME EMAIL */}
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-green-500" /> Onboarding Email Template
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject Line</label>
                  <input type="text" name="welcome_email_subject" value={formData.welcome_email_subject} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Body (Supports {"{name}, {username}, {password}"})</label>
                  <textarea name="welcome_email_body" rows="6" value={formData.welcome_email_body} onChange={handleChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
              {loading ? 'Saving...' : <><Save size={20} /> Save Configuration</>}
            </button>

          </form>
        </div>
      )}
    </div>
  );
};

export default GlobalHQ;