import { useEffect, useState } from 'react';
import { 
  Plus, X, Trash2, Coffee, Shirt, Car, Sparkles, Tag, 
  Package, Search, Edit2, Loader2, Utensils 
} from 'lucide-react';
import { API_URL } from '../config'; 

const Services = () => {
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const token = localStorage.getItem('access_token');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'FOOD',
    linked_inventory_item: '' 
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [servRes, invRes] = await Promise.all([
        fetch(API_URL + '/api/services/', { headers }),
        fetch(API_URL + '/api/inventory/', { headers })
      ]);

      if (servRes.ok) setServices(await servRes.json());
      if (invRes.ok) setInventory(await invRes.json());

    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Open Edit Modal
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
        name: item.name,
        price: item.price,
        category: item.category,
        linked_inventory_item: item.linked_inventory_item || ''
    });
    setShowForm(true);
  };

  // Submit New/Update Service
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
        ...formData,
        linked_inventory_item: formData.linked_inventory_item || null
    };

    try {
      const url = editingItem 
        ? `${API_URL}/api/services/${editingItem.id}/` 
        : `${API_URL}/api/services/`;
      
      const method = editingItem ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(editingItem ? "Service Updated! ✅" : "Service Added! 🛒");
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: '', price: '', category: 'FOOD', linked_inventory_item: '' });
        fetchData(); 
      } else {
        alert("Error saving service.");
      }
    } catch (error) { console.error(error); }
  };

  // Delete Service
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this item?")) return;
    try {
      const response = await fetch(API_URL + `/api/services/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchData();
    } catch (error) { console.error(error); }
  };

  // Icon Helper
  const getIcon = (category) => {
    switch(category) {
      case 'FOOD': return <Utensils size={20} className="text-orange-500"/>;
      case 'LAUNDRY': return <Shirt size={20} className="text-blue-500"/>;
      case 'TRAVEL': return <Car size={20} className="text-green-500"/>;
      case 'SPA': return <Sparkles size={20} className="text-purple-500"/>;
      default: return <Tag size={20} className="text-slate-500"/>;
    }
  };

  // Filter Logic
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Catalog...</p>
       </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Services & Menu</h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Manage POS Items & Pricing</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Search menu..." 
                    className="w-full pl-12 p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => { setEditingItem(null); setFormData({ name: '', price: '', category: 'FOOD', linked_inventory_item: '' }); setShowForm(true); }} 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
            >
                <Plus size={18}/> Add Item
            </button>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-10 rounded-[40px] w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                        {editingItem ? 'Edit Service' : 'New Service Item'}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-300 hover:text-slate-900"><X size={24}/></button>
                </div>
          
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Item Name</label>
                        <input type="text" name="name" placeholder="e.g. Chicken Biryani" 
                            className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                            required value={formData.name} onChange={handleChange} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Price (₹)</label>
                            <input type="number" name="price" placeholder="0.00" 
                                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                required value={formData.price} onChange={handleChange} 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                            <select name="category" 
                                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                value={formData.category} onChange={handleChange}
                            >
                                <option value="FOOD">Food & Beverage</option>
                                <option value="LAUNDRY">Laundry</option>
                                <option value="SPA">Spa & Wellness</option>
                                <option value="TRAVEL">Travel / Taxi</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Link Stock (Optional)</label>
                        <div className="relative">
                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <select 
                                name="linked_inventory_item" 
                                className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-700 transition-all appearance-none" 
                                value={formData.linked_inventory_item} 
                                onChange={handleChange}
                            >
                                <option value="">-- No Stock Deduction --</option>
                                {inventory.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} (In Stock: {item.current_stock})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold ml-2 mt-2">Selecting an item will automatically deduct stock when sold.</p>
                    </div>

                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2">
                        {editingItem ? <Edit2 size={16}/> : <Plus size={16}/>}
                        {editingItem ? 'Update Item' : 'Add to Menu'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredServices.map(service => (
            <div key={service.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 group hover:shadow-xl transition-all relative overflow-hidden">
                
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-colors duration-500">
                            {getIcon(service.category)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1">{service.name}</h3>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{service.category}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">₹{service.price}</p>
                        {service.linked_inventory_item && (
                            <span className="flex items-center gap-1 text-[9px] text-blue-500 font-black uppercase tracking-widest mt-1">
                                <Package size={10}/> Stock Linked
                            </span>
                        )}
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleEdit(service)} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <Edit2 size={14}/>
                        </button>
                        <button 
                            onClick={() => handleDelete(service.id)} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={14}/>
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>

    </div>
  );
};

export default Services;