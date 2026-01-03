import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { Loader2, CheckCircle, XCircle, RefreshCw, LogOut } from 'lucide-react';

const HousekeepingMobile = () => {
  const { token, logout, user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DIRTY, CLEAN

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRooms(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, [token]);

  const updateStatus = async (id, status) => {
    // Optimistic Update
    setRooms(rooms.map(r => r.id === id ? { ...r, status } : r));
    
    const endpoint = status === 'AVAILABLE' ? 'mark-clean' : 'mark-dirty';
    try {
        await fetch(`${API_URL}/api/rooms/${id}/${endpoint}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) { fetchRooms(); } // Revert on error
  };

  const filteredRooms = rooms.filter(r => {
      if (filter === 'DIRTY') return r.status === 'DIRTY';
      if (filter === 'CLEAN') return r.status === 'AVAILABLE';
      return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
      {/* Mobile Header */}
      <div className="bg-slate-900 text-white p-6 rounded-b-[30px] shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter">Housekeeping</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{user?.username}</p>
            </div>
            <button onClick={fetchRooms} className="p-2 bg-slate-800 rounded-full"><RefreshCw size={18}/></button>
        </div>
        
        {/* Status Tabs */}
        <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
            {['ALL', 'DIRTY', 'CLEAN'].map(f => (
                <button 
                    key={f} onClick={() => setFilter(f)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {loading ? <div className="col-span-2 text-center p-10"><Loader2 className="animate-spin mx-auto text-blue-600"/></div> : 
         filteredRooms.map(room => (
            <div key={room.id} className={`p-4 rounded-2xl border-2 shadow-sm flex flex-col justify-between h-40 transition-all ${room.status === 'DIRTY' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                <div>
                    <h2 className="text-3xl font-black text-slate-800">{room.room_number}</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{room.room_type}</p>
                </div>
                
                {room.status === 'DIRTY' ? (
                    <button onClick={() => updateStatus(room.id, 'AVAILABLE')} className="w-full py-3 bg-white border border-red-100 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
                        <XCircle size={16}/> Mark Clean
                    </button>
                ) : (
                    <button onClick={() => updateStatus(room.id, 'DIRTY')} className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        <CheckCircle size={16}/> Is Clean
                    </button>
                )}
            </div>
        ))}
      </div>
      
      {/* Logout Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
          <button onClick={logout} className="w-full py-3 text-slate-400 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2">
              <LogOut size={14}/> Sign Out
          </button>
      </div>
    </div>
  );
};

export default HousekeepingMobile;