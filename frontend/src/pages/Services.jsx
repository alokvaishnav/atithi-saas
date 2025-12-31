import { useEffect, useState } from 'react';
import { 
  Plus, Coffee, Utensils, Trash2, Search, 
  Loader2, X, Car, Shirt, Sparkles, Tag 
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; // 🟢 Import Context

const Services = () => {
  const { token, role, user } = useAuth(); // 🟢 Use Global Auth
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL'); 

  // 🛡️ SECURITY: Only Owners/Managers can delete items from catalog
  const canDelete = ['OWNER', 'MANAGER'].includes(role) || user?.is_superuser;

  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    category: 'FOOD',
    description: '' 
  });

  // --- FETCH DATA ---
  const fetchServices = async () => {
    if (!token) return; // Safety check
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/services/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        setServices(await res.json());
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, [token]);

  // --- CREATE SERVICE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/services/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', price: '', category: 'FOOD', description: '' });
        fetchServices();
      } else {
          alert("Failed to create item.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE SERVICE ---
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this menu item?")) return;
    
    // Optimistic Update
    const originalServices = [...services];
    setServices(services.filter(s => s.id !== id));

    try {
      const res = await fetch(`${API_URL}/api/services/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
      console.error(err);
      setServices(originalServices); // Revert on error
      alert("Could not delete item.");
    }
  };

  // --- HELPER ICONS ---
  const getIcon = (cat) => {
    switch(cat) {
        case 'FOOD': return <Utensils size={20}/>;
        case 'BEVERAGE': return <Coffee size={20}/>;
        case 'TRANSPORT': return <Car size={20}/>;
        case 'LAUNDRY': return <Shirt size={20}/>;
        default: return <Sparkles size={20}/>;
    }
  };

  // --- SEARCH & FILTER ---
  const filteredServices = services.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    if(filter === 'ALL') return matchesSearch;
    return matchesSearch && item.category === filter;
  });

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Service Catalog</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Active Items: {services.length}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Menu..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            
            <button 
                onClick={() => setShowModal(true)} 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 transition-all shadow-lg"
            >
                <Plus size={16}/> Add Item
            </button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['ALL', 'FOOD', 'BEVERAGE', 'LAUNDRY', 'TRANSPORT', 'SERVICE'].map(f => (
            <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                    filter === f 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
                }`}
            >
                {f}
            </button>
        ))}
      </div>

      {/* SERVICE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredServices.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all relative flex flex-col h-full">
                
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {getIcon(item.category)}
                    </div>
                    {/* 🛡️ Delete Button: Restricted to Admins */}
                    {canDelete && (
                        <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-2 -mr-2 text-slate-300 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                            title="Delete Item"
                        >
                            <Trash2 size={16}/>
                        </button>
                    )}
                </div>
                
                <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight">{item.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                    <Tag size={10}/> {item.category}
                </p>
                
                {item.description && (
                    <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed flex-1">{item.description}</p>
                )}

                <div className="mt-auto pt-4 border-t border-slate-50 text-2xl font-black text-slate-900 flex items-center gap-1">
                    <span className="text-xs text-slate-400 font-bold">₹</span>
                    {parseFloat(item.price).toLocaleString()}
                </div>
            </div>
        ))}

        {filteredServices.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[30px] border-2 border-dashed border-slate-200">
                <Utensils size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No items found in this category.</p>
            </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[30px] w-full max-w-sm space-y-4 animate-in zoom-in duration-200 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">New Menu Item</h3>
                    <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                    <input required placeholder="e.g. Chicken Biryani" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-blue-500" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                        <input required type="number" placeholder="0.00" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-blue-500" 
                            value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                         <select className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-blue-500" 
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="FOOD">Food</option>
                            <option value="BEVERAGE">Beverage</option>
                            <option value="LAUNDRY">Laundry</option>
                            <option value="TRANSPORT">Transport</option>
                            <option value="SERVICE">Service</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                    <textarea placeholder="Ingredients, details..." className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-blue-500 resize-none h-24" 
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50">
                        {submitting ? <Loader2 className="animate-spin" size={20}/> : "Save Item"}
                    </button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default Services;