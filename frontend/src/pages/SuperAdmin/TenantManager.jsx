import { useEffect, useState } from 'react';
import { Search, Plus, Settings2, Power, Loader2, X, AlertTriangle, LogIn } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 

const TenantManager = () => {
    const { token, login } = useAuth(); // Get 'login' to switch sessions
    const navigate = useNavigate();

    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    
    // Form States
    const [formData, setFormData] = useState({ name: '', domain: '', admin_email: '', plan: 'Standard' });
    const [tenantForm, setTenantForm] = useState({ hotel_name: '', license_expiry: '', plan: 'Standard', max_rooms: 100, reset_password: '' });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const [statsRes, plansRes] = await Promise.all([
                fetch(`${API_URL}/api/super-admin/stats/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/plans/`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            if (statsRes.ok) {
                const data = await statsRes.json();
                setTenants(data.hotels || []);
            }
            if (plansRes.ok) setPlans(await plansRes.json());
        } catch (e) {
            console.error("Fetch Error:", e);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    // --- ACTION: CREATE TENANT ---
    const handleCreate = async () => {
        setErrorMsg('');
        setIsSubmitting(true);
        
        const selectedPlan = plans.find(p => p.name === formData.plan);
        
        if(!formData.name || !formData.domain || !formData.admin_email) {
            setErrorMsg("All fields are required.");
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    username: formData.domain.toLowerCase(),
                    email: formData.admin_email,
                    password: 'DefaultPassword123!', 
                    first_name: formData.name,
                    last_name: 'Admin',
                    role: 'OWNER',
                    plan: formData.plan,
                    max_rooms: selectedPlan?.max_rooms || 20
                })
            });

            const data = await res.json();

            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ name: '', domain: '', admin_email: '', plan: 'Standard' });
                fetchData();
                alert("🚀 Tenant Deployed Successfully!");
            } else {
                const backendError = data.detail || JSON.stringify(data);
                setErrorMsg(`Deployment Failed: ${backendError}`);
            }
        } catch (e) {
            setErrorMsg("Network Error: Unable to reach server.");
        }
        setIsSubmitting(false);
    };

    // --- ACTION: UPDATE TENANT ---
    const handleUpdate = async () => {
        if(!editingTenant) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/super-admin/stats/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    action: 'edit_tenant', 
                    hotel_id: editingTenant.id, 
                    ...tenantForm 
                })
            });
            if(res.ok) { 
                setEditingTenant(null); 
                fetchData(); 
                alert("Tenant Updated Successfully!"); 
            } else {
                alert("Update failed.");
            }
        } catch(e) {
            alert("Network Error");
        }
        setIsSubmitting(false);
    };

    // --- 🟢 ACTION: IMPERSONATE (LOGIN AS OWNER) ---
    const handleImpersonate = async (userId) => {
        if(!confirm("⚠️ You are about to log in as this Hotel Owner. You will be logged out of Super Admin. Continue?")) return;
        
        try {
            const res = await fetch(`${API_URL}/api/super-admin/impersonate/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: userId })
            });

            if (res.ok) {
                const data = await res.json();
                // Switch session to the target user and redirect to dashboard
                login(data, () => navigate('/dashboard')); 
            } else {
                const err = await res.json();
                alert("Impersonation Failed: " + (err.error || "Unknown Error"));
            }
        } catch (e) {
            alert("Network Error connecting to Impersonation API");
        }
    };

    const safeTenants = Array.isArray(tenants) ? tenants : [];
    const filteredTenants = safeTenants.filter(t => 
        (t.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden mb-8">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 py-3 text-xs font-bold text-white outline-none focus:border-purple-500" placeholder="Search Node ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 shadow-lg transition-all">
                        <Plus size={16}/> Deploy Tenant
                    </button>
                </div>

                {/* Table */}
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
                            <tr key={t.id} className="hover:bg-slate-800/50 group transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                            {t.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{t.hotel_name || t.username}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{t.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        {t.plan || 'PRO'}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex w-fit items-center gap-2 ${t.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                                        {t.is_active ? 'Online' : 'Suspended'}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {/* 🟢 NEW: Login As Owner Button */}
                                        <button 
                                            onClick={() => handleImpersonate(t.id)} 
                                            className="p-2 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg text-slate-400 transition-all" 
                                            title="Login as Owner"
                                        >
                                            <LogIn size={16}/>
                                        </button>

                                        <button onClick={() => { setEditingTenant(t); setTenantForm({ ...tenantForm, hotel_name: t.hotel_name || '' }); }} className="p-2 bg-slate-800 hover:bg-purple-600 hover:text-white rounded-lg text-slate-400 transition-all" title="Settings">
                                            <Settings2 size={16}/>
                                        </button>
                                        <button className="p-2 bg-slate-800 hover:bg-red-600 hover:text-white rounded-lg text-slate-400 transition-all" title="Toggle Status">
                                            <Power size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTenants.length === 0 && (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No Active Nodes Found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 w-full max-w-lg p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
                         <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20}/></button>
                        <h3 className="text-2xl font-black text-white mb-2">Deploy Node</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Create new SaaS Tenant</p>
                        
                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                                <AlertTriangle size={16}/> {errorMsg}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Hotel Name</label>
                                <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500" placeholder="e.g. Grand Hotel" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Cluster ID (Username)</label>
                                <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500" placeholder="e.g. grand_01" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Admin Email</label>
                                <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500" placeholder="e.g. admin@grand.com" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Subscription Plan</label>
                                <select className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                                    {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    {plans.length === 0 && <option value="Standard">Standard</option>}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={handleCreate} disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-black uppercase text-xs tracking-widest text-white transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin"/> : 'Initialize Deployment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editingTenant && (
                <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 w-full max-w-lg p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
                        <button onClick={() => setEditingTenant(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={20}/></button>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">Modify Tenant</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Node: {editingTenant.username}</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Legal Entity Name</label>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500" 
                                    value={tenantForm.hotel_name} onChange={e => setTenantForm({...tenantForm, hotel_name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Service Plan</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500"
                                        value={tenantForm.plan} onChange={e => setTenantForm({...tenantForm, plan: e.target.value})}>
                                        {plans.map(p => (
                                            <option key={p.id} value={p.name}>{p.name} • ₹{p.price}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Max Rooms</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500"
                                        value={tenantForm.max_rooms} onChange={e => setTenantForm({...tenantForm, max_rooms: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">License Expiry</label>
                                <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500" 
                                    value={tenantForm.license_expiry} onChange={e => setTenantForm({...tenantForm, license_expiry: e.target.value})} />
                            </div>
                            
                            <div className="pt-4 border-t border-slate-800 mt-4">
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Danger Zone</p>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-red-500 placeholder:text-red-900/50" 
                                    placeholder="Reset Admin Password..." value={tenantForm.reset_password} onChange={e => setTenantForm({...tenantForm, reset_password: e.target.value})} />
                            </div>
                        </div>

                        <button onClick={handleUpdate} disabled={isSubmitting} className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all">
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : 'Save Modifications'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantManager;