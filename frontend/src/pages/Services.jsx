import { useEffect, useState } from 'react';
import { Plus, Coffee, Utensils, Trash2, Edit3 } from 'lucide-react';
import { API_URL } from '../config';

const Services = () => {
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'FOOD' });
  const token = localStorage.getItem('access_token');

  const fetchServices = async () => {
    const res = await fetch(`${API_URL}/api/services/`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setServices(await res.json());
  };

  useEffect(() => { fetchServices(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/services/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
    });
    setShowModal(false);
    setFormData({ name: '', price: '', category: 'FOOD' });
    fetchServices();
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this item?")) return;
    await fetch(`${API_URL}/api/services/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchServices();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Services & Menu</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">POS Items: {services.length}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2">
            <Plus size={16}/> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {services.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm group hover:border-blue-500 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                        {item.category === 'FOOD' ? <Utensils size={20}/> : <Coffee size={20}/>}
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-1">{item.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                <div className="mt-4 pt-4 border-t border-slate-50 text-2xl font-black text-slate-900">
                    ₹{item.price}
                </div>
            </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[30px] w-full max-w-sm space-y-4">
                <h3 className="text-xl font-black text-slate-800 uppercase italic mb-4">Add Menu Item</h3>
                <input required placeholder="Item Name" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="number" placeholder="Price (₹)" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                <select className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="FOOD">Food</option>
                    <option value="BEVERAGE">Beverage</option>
                    <option value="SERVICE">Service / Other</option>
                </select>
                <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 mt-2">Save Item</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
            </form>
        </div>
      )}
    </div>
  );
};

export default Services;