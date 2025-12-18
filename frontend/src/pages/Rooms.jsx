import { useEffect, useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { API_URL } from '../config'; // <--- UPDATED IMPORT

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'SINGLE',
    price_per_night: '',
    status: 'AVAILABLE'
  });

  // 1. Fetch Rooms from Backend
  const fetchRooms = () => {
    fetch(API_URL + '/api/rooms/') // <--- UPDATED URL
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 2. Handle Form Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Send Data to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL + '/api/rooms/', { // <--- UPDATED URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Room Created Successfully! 🎉");
        setShowForm(false); // Close form
        setFormData({ room_number: '', room_type: 'SINGLE', price_per_night: '', status: 'AVAILABLE' }); // Reset form
        fetchRooms(); // Refresh list
      } else {
        alert("Failed to create room.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Room Inventory</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add New Room</>}
        </button>
      </div>

      {/* The "Add Room" Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 mb-8 animate-pulse-once">
          <h3 className="text-lg font-bold mb-4">Add New Details</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <input 
              type="text" name="room_number" placeholder="Room Number (e.g. 102)" 
              className="border p-2 rounded" required
              value={formData.room_number} onChange={handleChange}
            />
            
            <select name="room_type" className="border p-2 rounded" value={formData.room_type} onChange={handleChange}>
              <option value="SINGLE">Single</option>
              <option value="DOUBLE">Double</option>
              <option value="SUITE">Suite</option>
            </select>

            <input 
              type="number" name="price_per_night" placeholder="Price (₹)" 
              className="border p-2 rounded" required
              value={formData.price_per_night} onChange={handleChange}
            />

            <button type="submit" className="bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Save Room
            </button>
          </form>
        </div>
      )}

      {/* The Room List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Room No</th>
              <th className="p-4 font-semibold text-slate-600">Type</th>
              <th className="p-4 font-semibold text-slate-600">Price</th>
              <th className="p-4 font-semibold text-slate-600">Status</th>
              <th className="p-4 font-semibold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{room.room_number}</td>
                <td className="p-4 text-slate-500">{room.room_type}</td>
                <td className="p-4 font-medium">₹{room.price_per_night}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    room.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {room.status}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-red-400 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {rooms.length === 0 && (
          <div className="p-8 text-center text-slate-400">No rooms found. Add one above!</div>
        )}
      </div>
    </div>
  );
};

export default Rooms;