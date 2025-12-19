import { useEffect, useState } from 'react';
import { 
  Plus, X, Trash2, Wrench, CheckCircle, 
  Coffee, User, AlertCircle 
} from 'lucide-react'; 
import { API_URL } from '../config'; 

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // New Room Form State
  const [formData, setFormData] = useState({ 
    room_number: '', 
    room_type: 'SINGLE', 
    price_per_night: '', 
    status: 'AVAILABLE' 
  });

  const token = localStorage.getItem('access_token');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL + '/api/rooms/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, []);

  // 👇 RESTORED: Delete Room Function
  const handleDelete = async (roomId) => {
    if(!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      const response = await fetch(API_URL + `/api/rooms/${roomId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert("Room Deleted! 🗑️");
        fetchRooms(); // Refresh the grid
      } else {
        alert("Cannot delete room. (Check if it has active bookings)");
      }
    } catch (error) { console.error("Error deleting:", error); }
  };

  // Update Status Function
  const handleStatusChange = async (roomId, newStatus) => {
    // Optimistic UI Update
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r));

    try {
      await fetch(API_URL + `/api/rooms/${roomId}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) { console.error("Failed to update status", err); fetchRooms(); }
  };

  // Form Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL + '/api/rooms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ room_number: '', room_type: 'SINGLE', price_per_night: '', status: 'AVAILABLE' });
        fetchRooms();
      }
    } catch (err) { console.error(err); }
  };

  // 🎨 HELPER: Get Color & Icon based on Status
  const getStatusDesign = (status) => {
    switch(status) {
      case 'AVAILABLE': 
        return { color: 'border-green-500 bg-white', icon: <Coffee size={32} className="text-green-500"/>, text: 'text-green-600' };
      case 'OCCUPIED': 
        return { color: 'border-red-500 bg-red-50', icon: <User size={32} className="text-red-500"/>, text: 'text-red-600' };
      case 'DIRTY': 
        return { color: 'border-yellow-500 bg-yellow-50', icon: <Trash2 size={32} className="text-yellow-600"/>, text: 'text-yellow-700' };
      case 'MAINTENANCE': 
        return { color: 'border-slate-500 bg-slate-100', icon: <Wrench size={32} className="text-slate-500"/>, text: 'text-slate-600' };
      default: 
        return { color: 'border-slate-200', icon: <AlertCircle size={32}/>, text: 'text-slate-400' };
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Room Status Chart</h1>
          <p className="text-slate-500">Live Housekeeping & Occupancy Grid</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 flex items-center gap-2">
          {showForm ? <X size={20}/> : <Plus size={20}/>} {showForm ? 'Close' : 'Add Room'}
        </button>
      </div>

      {/* ADD ROOM FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-8 max-w-2xl mx-auto animate-fade-in-down">
          <h3 className="font-bold text-lg mb-4 text-slate-700">Add New Unit</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Room Number (e.g. 101)" className="border p-2 rounded" required 
              value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})}/>
            <select className="border p-2 rounded" value={formData.room_type} onChange={e => setFormData({...formData, room_type: e.target.value})}>
              <option value="SINGLE">Single (SGL)</option>
              <option value="DOUBLE">Double (DBL)</option>
              <option value="SUITE">Suite (STE)</option>
            </select>
            <input type="number" placeholder="Price (₹)" className="border p-2 rounded" required 
              value={formData.price_per_night} onChange={e => setFormData({...formData, price_per_night: e.target.value})}/>
            <button type="submit" className="bg-green-600 text-white font-bold rounded py-2 hover:bg-green-700">Save Room</button>
          </form>
        </div>
      )}

      {/* 📊 THE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {rooms.map((room) => {
          const design = getStatusDesign(room.status);
          
          return (
            <div key={room.id} className={`relative p-4 rounded-xl border-t-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-between min-h-[140px] bg-white ${design.color}`}>
              
              {/* Top Row: Number & DELETE BUTTON */}
              <div className="w-full flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="text-slate-800 text-lg">{room.room_number}</span>
                
                <div className="flex items-center gap-2">
                   <span className="border border-slate-200 px-1 rounded">{room.room_type.substring(0, 3)}</span>
                   {/* 👇 NEW DELETE BUTTON */}
                   <button onClick={() => handleDelete(room.id)} className="text-red-300 hover:text-red-500" title="Delete Room">
                     <X size={14} />
                   </button>
                </div>
              </div>

              {/* Center Icon */}
              <div className="flex-1 flex items-center justify-center mb-2">
                <div className={`p-3 rounded-full bg-white/50 backdrop-blur-sm border border-slate-100 shadow-inner`}>
                  {design.icon}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="w-full grid grid-cols-2 gap-1 mt-2">
                {room.status === 'DIRTY' && (
                  <button onClick={() => handleStatusChange(room.id, 'AVAILABLE')} className="col-span-2 bg-green-100 text-green-700 text-xs py-1 rounded font-bold hover:bg-green-200">
                    Mark Clean
                  </button>
                )}
                {room.status === 'AVAILABLE' && (
                   <button onClick={() => handleStatusChange(room.id, 'MAINTENANCE')} className="col-span-2 bg-slate-100 text-slate-600 text-xs py-1 rounded hover:bg-slate-200">
                    Maintenance
                   </button>
                )}
                {room.status === 'MAINTENANCE' && (
                   <button onClick={() => handleStatusChange(room.id, 'AVAILABLE')} className="col-span-2 bg-green-600 text-white text-xs py-1 rounded font-bold hover:bg-green-700">
                    Done
                   </button>
                )}
                {room.status === 'OCCUPIED' && (
                   <div className="col-span-2 text-center text-xs font-bold text-red-500 bg-red-50 py-1 rounded">
                     Occupied
                   </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Rooms;