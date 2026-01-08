import { useEffect, useState } from 'react';
import { Tag, Check, Database, Trash2, Plus, X } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const SubscriptionPlans = () => {
    const { token } = useAuth();
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [form, setForm] = useState({ name: '', price: '', max_rooms: '', features: '', color: 'blue' });

    const fetchPlans = async () => {
        const res = await fetch(`${API_URL}/api/plans/`, { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) setPlans(await res.json());
    };

    useEffect(() => { fetchPlans(); }, [token]);

    const handleSave = async (e) => {
        e.preventDefault();
        const featuresArray = typeof form.features === 'string' ? form.features.split(',').map(f => f.trim()) : form.features;
        const payload = { ...form, features: featuresArray, currency: 'INR', interval: 'month' };
        
        const url = editingPlan ? `${API_URL}/api/plans/${editingPlan.id}/` : `${API_URL}/api/plans/`;
        const method = editingPlan ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if(res.ok) { setShowModal(false); fetchPlans(); }
    };

    const handleDelete = async (id) => {
        if(confirm("Delete plan?")) {
            await fetch(`${API_URL}/api/plans/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchPlans();
        }
    };

    const openModal = (plan = null) => {
        setEditingPlan(plan);
        setForm(plan ? { ...plan, features: plan.features.join(', ') } : { name: '', price: '', max_rooms: '', features: '', color: 'blue' });
        setShowModal(true);
    };

    return (
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
                            <button onClick={() => openModal(plan)} className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Edit Plan</button>
                            <button onClick={() => handleDelete(plan.id)} className="p-3 bg-slate-800 text-red-400 rounded-xl hover:bg-red-500/10"><Trash2 size={16}/></button>
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={() => openModal()} className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[35px] flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-white hover:border-purple-500 hover:bg-slate-900 transition-all min-h-[400px]">
                <div className="bg-slate-800 p-4 rounded-full"><Plus size={32}/></div>
                <span className="font-bold text-xs uppercase tracking-widest">Create New Tier</span>
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 w-full max-w-lg p-8 rounded-3xl border border-slate-800">
                        <h3 className="text-2xl font-black text-white mb-6">{editingPlan ? 'Edit Plan' : 'New Plan'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price: e.target.value})}/>
                                <input type="number" className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white" placeholder="Max Rooms" value={form.max_rooms} onChange={e=>setForm({...form, max_rooms: e.target.value})}/>
                            </div>
                            <textarea className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white h-24" placeholder="Features (comma separated)" value={form.features} onChange={e=>setForm({...form, features: e.target.value})}/>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold">Save</button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-800 text-white rounded-xl">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default SubscriptionPlans;