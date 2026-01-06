import { useEffect, useState, useCallback } from 'react';
import { 
  Package, Search, Plus, AlertTriangle, 
  ArrowUp, ArrowDown, Loader2, Trash2, X,
  Box, CheckCircle, RefreshCcw, Filter, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
  const { token, role, user } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error Handling
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('LOW_STOCK'); // NAME, STOCK_ASC, STOCK_DESC, LOW_STOCK
  
  // Modal States
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
  const fetchInventory = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/inventory/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });

      if (res.status === 401) {
          navigate('/login');
          return;
      }

      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setError("Failed to load inventory.");
      }
    } catch (err) { 
      console.error(err); 
      setError("Network connection failed.");
    } finally { 
      setLoading(false); 
    }
  }, [token, navigate]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // --- ACTIONS ---
  
  // Update Stock (+ or -)
  const handleUpdateStock = async (id, change) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newStock = Math.max(0, parseInt(item.current_stock || 0) + change);

    // Optimistic Update
    const originalItems = [...items];
    setItems(prevItems => prevItems.map(i => i.id === id ? { ...i, current_stock: newStock } : i));

    try {
      const res = await fetch(`${API_URL}/api/inventory/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ current_stock: newStock })
      });
      if(!res.ok) throw new Error("Update failed");
    } catch (err) { 
      console.error(err);
      setItems(originalItems); // Revert on error
      alert("Failed to update stock. Check connection.");
    }
  };

  // Create Item
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
          ...formData,
          current_stock: parseInt(formData.current_stock),
          min_stock_alert: parseInt(formData.min_stock_alert)
      };

      const res = await fetch(`${API_URL}/api/inventory/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', category: 'SUPPLIES', current_stock: 0, min_stock_alert: 5, unit: 'PCS' });
        fetchInventory();
        alert("Item added successfully!");
      } else {
        alert("Failed to add item. Please try again.");
      }
    } catch (err) { 
      console.error(err); 
      alert("Network Error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this inventory item? This action cannot be undone.")) return;
    
    // Optimistic Update
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
        alert("Could not delete item.");
    }
  };

  // --- FILTER & SORT LOGIC ---
  const getProcessedItems = () => {
      let result = items.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return result.sort((a, b) => {
          switch (sortBy) {
              case 'LOW_STOCK':
                  // Sort by closeness to alert level (ascending)
                  return (a.current_stock - a.min_stock_alert) - (b.current_stock - b.min_stock_alert);
              case 'NAME':
                  return a.name.localeCompare(b.name);
              case 'STOCK_DESC':
                  return b.current_stock - a.current_stock;
              default:
                  return 0;
          }
      });
  };

  const processedItems = getProcessedItems();
  const lowStockCount = items.filter(i => i.current_stock <= i.min_stock_alert).length;

  // --- LOADING STATE ---
  if (loading && items.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Loading Inventory...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Inventory</h2>
           <div className="flex items-center gap-4 mt-1">
             <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total SKUs: {items.length}</p>
             {lowStockCount > 0 && (
                 <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                     <AlertTriangle size={12}/> {lowStockCount} Low Stock
                 </span>
             )}
             {lowStockCount === 0 && items.length > 0 && (
                 <span className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                     <CheckCircle size={12}/> All Good
                 </span>
             )}
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Refresh */}
            <button 
                onClick={fetchInventory} 
                className="bg-white p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm w-fit"
                title="Refresh Inventory"
            >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""}/>
            </button>

            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm text-slate-700 transition-shadow shadow-sm focus:shadow-md" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    className="w-full md:w-auto pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm text-slate-700 appearance-none bg-white cursor-pointer shadow-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="LOW_STOCK">Sort: Low Stock</option>
                    <option value="NAME">Sort: Name (A-Z)</option>
                    <option value="STOCK_DESC">Sort: High Stock</option>
                </select>
            </div>

            <button 
                onClick={() => setShowModal(true)} 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-300"
            >
                <Plus size={16}/> Add Item
            </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20}/> {error}
            <button onClick={fetchInventory} className="underline ml-auto hover:text-red-800">Retry</button>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {processedItems.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
                
                {/* Low Stock Badge */}
                {item.current_stock <= item.min_stock_alert && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm z-10">
                        <AlertTriangle size={10}/> Low Stock
                    </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-2 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <Box size={24}/>
                    </div>
                    {/* 🛡️ Delete Button (Restricted) */}
                    {canDelete && (
                        <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Item"
                        >
                            <Trash2 size={16}/>
                        </button>
                    )}
                </div>

                <h3 className="text-lg font-black text-slate-800 leading-tight mb-1 truncate" title={item.name}>{item.name}</h3>
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
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center active:scale-95"
                            disabled={item.current_stock <= 0}
                        >
                            <ArrowDown size={18}/>
                        </button>
                        <button 
                            onClick={() => handleUpdateStock(item.id, 1)} 
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-green-500 transition-colors flex items-center justify-center active:scale-95"
                        >
                            <ArrowUp size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        ))}
        
        {processedItems.length === 0 && !loading && !error && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-slate-400">
                <Package size={48} className="mb-4 opacity-20"/>
                <p className="font-bold uppercase tracking-widest text-xs">No inventory items found.</p>
            </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in duration-200 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">New Item</h3>
                    <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                    <input required placeholder="e.g. Bath Towel" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-800 placeholder:text-slate-300 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-700 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="SUPPLIES">Supplies (Soap, Towels)</option>
                        <option value="FOOD">Food & Beverage</option>
                        <option value="MAINTENANCE">Hardware / Tools</option>
                        <option value="LINEN">Linen / Bedding</option>
                        <option value="OFFICE">Office Supplies</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
                        <input required type="number" min="0" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-800 transition-all" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert Limit</label>
                        <input required type="number" min="0" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-800 transition-all" value={formData.min_stock_alert} onChange={e => setFormData({...formData, min_stock_alert: e.target.value})} />
                    </div>
                </div>

                <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                      <input type="text" placeholder="e.g. PCS, KG, BOX" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-800 placeholder:text-slate-300 transition-all" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl uppercase tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
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