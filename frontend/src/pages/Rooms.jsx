import { useEffect, useState } from 'react';
import { 
  Plus, Search, BedDouble, Trash2, Edit3, 
  CheckCircle, Loader2, MoreVertical, X, Wrench, 
  AlertCircle, User, Brush, Wifi, Tv, Wind, Coffee,
  Layers, Users, BarChart3, Trash
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 

const Rooms = () => {
  const { token, role, user } = useAuth(); 
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  const [floorFilter, setFloorFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // 🛡️ SECURITY: Only Owners and Managers can Add/Edit/Delete rooms
  const isAdmin = ['OWNER', 'MANAGER'].includes(role) || user?.is_superuser;

  // Form Data
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'SINGLE',
    price_per_night: '',
    floor: '1',
    capacity: '2',
    status: 'AVAILABLE',
    amenities: [] 
  });

  const AMENITY_OPTIONS = [
    { id: 'WIFI', label: 'Free WiFi', icon: Wifi },
    { id: 'AC', label: 'Air Con', icon: Wind },
    { id: 'TV', label: 'Smart TV', icon: Tv },
    { id: 'COFFEE', label: 'Coffee', icon: Coffee },
  ];

  // --- FETCH ROOMS ---
  const fetchRooms = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/rooms/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a, b) => 
            a.room_number.toString().localeCompare(b.room_number.toString(), undefined, { numeric: true, sensitivity: 'base' })
        );
        setRooms(sorted);
      }
    } catch (err) { console.error("Fetch Error:", err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, [token]);

  // --- STATS CALCULATION ---
  const stats = {
      total: rooms.length,
      occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
      available: rooms.filter(r => r.status === 'AVAILABLE').length,
      dirty: rooms.filter(r => r.status === 'DIRTY').length,
      maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
      occupancyRate: rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'OCCUPIED').length / rooms.length) * 100) : 0
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = isEditing ? `${API_URL}/api/rooms/${editId}/` : `${API_URL}/api/rooms/`;
      const method = isEditing ? 'PATCH' : 'POST';

      const payload = {
          ...formData,
          price_per_night: parseFloat(formData.price_per_night),
          capacity: parseInt(formData.capacity),
          amenities: formData.amenities 
      };

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchRooms();
      } else {
        alert("Failed to save room. Please check your inputs.");
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  // --- ACTIONS ---
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

  const handleStatusChange = async (roomId, newStatus) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
    try {
        await fetch(`${API_URL}/api/rooms/${roomId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
    } catch(err) { fetchRooms(); }
  };

  const openEdit = (room) => {
    setFormData({ 
        room_number: room.room_number, 
        room_type: room.room_type, 
        price_per_night: room.price_per_night, 
        floor: room.floor || '1',
        capacity: room.capacity || '2',
        status: room.status,
        amenities: room.amenities || []
    });
    setEditId(room.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const toggleAmenity = (amenityId) => {
      setFormData(prev => {
          const current = prev.amenities || [];
          if (current.includes(amenityId)) {
              return { ...prev, amenities: current.filter(id => id !== amenityId) };
          } else {
              return { ...prev, amenities: [...current, amenityId] };
          }
      });
  };

  const resetForm = () => {
    setFormData({ room_number: '', room_type: 'SINGLE', price_per_night: '', floor: '1', capacity: '2', status: 'AVAILABLE', amenities: [] });
    setIsEditing(false);
    setEditId(null);
  };

  // --- UI HELPERS ---
  const getStatusDesign = (status) => {
    switch(status?.toUpperCase()) {
      case 'AVAILABLE': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, label: 'Available' };
      case 'OCCUPIED': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: User, label: 'Occupied' };
      case 'DIRTY': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Brush, label: 'Cleaning' };
      case 'MAINTENANCE': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: Wrench, label: 'Repairs' };
      default: return { color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', icon: AlertCircle, label: 'Unknown' };
    }
  };

  const uniqueFloors = [...new Set(rooms.map(r => r.floor || '1'))].sort();

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.room_number.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesFloor = floorFilter === 'ALL' || r.floor === floorFilter;
    return matchesSearch && matchesStatus && matchesFloor;
  });

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600" size={32}/> <span className="ml-2 font-bold text-slate-400">Loading Inventory...</span></div>;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* 1. ANALYTICS DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BedDouble size={20}/></div>
              <div><p className="text-2xl font-black text-slate-800">{stats.total}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Total Rooms</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={20}/></div>
              <div><p className="text-2xl font-black text-slate-800">{stats.available}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Available</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Brush size={20}/></div>
              <div><p className="text-2xl font-black text-slate-800">{stats.dirty}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Needs Cleaning</p></div>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg flex items-center gap-3 text-white">
              <div className="p-3 bg-white/10 rounded-xl"><BarChart3 size={20}/></div>
              <div><p className="text-2xl font-black">{stats.occupancyRate}%</p><p className="text-[10px] font-bold text-slate-400 uppercase">Occupancy</p></div>
          </div>
      </div>

      {/* 2. CONTROLS HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Inventory</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Manage Rooms & Status</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          {/* Floor Filter */}
          <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <select 
                className="pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-xs outline-none focus:border-blue-500 appearance-none min-w-[120px]"
                value={floorFilter} onChange={e => setFloorFilter(e.target.value)}
              >
                  <option value="ALL">All Floors</option>
                  {uniqueFloors.map(f => <option key={f} value={f}>Floor {f}</option>)}
              </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search Room..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          {/* 🛡️ ADD BUTTON: Hidden for non-admins */}
          {isAdmin && (
            <button 
                onClick={() => { resetForm(); setShowModal(true); }} 
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
            >
                <Plus size={18} /> Add Room
            </button>
          )}
        </div>
      </div>

      {/* 3. STATUS TABS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'].map(f => (
          <button 
            key={f} 
            onClick={() => setStatusFilter(f)} 
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                statusFilter === f 
                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 4. ROOM GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredRooms.map(room => {
          const design = getStatusDesign(room.status);
          const StatusIcon = design.icon;
          
          return (
            <div key={room.id} className={`bg-white p-5 rounded-[24px] border-2 transition-all hover:-translate-y-1 hover:shadow-xl group relative flex flex-col ${design.border}`}>
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-lg flex items-center gap-2 ${design.bg} ${design.color}`}>
                    <StatusIcon size={14}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">{design.label}</span>
                </div>
                
                {/* 🛡️ CONTEXT MENU: Hidden for non-admins */}
                {isAdmin && (
                    <div className="relative group/menu">
                        <button className="p-1 text-slate-300 hover:text-slate-600"><MoreVertical size={18}/></button>
                        <div className="absolute right-0 top-6 bg-white shadow-xl rounded-xl p-1 border border-slate-100 hidden group-hover/menu:block z-20 w-32 animate-in fade-in zoom-in duration-200">
                            <button onClick={() => openEdit(room)} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                <Edit3 size={14}/> Edit
                            </button>
                            <button onClick={() => handleDelete(room.id)} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2">
                                <Trash2 size={14}/> Delete
                            </button>
                        </div>
                    </div>
                )}
              </div>

              {/* Room Info */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{room.room_number}</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Flr {room.floor || 1}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                    {room.room_type}
                </p>
              </div>

              {/* Amenities & Capacity */}
              <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1 text-slate-400" title="Capacity">
                      <Users size={14}/> <span className="text-xs font-bold">{room.capacity || 2}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200"></div>
                  <div className="flex gap-2">
                      {room.amenities?.includes('WIFI') && <Wifi size={14} className="text-slate-400"/>}
                      {room.amenities?.includes('TV') && <Tv size={14} className="text-slate-400"/>}
                      {room.amenities?.includes('AC') && <Wind size={14} className="text-slate-400"/>}
                  </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto border-t border-slate-100 pt-4 flex justify-between items-center">
                <p className="text-lg font-black text-slate-900 tracking-tight">₹{parseFloat(room.price_per_night).toLocaleString()}</p>
                
                {/* Quick Actions (Allowed for all users who can view the page) */}
                {room.status === 'DIRTY' && (
                    <button onClick={() => handleStatusChange(room.id, 'AVAILABLE')} title="Mark Clean" className="bg-emerald-100 text-emerald-700 p-2 rounded-xl hover:bg-emerald-200 transition-colors">
                        <Brush size={16}/>
                    </button>
                )}
                {room.status === 'AVAILABLE' && (
                    <button onClick={() => handleStatusChange(room.id, 'MAINTENANCE')} title="Report Issue" className="bg-slate-100 text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-colors">
                        <Wrench size={16}/>
                    </button>
                )}
                 {room.status === 'MAINTENANCE' && (
                    <button onClick={() => handleStatusChange(room.id, 'AVAILABLE')} title="Fix Complete" className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition-colors">
                        <CheckCircle size={16}/>
                    </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-lg animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase italic">{isEditing ? 'Edit Room' : 'New Room'}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Details & Configuration</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Room Number</label>
                            <input required type="text" placeholder="101" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Floor</label>
                            <input required type="number" placeholder="1" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Room Type</label>
                            <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                value={formData.room_type} onChange={e => setFormData({...formData, room_type: e.target.value})}>
                                <option value="SINGLE">Single</option>
                                <option value="DOUBLE">Double</option>
                                <option value="SUITE">Suite</option>
                                <option value="DELUXE">Deluxe</option>
                                <option value="DORM">Dormitory</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Max Capacity</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                                <input required type="number" className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                    value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Price Per Night (₹)</label>
                        <input required type="number" placeholder="2500" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-lg transition-all" 
                            value={formData.price_per_night} onChange={e => setFormData({...formData, price_per_night: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Amenities</label>
                        <div className="grid grid-cols-2 gap-3">
                            {AMENITY_OPTIONS.map((item) => {
                                const Icon = item.icon;
                                const isSelected = formData.amenities?.includes(item.id);
                                return (
                                    <button 
                                        type="button"
                                        key={item.id}
                                        onClick={() => toggleAmenity(item.id)}
                                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                            isSelected 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <Icon size={18}/>
                                        <span className="text-xs font-bold uppercase">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20"
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