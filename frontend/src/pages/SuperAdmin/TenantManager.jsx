import { useEffect, useState } from 'react';
import { 
    Search, Plus, Settings2, Power, Loader2, X, AlertTriangle, 
    LogIn, Server, Shield, Lock, DollarSign, Calendar, Smartphone 
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 

const TenantManager = () => {
    const { token, login } = useAuth(); 
    const navigate = useNavigate();

    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // --- FORM STATES ---
    const [formData, setFormData] = useState({ 
        name: '', 
        domain: '', // Maps to username/cluster_id
        admin_email: '', 
        phone: '', 
        password: '', 
        plan: 'Standard',
        billing_cycle: 'Monthly'
    });

    const [tenantForm, setTenantForm] = useState({ 
        hotel_name: '', 
        license_expiry: '', 
        plan: 'Standard', 
        max_rooms: 100, 
        reset_password: '' 
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        if (token) fetchData(); 
    }, [token]);

    // --- ACTION: CREATE TENANT ---
    const handleCreate = async () => {
        setErrorMsg('');
        setIsSubmitting(true);
        
        const selectedPlan = plans.find(p => p.name === formData.plan);
        
        if(!formData.name || !formData.domain || !formData.admin_email || !formData.password || !formData.phone) {
            setErrorMsg("All fields (including Phone & Password) are required.");
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
                    password: formData.password, 
                    first_name: formData.name, // Mapping Hotel Name
                    last_name: 'Admin',
                    phone: formData.phone, // 🟢 NEW: WhatsApp Number
                    role: 'OWNER',
                    plan: formData.plan,
                    max_rooms: selectedPlan?.max_rooms || 20
                })
            });

            const data = await res.json();

            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ name: '', domain: '', admin_email: '', phone: '', password: '', plan: 'Standard', billing_cycle: 'Monthly' });
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

    // --- ACTION: IMPERSONATE (LOGIN AS OWNER) ---
    const handleImpersonate = async (userId) => {
        if(!confirm("⚠️ Ghost Login: You are about to access this tenant's environment. Continue?")) return;
        
        try {
            const res = await fetch(`${API_URL}/api/super-admin/impersonate/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_id: userId })
            });

            if (res.ok) {
                const data = await res.json();
                // Switch session to the target user and redirect to dashboard
                // We pass the new user data to the login context function
                login(data.access, data.user); 
                navigate('/dashboard'); 
            } else {
                const err = await res.json();
                alert("Impersonation Failed: " + (err.error || "Unknown Error"));
            }
        } catch (e) {
            alert("Network Error connecting to Impersonation API");
        }
    };

    // --- ACTION: TOGGLE STATUS (BAN/UNBAN) ---
    const toggleStatus = async (userId) => {
        if(!confirm("Are you sure you want to change the status of this tenant?")) return;
        try {
            const res = await fetch(`${API_URL}/api/super-admin/stats/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    action: 'toggle_status',
                    hotel_id: userId
                })
            });
            if(res.ok) {
                fetchData();
            } else {
                alert("Failed to update status");
            }
        } catch (e) {
            alert("Network Error");
        }
    };

    // --- HELPER: GET PRICE ---
    const getPlanPrice = (planName) => {
        const plan = plans.find(p => p.name === planName);
        return plan ? plan.price : '0.00';
    };

    const safeTenants = Array.isArray(tenants) ? tenants : [];
    const filteredTenants = safeTenants.filter(t => 
        (t.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.hotel_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden mb-8">
                
                {/* --- HEADER --- */}
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/50 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Server className="text-purple-500" size={24}/> Tenant Command Center
                        </h2>
                        <p className="text-slate-500 text-xs font-medium mt-1">
                            Total Nodes: <span className="text-white">{filteredTenants.length}</span> • 
                            Active: <span className="text-emerald-400">{filteredTenants.filter(t => t.is_active).length}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                            <input 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 py-3 text-xs font-bold text-white outline-none focus:border-purple-500 transition-colors" 
                                placeholder="Search Cluster ID or Name..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowCreateModal(true)} 
                            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        >
                            <Plus size={16}/> Deploy Node
                        </button>
                    </div>
                </div>

                {/* --- TABLE --- */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                <th className="p-6">Node Identity</th>
                                <th className="p-6">Subscription</th>
                                <th className="p-6">Est. Revenue</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">System Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-purple-500"/></td></tr>
                            ) : filteredTenants.map(t => (
                                <tr key={t.id} className="hover:bg-slate-800/30 group transition-colors">
                                    {/* IDENTITY */}
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
                                                {(t.hotel_name || t.username || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{t.hotel_name || "Unconfigured"}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">@{t.username}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* PLAN */}
                                    <td className="p-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`w-fit px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                                t.plan === 'PRO' || t.plan === 'Premium' 
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {t.plan || 'FREE'}
                                            </span>
                                            {t.license_expiry && (
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Calendar size={10}/> Exp: {t.license_expiry}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* REVENUE */}
                                    <td className="p-6">
                                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                                            <DollarSign size={14}/>
                                            {getPlanPrice(t.plan)}
                                            <span className="text-[10px] text-slate-600 font-normal ml-1">/mo</span>
                                        </div>
                                    </td>

                                    {/* STATUS */}
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex w-fit items-center gap-2 ${
                                            t.is_active 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                                            {t.is_active ? 'Online' : 'Suspended'}
                                        </span>
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {/* Impersonate */}
                                            <button 
                                                onClick={() => handleImpersonate(t.id)} 
                                                className="p-2 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-700 hover:border-emerald-500" 
                                                title="Ghost Login (Impersonate)"
                                            >
                                                <LogIn size={16}/>
                                            </button>

                                            {/* Edit */}
                                            <button 
                                                onClick={() => { setEditingTenant(t); setTenantForm({ ...tenantForm, hotel_name: t.hotel_name || '', plan: t.plan, license_expiry: t.license_expiry }); }} 
                                                className="p-2 bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-700 hover:border-blue-500" 
                                                title="Settings"
                                            >
                                                <Settings2 size={16}/>
                                            </button>

                                            {/* Suspend/Ban */}
                                            <button 
                                                onClick={() => toggleStatus(t.id)}
                                                className={`p-2 rounded-lg transition-all border border-slate-700 ${
                                                    t.is_active 
                                                    ? 'bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-500' 
                                                    : 'bg-red-900/20 text-red-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500'
                                                }`} 
                                                title={t.is_active ? "Suspend Node" : "Activate Node"}
                                            >
                                                {t.is_active ? <Lock size={16}/> : <Shield size={16}/>}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredTenants.length === 0 && (
                                <tr><td colSpan="5" className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No Active Nodes Found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- DEPLOY MODAL (CEO VIEW) --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 w-full max-w-2xl p-8 rounded-3xl border border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                         <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
                        
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-900/20">
                                <Server size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">Deploy Node</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Provision New SaaS Tenant</p>
                            </div>
                        </div>
                        
                        {errorMsg && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in slide-in-from-top-2">
                                <AlertTriangle size={18}/> {errorMsg}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 mt-8">
                            {/* Left Col */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Hotel Name</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="e.g. Grand Plaza" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Cluster ID (Username)</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-sm font-mono outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="grand_plaza" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Subscription Plan</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-sm outline-none focus:border-purple-500 transition-all" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                                        {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        {plans.length === 0 && <option value="Standard">Standard</option>}
                                    </select>
                                </div>
                            </div>

                            {/* Right Col */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Admin Email</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="admin@hotel.com" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Phone (WhatsApp)</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16}/>
                                        <input className="w-full bg-slate-950 border border-slate-800 p-3 pl-10 rounded-xl text-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="+91 9999999999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Initial Password</label>
                                    <input type="password" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800">
                            <button onClick={() => setShowCreateModal(false)} className="px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-500 py-4 rounded-xl font-black uppercase text-xs tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                                {isSubmitting ? <Loader2 className="animate-spin"/> : 'Initialize Deployment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {editingTenant && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 w-full max-w-lg p-8 rounded-3xl border border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
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
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={12}/> Danger Zone</p>
                                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-red-500 placeholder:text-red-900/50 focus:ring-1 focus:ring-red-500 transition-all" 
                                    placeholder="Reset Admin Password..." value={tenantForm.reset_password} onChange={e => setTenantForm({...tenantForm, reset_password: e.target.value})} />
                            </div>
                        </div>

                        <button onClick={handleUpdate} disabled={isSubmitting} className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-900/20">
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : 'Save Modifications'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantManager;