import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Coffee, Shirt, Car, Sparkles, Tag, Package } from 'lucide-react';
import { API_URL } from '../config'; 

const Services = () => {
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]); // 👈 Store Inventory for Dropdown
  const [showForm, setShowForm] = useState(false);
  const token = localStorage.getItem('access_token');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'FOOD',
    linked_inventory_item: '' // 👈 New Field to link stock
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // 1. Fetch Services
      const servRes = await fetch(API_URL + '/api/services/', { headers });
      if (servRes.ok) setServices(await servRes.json());

      // 2. Fetch Inventory (For linking in the form)
      const invRes = await fetch(API_URL + '/api/inventory/', { headers });
      if (invRes.ok) setInventory(await invRes.json());

    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit New Service
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert empty string to null for backend
    const payload = {
        ...formData,
        linked_inventory_item: formData.linked_inventory_item || null
    };

    try {
      const response = await fetch(API_URL + '/api/services/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Service Added! 🛒");
        setShowForm(false);
        setFormData({ name: '', price: '', category: 'FOOD', linked_inventory_item: '' });
        fetchData(); // Reload list
      } else {
        alert("Error adding service. Please check inputs.");
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
      case 'FOOD': return <Coffee size={24} className="text-orange-500"/>;
      case 'LAUNDRY': return <Shirt size={24} className="text-blue-500"/>;
      case 'TRAVEL': return <Car size={24} className="text-green-500"/>;
      case 'SPA': return <Sparkles size={24} className="text-purple-500"/>;
      default: return <Tag size={24} className="text-slate-500"/>;
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Services & Menu</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Manage POS Items & Pricing</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg">
          {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add Item</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[30px] shadow-xl border border-slate-100 mb-10 animate-in zoom-in duration-200">
          <h3 className="text-lg font-black text-slate-800 uppercase italic mb-6">Create New Service Item</h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Item Name</label>
                <input type="text" name="name" placeholder="e.g. Chicken Biryani" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" required value={formData.name} onChange={handleChange} />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Price (₹)</label>
                <input type="number" name="price" placeholder="0.00" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" required value={formData.price} onChange={handleChange} />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                <select name="category" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={formData.category} onChange={handleChange}>
                    <option value="FOOD">Food & Beverage</option>
                    <option value="LAUNDRY">Laundry</option>
                    <option value="SPA">Spa & Wellness</option>
                    <option value="TRAVEL">Travel / Taxi</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            {/* 📦 NEW: Inventory Link */}
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Deduct Stock From (Optional)</label>
                <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <select 
                        name="linked_inventory_item" 
                        className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-700" 
                        value={formData.linked_inventory_item} 
                        onChange={handleChange}
                    >
                        <option value="">-- No Stock Deduction --</option>
                        {inventory.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} (Available: {item.current_stock})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button type="submit" className="md:col-span-2 bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-100">
                Save Service Item
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between group h-full hover:shadow-md transition-all">
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm">{getIcon(service.category)}</div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">{service.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{service.category}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(service.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                <p className="text-green-600 font-black text-xl">₹{service.price}</p>
                
                {/* Visual Indicator if Linked */}
                {service.linked_inventory_item && (
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1 border border-blue-100" title="Deducts from Inventory">
                        <Package size={10}/> Stock Linked
                    </span>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Services;