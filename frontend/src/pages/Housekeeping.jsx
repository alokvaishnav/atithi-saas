import { useEffect, useState } from 'react';
import { 
  Sparkles, Trash2, ShieldAlert, CheckCircle, 
  RefreshCcw, Hammer, Eraser, Filter 
} from 'lucide-react';
import { API_URL } from '../config';

const Housekeeping = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DIRTY, MAINTENANCE
  const token = localStorage.getItem('access_token');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL + '/api/rooms/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Housekeeping fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (roomId, newStatus) => {
    try {
      // Using the specialized 'mark-clean' endpoint if setting to AVAILABLE
      const endpoint = newStatus === 'AVAILABLE' 
        ? `${API_URL}/api/rooms/${roomId}/mark-clean/` 
        : `${API_URL}/api/rooms/${roomId}/`;
      
      const method = newStatus === 'AVAILABLE' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method: method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: newStatus === 'AVAILABLE' ? null : JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        // Optimistic UI update: local state change before re-fetching
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
        fetchRooms(); 
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const filteredRooms = rooms.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  if (loading && rooms.length === 0) return (
    <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest">
      Loading Cleaning Manifesto...
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Housekeeping Control</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Property Health & Hygiene Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['ALL', 'DIRTY', 'MAINTENANCE'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={fetchRooms} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ROOM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredRooms.length > 0 ? filteredRooms.map(room => (
          <div key={room.id} className={`group p-8 rounded-[32px] border-2 transition-all duration-300 ${
            room.status === 'DIRTY' ? 'border-orange-100 bg-white' : 
            room.status === 'MAINTENANCE' ? 'border-red-100 bg-white' : 
            'border-white bg-white shadow-sm opacity-60 grayscale-[0.5]'
          }`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">RM {room.room_number}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{room.room_type}</p>
              </div>
              <StatusBadge status={room.status} />
            </div>
            
            <div className="space-y-3 mt-10">
              {room.status !== 'AVAILABLE' && (
                <button 
                  onClick={() => updateStatus(room.id, 'AVAILABLE')}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 rounded-2xl text-xs font-black text-white hover:bg-green-600 transition-all shadow-lg shadow-green-100 uppercase tracking-widest"
                >
                  <Sparkles size={16}/> Ready for Guest
                </button>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => updateStatus(room.id, 'DIRTY')}
                  className={`flex items-center justify-center gap-2 py-3 border-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    room.status === 'DIRTY' ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-orange-200 hover:text-orange-500'
                  }`}
                >
                  <Eraser size={14}/> Dirty
                </button>
                <button 
                  onClick={() => updateStatus(room.id, 'MAINTENANCE')}
                  className={`flex items-center justify-center gap-2 py-3 border-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    room.status === 'MAINTENANCE' ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-500'
                  }`}
                >
                  <Hammer size={14}/> Repair
                </button>
              </div>
            </div>

            {room.status === 'OCCUPIED' && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black text-center uppercase tracking-widest">
                    Guest In-House
                </div>
            )}
          </div>
        )) : (
            <div className="col-span-full py-40 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <CheckCircle size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-300 font-black uppercase tracking-[0.3em] italic">No Rooms match this filter</p>
            </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    'AVAILABLE': 'text-green-600 bg-green-50 border-green-100',
    'DIRTY': 'text-orange-600 bg-orange-50 border-orange-100',
    'MAINTENANCE': 'text-red-600 bg-red-50 border-red-100',
    'OCCUPIED': 'text-blue-600 bg-blue-50 border-blue-100'
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[status]}`}>
      {status}
    </span>
  );
};

export default Housekeeping;