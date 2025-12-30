import { useEffect, useState } from 'react';
import { 
  Plus, Search, BedDouble, Trash2, Edit3, 
  CheckCircle, Loader2, MoreVertical, X, Wrench, AlertCircle, User, Brush
} from 'lucide-react';
import { API_URL } from '../config';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // New: Prevent double submission
  const [filter, setFilter] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'SINGLE',
    price_per_night: '',
    status: 'AVAILABLE'
  });
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem('access_token');

  // --- FETCH ROOMS ---
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/rooms/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Smart sorting: Handles "101", "102", "201" numerically
        const sorted = data.sort((a, b) => 
            a.room_number.toString().localeCompare(b.room_number.toString(), undefined, { numeric: true, sensitivity: 'base' })
        );
        setRooms(sorted);
      }
    } catch (err) { console.error("Fetch Error:", err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, []);

  // --- SUBMIT (CREATE / EDIT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = isEditing ? `${API_URL}/api/rooms/${editId}/` : `${API_URL}/api/rooms/`;
      const method = isEditing ? 'PATCH' : 'POST';

      // Ensure price is a number
      const payload = {
          ...formData,
          price_per_night: parseFloat(formData.price_per_night)
      };

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // alert(isEditing ? "Room Updated!" : "Room Added!"); // Optional: removed for smoother UX
        setShowModal(false);
        resetForm();
        fetchRooms();
      } else {
        alert("Failed to save room. Please check your inputs.");
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  // --- DELETE ROOM ---
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this room?")) return;
    try {
        await fetch(`${API_URL}/api/rooms/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchRooms();
    } catch(err) { console.error(err); }
  };

  // --- QUICK STATUS CHANGE ---
  const handleStatusChange = async (roomId, newStatus) => {
    // Optimistic UI Update: Update list immediately before server response
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
    
    try {
        await fetch(`${API_URL}/api/rooms/${roomId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
    } catch(err) {
        console.error(err);
        fetchRooms(); // Revert on error
    }
  };

  const openEdit = (room) => {
    setFormData({ 
        room_number: room.room_number, 
        room_type: room.room_type, 
        price_per_night: room.price_per_night, 
        status: room.status 
    });
    setEditId(room.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ room_number: '', room_type: 'SINGLE', price_per_night: '', status: 'AVAILABLE' });
    setIsEditing(false);
    setEditId(null);
  };

  // --- UI HELPERS ---
  const getStatusDesign = (status) => {
    switch(status?.toUpperCase()) {
      case 'AVAILABLE': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle };
      case 'OCCUPIED': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: User };
      case 'DIRTY': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Brush };
      case 'MAINTENANCE': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: Wrench };
      default: return { color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', icon: AlertCircle };
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.room_number.toString().toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === filter;
  });

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600" size={32}/> <span className="ml-2 font-bold text-slate-400">Loading Inventory...</span></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Inventory Management</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Rooms: {rooms.length}</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search Room No..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus size={18} /> Add Room
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                filter === f 
                ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredRooms.map(room => {
          const design = getStatusDesign(room.status);
          const StatusIcon = design.icon;
          
          return (
            <div key={room.id} className={`bg-white p-6 rounded-[32px] border-2 transition-all hover:-translate-y-1 hover:shadow-xl group relative ${design.border}`}>
              
              {/* Top Row: Icon & Menu */}
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${design.bg} ${design.color}`}>
                    <StatusIcon size={24}/>
                </div>
                
                {/* Menu Dropdown */}
                <div className="relative group/menu">
                    <button className="p-2 -mr-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreVertical size={20}/>
                    </button>
                    <div className="absolute right-0 top-8 bg-white shadow-2xl rounded-xl p-2 border border-slate-100 hidden group-hover/menu:block z-20 w-32 animate-in fade-in zoom-in duration-200">
                        <button onClick={() => openEdit(room)} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                            <Edit3 size={14}/> Edit
                        </button>
                        <button onClick={() => handleDelete(room.id)} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2">
                            <Trash2 size={14}/> Delete
                        </button>
                    </div>
                </div>
              </div>

              {/* Room Details */}
              <div className="mb-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">RM {room.room_number}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                    <BedDouble size={12}/> {room.room_type}
                </p>
              </div>

              {/* Footer: Price & Quick Action */}
              <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-auto">
                <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${design.color}`}>{room.status}</span>
                    <p className="text-lg font-black text-slate-900 tracking-tight mt-1">₹{parseFloat(room.price_per_night).toLocaleString()}</p>
                </div>
                
                {/* Quick Action Button based on status */}
                <div>
                    {room.status === 'DIRTY' && (
                        <button onClick={() => handleStatusChange(room.id, 'AVAILABLE')} title="Mark Clean" className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors">
                            <CheckCircle size={18}/>
                        </button>
                    )}
                    {room.status === 'AVAILABLE' && (
                        <button onClick={() => handleStatusChange(room.id, 'MAINTENANCE')} title="Mark Maintenance" className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors">
                            <Wrench size={18}/>
                        </button>
                    )}
                    {room.status === 'MAINTENANCE' && (
                        <button onClick={() => handleStatusChange(room.id, 'AVAILABLE')} title="Mark Available" className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors">
                            <CheckCircle size={18}/>
                        </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-[30px] shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">{isEditing ? 'Edit Room' : 'Add New Room'}</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Number</label>
                        <input required type="text" placeholder="e.g. 101" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Type</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={formData.room_type} onChange={e => setFormData({...formData, room_type: e.target.value})}>
                            <option value="SINGLE">Single</option>
                            <option value="DOUBLE">Double</option>
                            <option value="SUITE">Suite</option>
                            <option value="DELUXE">Deluxe</option>
                            <option value="DORM">Dormitory</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price Per Night (₹)</label>
                        <input required type="number" placeholder="e.g. 2500" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={formData.price_per_night} onChange={e => setFormData({...formData, price_per_night: e.target.value})} />
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={20}/> : (isEditing ? 'Save Changes' : 'Create Room')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;