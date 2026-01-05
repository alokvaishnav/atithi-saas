import React, { useState, useEffect } from 'react';
import { 
  Save, Server, Mail, MessageSquare, Shield, 
  LayoutGrid, Settings, Users, DollarSign, 
  Search, Power, RefreshCw, Hotel, Edit3, 
  Calendar, Megaphone, Trash2, X, Plus
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const GlobalHQ = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, settings, announcements
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // --- DATA STATES ---
  const [stats, setStats] = useState({ total_hotels: 0, active_licenses: 0, platform_revenue: 0, total_rooms: 0 });
  const [hotels, setHotels] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // --- MODAL STATES ---
  const [editingHotel, setEditingHotel] = useState(null); // The hotel object being edited
  const [editForm, setEditForm] = useState({ hotel_name: '', license_expiry: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '' });

  // --- SETTINGS FORM STATE ---
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
      setAnnouncements(res.data.announcements || []);
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
    if(!window.confirm("Change access status?")) return;
    try {
      await axios.post(`${API_URL}/api/super-admin/stats/`, { action: 'toggle_status', hotel_id: hotelId }, { headers: { Authorization: `Bearer ${token}` } });
      setHotels(hotels.map(h => h.id === hotelId ? { ...h, is_active: !h.is_active } : h));
    } catch (err) { setMsg({ type: 'error', text: 'Action Failed.' }); }
  };

  const openEditModal = (hotel) => {
    setEditingHotel(hotel);
    setEditForm({ 
        hotel_name: hotel.hotel_name, 
        license_expiry: hotel.license_expiry || '' 
    });
  };

  const handleSaveTenantEdit = async (e) => {
    e.preventDefault();
    try {
        await axios.post(`${API_URL}/api/super-admin/stats/`, {
            action: 'edit_tenant',
            hotel_id: editingHotel.id,
            ...editForm
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setMsg({ type: 'success', text: 'Tenant updated successfully' });
        setEditingHotel(null);
        fetchDashboardData(); // Refresh list
    } catch (err) {
        setMsg({ type: 'error', text: 'Update failed' });
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
        await axios.post(`${API_URL}/api/super-admin/stats/`, {
            action: 'create_announcement',
            ...newAnnouncement
        }, { headers: { Authorization: `Bearer ${token}` } });
        setNewAnnouncement({ title: '', message: '' });
        fetchDashboardData();
    } catch (err) { alert("Failed to post"); }
  };

  const handleDeleteAnnouncement = async (id) => {
      if(!confirm("Delete this announcement?")) return;
      try {
          await axios.post(`${API_URL}/api/super-admin/stats/`, { action: 'delete_announcement', id }, { headers: { Authorization: `Bearer ${token}` } });
          fetchDashboardData();
      } catch (err) {}
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => { if (formData[key]) data.append(key, formData[key]); });
      await axios.post(`${API_URL}/api/super-admin/platform-settings/`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMsg({ type: 'success', text: 'Settings Saved!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) { setMsg({ type: 'error', text: 'Failed to save settings.' }); } 
    finally { setLoading(false); }
  };

  // --- RENDER HELPERS ---
  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}><Icon size={24} className="text-white" /></div>
      <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p><h3 className="text-2xl font-black text-slate-800">{value}</h3></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans min-h-screen relative">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Command Center</h1>
          <p className="text-slate-500 font-medium">Monitor tenants, manage licenses, and configure platform.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['overview', 'announcements', 'settings'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab}
              </button>
          ))}
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 mb-6 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Hotel} label="Total Hotels" value={stats.total_hotels} color="bg-blue-600" />
            <StatCard icon={Users} label="Active Licenses" value={stats.active_licenses} color="bg-emerald-500" />
            <StatCard icon={DollarSign} label="Platform Revenue" value={`₹${stats.platform_revenue}`} color="bg-purple-600" />
            <StatCard icon={LayoutGrid} label="Total Rooms" value={stats.total_rooms} color="bg-orange-500" />
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-lg">Tenant Directory</h3>
              <button onClick={fetchDashboardData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"><RefreshCw size={18}/></button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Hotel Details</th>
                    <th className="p-4">Owner Email</th>
                    <th className="p-4">License Expiry</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">{hotel.hotel_name?.[0] || 'H'}</div>
                          <div>
                            <p className="font-bold text-slate-900">{hotel.hotel_name || "Unconfigured"}</p>
                            <p className="text-xs text-slate-400 font-mono">ID: {hotel.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{hotel.email}</td>
                      <td className="p-4 font-mono text-slate-500">{hotel.license_expiry || "Lifetime"}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${hotel.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {hotel.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6 flex justify-end gap-2">
                        <button onClick={() => openEditModal(hotel)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600" title="Edit Tenant">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleToggleStatus(hotel.id)} className={`p-2 rounded-lg border transition-all ${hotel.is_active ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`} title={hotel.is_active ? "Suspend" : "Activate"}>
                          <Power size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ANNOUNCEMENTS --- */}
      {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4">
              {/* Create Form */}
              <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-slate-100 h-fit">
                  <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Megaphone size={20}/> New Announcement</h3>
                  <form onSubmit={handlePostAnnouncement} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Title</label>
                          <input required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Message</label>
                          <textarea required rows="4" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm" value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})} />
                      </div>
                      <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors flex justify-center items-center gap-2">
                          <Plus size={18}/> Post to All Dashboards
                      </button>
                  </form>
              </div>

              {/* List */}
              <div className="md:col-span-2 space-y-4">
                  {announcements.map(ann => (
                      <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start">
                          <div>
                              <h4 className="font-bold text-slate-800 text-lg">{ann.title}</h4>
                              <p className="text-slate-500 mt-1">{ann.message}</p>
                              <p className="text-xs text-slate-400 mt-4 font-mono">{new Date(ann.created_at).toLocaleString()}</p>
                          </div>
                          <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                      </div>
                  ))}
                  {announcements.length === 0 && <div className="text-center text-slate-400 p-10">No active announcements</div>}
              </div>
          </div>
      )}

      {/* --- TAB 3: SETTINGS FORM (Existing) --- */}
      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Shield size={20} className="text-blue-600" /> Platform Identity</h3>
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

            <div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Mail size={20} className="text-orange-500" /> Mail Server (SMTP)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" name="smtp_host" value={formData.smtp_host} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="SMTP Host" />
                <input type="text" name="smtp_port" value={formData.smtp_port} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="Port" />
                <input type="text" name="smtp_user" value={formData.smtp_user} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="Username" />
                <input type="password" name="smtp_password" value={formData.smtp_password} onChange={handleChange} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-sm" placeholder="Password" />
              </div>
            </div>

            <hr className="border-slate-100"/>

            <div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><MessageSquare size={20} className="text-green-500" /> Onboarding Email Template</h3>
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

      {/* --- MODAL: EDIT TENANT --- */}
      {editingHotel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-slate-800">Edit Tenant</h3>
                      <button onClick={() => setEditingHotel(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveTenantEdit} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Hotel Name</label>
                          <input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold" value={editForm.hotel_name} onChange={e => setEditForm({...editForm, hotel_name: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">License Expiry (YYYY-MM-DD)</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-slate-400" size={18}/>
                            <input type="date" className="w-full pl-10 p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold" value={editForm.license_expiry} onChange={e => setEditForm({...editForm, license_expiry: e.target.value})} />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Leave empty for Lifetime Access</p>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">Save Changes</button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default GlobalHQ;