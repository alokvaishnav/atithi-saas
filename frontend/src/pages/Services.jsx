import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Coffee, Shirt, Car, Sparkles, Tag } from 'lucide-react';
import { API_URL } from '../config'; 

const Services = () => {
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const token = localStorage.getItem('access_token');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'FOOD'
  });

  // Fetch Services
  const fetchServices = async () => {
    try {
      const response = await fetch(API_URL + '/api/services/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setServices(await response.json());
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit New Service
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL + '/api/services/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Service Added! 🛒");
        setShowForm(false);
        setFormData({ name: '', price: '', category: 'FOOD' });
        fetchServices();
      } else {
        alert("Error adding service.");
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
      if (response.ok) fetchServices();
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Services & Menu</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add Item</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 mb-8 animate-pulse-once">
          <h3 className="text-lg font-bold mb-4">Add New Item</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="name" placeholder="Item Name (e.g. Chicken Biryani)" className="border p-2 rounded" required value={formData.name} onChange={handleChange} />
            <input type="number" name="price" placeholder="Price (₹)" className="border p-2 rounded" required value={formData.price} onChange={handleChange} />
            <select name="category" className="border p-2 rounded" value={formData.category} onChange={handleChange}>
              <option value="FOOD">Food & Beverage</option>
              <option value="LAUNDRY">Laundry</option>
              <option value="SPA">Spa & Wellness</option>
              <option value="TRAVEL">Travel / Taxi</option>
              <option value="OTHER">Other</option>
            </select>
            <button type="submit" className="md:col-span-3 bg-green-600 text-white py-2 rounded font-bold">Save Item</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-3 rounded-full">{getIcon(service.category)}</div>
              <div>
                <h3 className="font-bold text-slate-800">{service.name}</h3>
                <p className="text-green-600 font-bold">₹{service.price}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(service.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Services;