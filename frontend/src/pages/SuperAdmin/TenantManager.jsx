import { useEffect, useState } from 'react';
import { Search, Plus, Settings2, Power, Loader2, X } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const TenantManager = () => {
    const { token } = useAuth();
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);
    const [formData, setFormData] = useState({ name: '', domain: '', admin_email: '', plan: 'Standard' });
    const [tenantForm, setTenantForm] = useState({ hotel_name: '', license_expiry: '', plan: 'Standard', max_rooms: 100, reset_password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        const [statsRes, plansRes] = await Promise.all([
            fetch(`${API_URL}/api/super-admin/stats/`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/api/plans/`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (statsRes.ok) setTenants((await statsRes.json()).hotels || []);
        if (plansRes.ok) setPlans(await plansRes.json());
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleCreate = async () => {
        setIsSubmitting(true);
        const selectedPlan = plans.find(p => p.name === formData.plan);
        try {
            const res = await fetch(`${API_URL}/api/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    username: formData.domain, email: formData.admin_email, password: 'DefaultPassword123!',
                    first_name: formData.name, last_name: 'Admin', role: 'OWNER',
                    plan: formData.plan, max_rooms: selectedPlan?.max_rooms || 20
                })
            });
            if (res.ok) { setShowCreateModal(false); fetchData(); alert("Tenant Deployed!"); }
            else alert("Deployment Failed");
        } catch (e) { alert("Network Error"); }
        setIsSubmitting(false);
    };

    const handleUpdate = async () => {
        if(!editingTenant) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/super-admin/stats/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'edit_tenant', hotel_id: editingTenant.id, ...tenantForm })
            });
            if(res.ok) { setEditingTenant(null); fetchData(); alert("Updated!"); }
        } catch(e) {}
        setIsSubmitting(false);
    };

    const filteredTenants = tenants.filter(t => t.username.includes(searchTerm) || t.email.includes(searchTerm));

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
                                <td className="p-6"><p className="font-bold text-white">{t.username}</p><p className="text-[10px] text-slate-500">{t.email}</p></td>
                                <td className="p-6"><span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-black">{t.plan || 'PRO'}</span></td>
                                <td className="p-6"><span className={`px-2 py-1 rounded text-[10px] font-black ${t.is_active ? 'text-emerald-400' : 'text-red-400'}`}>{t.is_active ? 'ONLINE' : 'OFF'}</span></td>
                                <td className="p-6 text-right"><button onClick={() => { setEditingTenant(t); setTenantForm({ ...tenantForm, hotel_name: t.hotel_name || '' }); }} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg"><Settings2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALS */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 w-full max-w-lg p-8 rounded-3xl border border-slate-800">
                        <h3 className="text-2xl font-black text-white mb-6">Deploy Node</h3>
                        <div className="space-y-4">
                            <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" placeholder="Hotel Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                            <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" placeholder="Cluster ID" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}/>
                            <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" placeholder="Email" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})}/>
                            <select className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                                {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={handleCreate} disabled={isSubmitting} className="flex-1 bg-purple-600 py-3 rounded-xl font-bold text-white">{isSubmitting ? 'Deploying...' : 'Deploy'}</button>
                            <button onClick={() => setShowCreateModal(false)} className="px-6 py-3 bg-slate-800 rounded-xl font-bold text-white">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantManager;