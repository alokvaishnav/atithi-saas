import { useEffect, useState } from 'react';
import { Search, Plus, Settings2, Power, Loader2, X, AlertTriangle } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const TenantManager = () => {
    const { token } = useAuth();
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

    const handleCreate = async () => {
        setErrorMsg(''); // Clear previous errors
        setIsSubmitting(true);
        
        const selectedPlan = plans.find(p => p.name === formData.plan);
        
        // Basic Frontend Validation
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
                    username: formData.domain.toLowerCase(), // Force lowercase for IDs
                    email: formData.admin_email,
                    password: 'DefaultPassword123!', // You can make this random or an input
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
                // 🟢 DISPLAY THE EXACT BACKEND ERROR
                const backendError = data.detail || JSON.stringify(data);
                setErrorMsg(`Deployment Failed: ${backendError}`);
            }
        } catch (e) {
            setErrorMsg("Network Error: Unable to reach server.");
        }
        setIsSubmitting(false);
    };

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

    const safeTenants = Array.isArray(tenants) ? tenants : [];
    const filteredTenants = safeTenants.filter(t => 
        (t.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 py-3 text-xs font-bold text-white outline-none focus:border-purple-500" placeholder="Search Node ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 shadow-lg transition-all">
                        <Plus size={16}/> Deploy Tenant
                    </button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <tr><th className="p-6">Node</th><th className="p-6">Plan</th><th className="p-6">Status</th><th className="p-6 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredTenants.map(t => (
                            <tr key={t.id} className="hover:bg-slate-800/50">
                                <td className="p-6">
                                    <p className="font-bold text-white">{t.hotel_settings?.hotel_name || t.username}</p>
                                    <p className="text-[10px] text-slate-500">{t.email}</p>
                                </td>
                                <td className="p-6"><span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-black">{t.plan || 'PRO'}</span></td>
                                <td className="p-6"><span className={`px-2 py-1 rounded text-[10px] font-black ${t.is_active ? 'text-emerald-400' : 'text-red-400'}`}>{t.is_active ? 'ONLINE' : 'OFF'}</span></td>
                                <td className="p-6 text-right"><button onClick={() => { setEditingTenant(t); setTenantForm({ ...tenantForm, hotel_name: t.hotel_settings?.hotel_name || '' }); }} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg"><Settings2 size={16}/></button></td>
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
        </div>
    );
};

export default TenantManager;