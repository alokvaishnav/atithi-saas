import { useEffect, useState } from 'react';
import { 
  Package, Search, Plus, AlertTriangle, 
  CheckCircle, ArrowUp, ArrowDown 
} from 'lucide-react';
import { API_URL } from '../config';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'SUPPLIES', current_stock: 0, min_stock_alert: 5 });
  const token = localStorage.getItem('access_token');

  const fetchInventory = async () => {
    try {
        const res = await fetch(`${API_URL}/api/inventory/`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setItems(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleUpdateStock = async (id, change) => {
    try {
        await fetch(`${API_URL}/api/inventory/${id}/update_stock/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ change })
        });
        fetchInventory();
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
        await fetch(`${API_URL}/api/inventory/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        setShowModal(false);
        fetchInventory();
    } catch (err) { console.error(err); }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Inventory</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total SKUs: {items.length}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2">
            <Plus size={16}/> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredItems.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
                {item.current_stock <= item.min_stock_alert && (
                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={12}/> Low Stock
                    </div>
                )}
                
                <h3 className="text-lg font-black text-slate-800 mb-1">{item.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{item.category}</p>
                
                <div className="flex justify-between items-end">
                    <div className="text-3xl font-black text-slate-900">{item.current_stock} <span className="text-sm text-slate-400 font-bold">Units</span></div>
                    <div className="flex gap-2">
                        <button onClick={() => handleUpdateStock(item.id, -1)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><ArrowDown size={16}/></button>
                        <button onClick={() => handleUpdateStock(item.id, 1)} className="p-2 bg-green-50 text-green-500 rounded-lg hover:bg-green-100"><ArrowUp size={16}/></button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4">
                <h3 className="text-xl font-black text-slate-800 uppercase italic mb-4">New Inventory Item</h3>
                <input required placeholder="Item Name" className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <select className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="SUPPLIES">Supplies (Soap, Towels)</option>
                    <option value="FOOD">Food Ingredient</option>
                    <option value="MAINTENANCE">Hardware / Tools</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                    <input required type="number" placeholder="Initial Stock" className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={formData.current_stock} onChange={e => setFormData({...formData, current_stock: e.target.value})} />
                    <input required type="number" placeholder="Alert Limit" className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={formData.min_stock_alert} onChange={e => setFormData({...formData, min_stock_alert: e.target.value})} />
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-500">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl uppercase tracking-widest">Create</button>
                </div>
            </form>
        </div>
      )}

    </div>
  );
};

export default Inventory;