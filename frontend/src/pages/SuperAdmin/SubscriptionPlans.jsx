import { useEffect, useState } from 'react';
import { Tag, Check, Database, Trash2, Plus, X, Save, Loader2 } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const SubscriptionPlans = () => {
    const { token } = useAuth();
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({ name: '', price: '', max_rooms: '', features: [], color: 'blue' });
    const [featureInput, setFeatureInput] = useState(''); // For typing new tags

    const fetchPlans = async () => {
        try {
            const res = await fetch(`${API_URL}/api/plans/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if(res.ok) setPlans(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchPlans(); }, [token]);

    // --- FORM HANDLERS ---
    const handleAddFeature = (e) => {
        if (e.key === 'Enter' && featureInput.trim() !== '') {
            e.preventDefault();
            setForm({ ...form, features: [...form.features, featureInput.trim()] });
            setFeatureInput('');
        }
    };

    const removeFeature = (index) => {
        setForm({ ...form, features: form.features.filter((_, i) => i !== index) });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = { ...form, currency: 'INR', interval: 'month' };
        const url = editingPlan ? `${API_URL}/api/plans/${editingPlan.id}/` : `${API_URL}/api/plans/`;
        const method = editingPlan ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method, 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if(res.ok) { 
                setShowModal(false); 
                fetchPlans(); 
                alert("Plan Saved Successfully");
            } else {
                alert("Failed to save plan");
            }
        } catch(e) { alert("Network Error"); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if(!confirm("Delete this plan from database? This cannot be undone.")) return;
        await fetch(`${API_URL}/api/plans/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchPlans();
    };

    const openModal = (plan = null) => {
        setEditingPlan(plan);
        // Ensure features is always an array, even if API sends null
        const safeFeatures = plan && Array.isArray(plan.features) ? plan.features : [];
        setForm(plan ? { ...plan, features: safeFeatures } : { name: '', price: '', max_rooms: '', features: [], color: 'blue' });
        setFeatureInput('');
        setShowModal(true);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header / Add Button */}
            <div className="flex justify-end mb-8">
                <button onClick={() => openModal()} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 shadow-lg transition-all">
                    <Plus size={16}/> Create New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <div key={plan.id} className={`bg-slate-900 rounded-[35px] border border-slate-800 p-8 relative overflow-hidden group hover:border-${plan.color || 'blue'}-500 transition-all duration-300 shadow-xl`}>
                        <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity bg-${plan.color || 'blue'}-500/20 rounded-bl-[40px]`}>
                            <Tag size={80} className={`text-${plan.color || 'blue'}-500`}/>
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`text-sm font-black uppercase tracking-widest text-${plan.color || 'blue'}-400`}>{plan.name}</h3>
                                {plan.is_active === false && <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded">HIDDEN</span>}
                            </div>

                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-black text-white">₹{plan.price}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase">/{plan.interval}</span>
                            </div>
                            
                            <div className="space-y-3 mb-8 min-h-[150px]">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-800 p-1.5 rounded-lg text-slate-400"><Database size={12}/></div>
                                    <p className="text-xs font-bold text-slate-300">{plan.max_rooms} Max Rooms</p>
                                </div>
                                {/* Safe render of features array */}
                                {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="bg-green-500/10 p-1.5 rounded-lg text-green-500"><Check size={12}/></div>
                                        <p className="text-xs font-bold text-slate-400">{feat}</p>
                                    </div>
                                ))}
                                {(Array.isArray(plan.features) ? plan.features : []).length > 5 && (
                                    <p className="text-[10px] text-slate-600 pl-8 italic">+ {(plan.features.length - 5)} more features...</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-slate-800/50">
                                <button onClick={() => openModal(plan)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors">
                                    Edit Details
                                </button>
                                <button onClick={() => handleDelete(plan.id)} className="p-3 bg-slate-900 border border-slate-800 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-slate-900 w-full max-w-lg p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X/></button>
                        <h3 className="text-2xl font-black text-white mb-6 italic uppercase tracking-tighter">{editingPlan ? 'Edit Plan' : 'New Subscription Tier'}</h3>
                        
                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Plan Identity</label>
                                <input className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500" placeholder="Plan Name (e.g. Enterprise)" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Pricing (INR)</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500" placeholder="1999" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} required/>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Room Limit</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-purple-500" placeholder="20" value={form.max_rooms} onChange={e=>setForm({...form, max_rooms: e.target.value})} required/>
                                </div>
                            </div>

                            {/* VISUAL TAG INPUT */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Feature List (Type & Enter)</label>
                                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl min-h-[100px] flex flex-wrap gap-2 focus-within:border-purple-500 transition-colors">
                                    {form.features.map((feat, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-800 text-white text-xs rounded-full flex items-center gap-2">
                                            {feat}
                                            <button type="button" onClick={() => removeFeature(i)} className="hover:text-red-400"><X size={12}/></button>
                                        </span>
                                    ))}
                                    <input 
                                        className="bg-transparent outline-none text-white text-sm flex-1 min-w-[100px]" 
                                        placeholder="Add feature..." 
                                        value={featureInput}
                                        onChange={e => setFeatureInput(e.target.value)}
                                        onKeyDown={handleAddFeature}
                                    />
                                </div>
                            </div>

                            {/* COLOR PICKER */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Theme Color</label>
                                <div className="flex gap-3">
                                    {['blue', 'purple', 'orange', 'emerald', 'red'].map(c => (
                                        <div key={c} onClick={() => setForm({...form, color: c})} 
                                            className={`w-8 h-8 rounded-full bg-${c}-500 cursor-pointer border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}></div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full mt-4 bg-white text-slate-900 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin"/> : <><Save size={16}/> Save Configuration</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default SubscriptionPlans;