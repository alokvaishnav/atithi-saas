import { useEffect, useState } from 'react';
import { 
  Plus, X, Trash2, Package, AlertTriangle, 
  ArrowDown, ArrowUp, Search, RefreshCw, Box 
} from 'lucide-react';
import { API_URL } from '../config';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('access_token');

  // New Item State
  const [formData, setFormData] = useState({
    name: '',
    current_stock: '',
    unit: 'pcs',
    min_stock_alert: '10',
    cost_price: ''
  });

  // --- FETCH INVENTORY ---
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/inventory/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Inventory Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // --- HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/inventory/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("Item Added Successfully! 📦");
        setShowForm(false);
        setFormData({ name: '', current_stock: '', unit: 'pcs', min_stock_alert: '10', cost_price: '' });
        fetchInventory();
      } else {
        alert("Error adding item.");
      }
    } catch (err) { console.error(err); }
  };

  const deleteItem = async (id) => {
    if(!window.confirm("Delete this inventory item?")) return;
    try {
      await fetch(`${API_URL}/api/inventory/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  const updateStock = async (id, currentQty, change) => {
    const newQty = parseInt(currentQty) + change;
    if (newQty < 0) return alert("Stock cannot be negative!");

    try {
      // Optimistic Update
      setItems(prev => prev.map(item => item.id === id ? { ...item, current_stock: newQty } : item));
      
      await fetch(`${API_URL}/api/inventory/${id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ current_stock: newQty })
      });
    } catch (err) { 
        console.error(err);
        fetchInventory(); // Revert on error
    }
  };

  // Filter Logic
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Inventory</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Stock Management & Alerts</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
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
            onClick={() => setShowForm(true)} 
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus size={18} /> Add Stock
          </button>
        </div>
      </div>

      {/* ADD ITEM FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[30px] shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase italic">New Inventory Item</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</label>
                <input required type="text" placeholder="e.g. Mineral Water 1L" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Stock</label>
                  <input required type="number" placeholder="0" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                    value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                  <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                    value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kg</option>
                    <option value="ltr">Liters</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock Alert</label>
                  <input required type="number" placeholder="10" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                    value={formData.min_stock_alert} onChange={e => setFormData({...formData, min_stock_alert: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Price (₹)</label>
                  <input type="number" placeholder="0.00" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                    value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-green-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-100 mt-4">
                Save to Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex justify-center py-20">
          <RefreshCw className="animate-spin text-slate-300" size={40} />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
          <Box size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest">No items found</p>
        </div>
      )}

      {/* GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => {
          const isLowStock = item.current_stock <= item.min_stock_alert;
          
          return (
            <div key={item.id} className={`bg-white p-6 rounded-[24px] border-2 transition-all group hover:shadow-xl ${isLowStock ? 'border-red-100 shadow-red-50' : 'border-slate-50 shadow-sm'}`}>
              
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <Package size={24} className="text-slate-700" />
                </div>
                {isLowStock && (
                  <span className="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <AlertTriangle size={12} /> Low Stock
                  </span>
                )}
              </div>

              <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{item.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Unit: {item.unit}</p>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In Stock</p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateStock(item.id, item.current_stock, -1)}
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <ArrowDown size={14} strokeWidth={3} />
                    </button>
                    
                    <span className={`text-2xl font-black ${isLowStock ? 'text-red-500' : 'text-slate-800'}`}>
                      {item.current_stock}
                    </span>

                    <button 
                      onClick={() => updateStock(item.id, item.current_stock, 1)}
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-green-100 hover:text-green-500 transition-colors"
                    >
                      <ArrowUp size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => deleteItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inventory;