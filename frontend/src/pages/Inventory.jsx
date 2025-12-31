import { useEffect, useState } from 'react';
import { 
  Package, Search, Plus, AlertTriangle, 
  ArrowUp, ArrowDown, Loader2, Trash2, X 
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; // 🟢 Import Context

const Inventory = () => {
  const { token, role, user } = useAuth(); // 🟢 Use Global Auth
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 🛡️ SECURITY: Only Owners/Managers can delete inventory items
  const canDelete = ['OWNER', 'MANAGER'].includes(role) || user?.is_superuser;

  const [formData, setFormData] = useState({ 
    name: '', 
    category: 'SUPPLIES', 
    current_stock: 0, 
    min_stock_alert: 5,
    unit: 'PCS' 
  });

  // --- FETCH DATA ---
  const fetchInventory = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/inventory/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchInventory(); }, [token]);

  // --- ACTIONS ---
  
  // Update Stock (+ or -)
  const handleUpdateStock = async (id, change) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newStock = Math.max(0, parseInt(item.current_stock) + change);

    // Optimistic Update
    setItems(items.map(i => i.id === id ? { ...i, current_stock: newStock } : i));

    try {
      await fetch(`${API_URL}/api/inventory/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ current_stock: newStock })
      });
    } catch (err) { 
      console.error(err);
      fetchInventory(); // Revert on error
    }
  };

  // Create Item
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/inventory/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', category: 'SUPPLIES', current_stock: 0, min_stock_alert: 5, unit: 'PCS' });
        fetchInventory();
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this inventory item?")) return;
    
    // Optimistic
    const originalItems = [...items];
    setItems(items.filter(i => i.id !== id));

    try {
        const res = await fetch(`${API_URL}/api/inventory/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to delete");
    } catch (err) { 
        console.error(err); 
        setItems(originalItems); // Revert on error
    }
  };

  // Search Filter
  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Inventory</h2>
           <div className="flex items-center gap-4 mt-1">
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total SKUs: {items.length}</p>
             {items.some(i => i.current_stock <= i.min_stock_alert) && (
                 <span className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                     <AlertTriangle size={12}/> Low Stock Alerts
                 </span>
             )}
           </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search items..." 
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

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
                
                {/* Low Stock Badge */}
                {item.current_stock <= item.min_stock_alert && (
                    <div className="absolute top-0 right-0 bg-red-50 text-red-500 px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={10}/> Low Stock
                    </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 mb-2">
                        <Package size={20}/>
                    </div>
                    {/* 🛡️ Delete Button (Restricted) */}
                    {canDelete && (
                        <button 
                            onClick={() => handleDelete(item.id)} 
                            className="text-slate-300 hover:text-red-500 transition-colors"
                            title="Delete Item"
                        >
                            <Trash2 size={16}/>
                        </button>
                    )}
                </div>

                <h3 className="text-lg font-black text-slate-800 leading-tight">{item.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{item.category}</p>
                
                <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                    <div>
                        <div className={`text-3xl font-black tracking-tighter ${item.current_stock <= item.min_stock_alert ? 'text-red-500' : 'text-slate-900'}`}>
                            {item.current_stock}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit || 'Units'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleUpdateStock(item.id, -1)} 
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center"
                        >
                            <ArrowDown size={18}/>
                        </button>
                        <button 
                            onClick={() => handleUpdateStock(item.id, 1)} 
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-green-500 transition-colors flex items-center justify-center"
                        >
                            <ArrowUp size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        ))}
        
        {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No inventory items found.</p>
            </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">New Item</h3>
                    <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                    <input required placeholder="e.g. Bath Towel" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="SUPPLIES">Supplies (Soap, Towels)</option>
                        <option value="FOOD">Food & Beverage</option>
                        <option value="MAINTENANCE">Hardware / Tools</option>
                        <option value="LINEN">Linen / Bedding</option>
                        <option value="OFFICE">Office Supplies</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
                        <input required type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert Limit</label>
                        <input required type="number" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={formData.min_stock_alert} onChange={e => setFormData({...formData, min_stock_alert: e.target.value})} />
                    </div>
                </div>

                <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                      <input type="text" placeholder="e.g. PCS, KG, BOX" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-500 hover:bg-slate-200">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl uppercase tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2">
                        {submitting ? <Loader2 className="animate-spin" size={16}/> : "Create"}
                    </button>
                </div>
            </form>
        </div>
      )}

    </div>
  );
};

export default Inventory;