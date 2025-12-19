import { useEffect, useState } from 'react';
import { Plus, X, Phone, Mail, Trash2, Search } from 'lucide-react'; // 👈 Added Search Icon
import { API_URL } from '../config'; 

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]); // 👈 NEW: Holds search results
  const [searchTerm, setSearchTerm] = useState(''); // 👈 NEW: Holds search text
  const [showForm, setShowForm] = useState(false);
  
  // 🔐 Get the Token
  const token = localStorage.getItem('access_token');

  // Guest Form Data
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_proof_number: ''
  });

  // 1. Fetch Guests
  const fetchGuests = async () => {
    try {
      const response = await fetch(API_URL + '/api/guests/', {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        setGuests(data);
        setFilteredGuests(data); // 👈 NEW: Initially, show all guests
      } else {
        console.error("Failed to fetch guests:", data);
      }
    } catch (err) {
      console.error("Network Error:", err);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // 👇 NEW: SEARCH LOGIC
  // This runs every time 'searchTerm' or 'guests' changes
  useEffect(() => {
    const results = guests.filter(guest => 
      guest.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm) ||
      guest.id_proof_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGuests(results);
  }, [searchTerm, guests]);


  // 2. Handle Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Submit Guest
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = { ...formData };
    if (!payload.email) {
        payload.email = null;
    }

    try {
      const response = await fetch(API_URL + '/api/guests/', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Guest Registered Successfully! 👤");
        setShowForm(false);
        setFormData({ full_name: '', phone: '', email: '', id_proof_number: '' });
        fetchGuests(); // Refresh list
      } else {
        const errorData = await response.json();
        alert("Server Error: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Network Error: Could not connect to server.");
    }
  };

  // 4. Delete Guest Function
  const handleDelete = async (guestId) => {
    if(!window.confirm("Are you sure you want to delete this guest?")) return;

    try {
      const response = await fetch(API_URL + `/api/guests/${guestId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("Guest Deleted! 🗑️");
        fetchGuests(); // Refresh list
      } else {
        alert("Could not delete guest. (They might have active bookings)");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Guest Management</h2>
        
        {/* 👇 NEW: SEARCH BAR UI */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Phone, or ID..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
        >
          {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add New Guest</>}
        </button>
      </div>

      {/* Add Guest Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 mb-8 animate-pulse-once">
          <h3 className="text-lg font-bold mb-4">Register New Guest</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="text-xs text-slate-500">Full Name</label>
              <input type="text" name="full_name" className="w-full border p-2 rounded" required
                value={formData.full_name} onChange={handleChange} />
            </div>

            <div>
              <label className="text-xs text-slate-500">Phone Number</label>
              <input type="text" name="phone" className="w-full border p-2 rounded" required
                value={formData.phone} onChange={handleChange} />
            </div>

            <div>
              <label className="text-xs text-slate-500">Email (Optional)</label>
              <input type="email" name="email" className="w-full border p-2 rounded"
                placeholder="Leave blank if none"
                value={formData.email} onChange={handleChange} />
            </div>

            <div>
              <label className="text-xs text-slate-500">ID Proof Number</label>
              <input type="text" name="id_proof_number" className="w-full border p-2 rounded" required
                value={formData.id_proof_number} onChange={handleChange} />
            </div>

            <div className="md:col-span-2 mt-2">
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-bold">
                Register Guest
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guest List Grid - 👇 Uses filteredGuests now */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map(guest => (
          <div key={guest.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 relative group">
            
            {/* Delete Button */}
            <button 
                onClick={() => handleDelete(guest.id)}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                title="Delete Guest"
            >
                <Trash2 size={18} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                {guest.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{guest.full_name}</h3>
                <p className="text-xs text-slate-400">ID: {guest.id_proof_number}</p>
              </div>
            </div>
            
            <div className="border-t border-slate-50 pt-3 mt-1 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" /> {guest.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" /> 
                {guest.email ? guest.email : <span className="text-slate-300 italic">Not Provided</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State for Search */}
      {filteredGuests.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
          {searchTerm ? `No guests found matching "${searchTerm}"` : "No guests registered yet."}
        </div>
      )}
    </div>
  );
};

export default Guests;