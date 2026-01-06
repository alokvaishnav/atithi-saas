import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { Loader2, CheckCircle, XCircle, RefreshCw, LogOut, AlertCircle, Brush } from 'lucide-react';

const HousekeepingMobile = () => {
  const { token, logout, user } = useAuth();
  
  // --- STATE ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error Handling
  const [filter, setFilter] = useState('ALL'); // ALL, DIRTY, CLEAN

  // --- FETCH DATA ---
  const fetchRooms = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/rooms/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
          logout(); // Auto logout on session expiry
          return;
      }

      if (res.ok) {
          const data = await res.json();
          // Sort by room number for consistent display
          const sortedRooms = data.sort((a, b) => a.room_number - b.room_number);
          setRooms(sortedRooms);
      } else {
          setError("Failed to sync data.");
      }
    } catch (err) { 
        console.error(err); 
        setError("Network connection failed.");
    } finally { 
        setLoading(false); 
    }
  }, [token, logout]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // --- ACTIONS ---
  const updateStatus = async (id, status) => {
    // Optimistic Update: Update UI immediately before server responds
    const originalRooms = [...rooms];
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    
    const endpoint = status === 'AVAILABLE' ? 'mark-clean' : 'mark-dirty';
    
    try {
        const res = await fetch(`${API_URL}/api/rooms/${id}/${endpoint}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Sync failed");
    } catch (err) { 
        console.error(err);
        setRooms(originalRooms); // Revert UI on error
        alert("Could not update status. Check internet.");
    }
  };

  // --- FILTER LOGIC ---
  const filteredRooms = rooms.filter(r => {
      if (filter === 'DIRTY') return r.status === 'DIRTY';
      if (filter === 'CLEAN') return r.status === 'AVAILABLE';
      return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans select-none">
      
      {/* Mobile Header */}
      <div className="bg-slate-900 text-white p-6 rounded-b-[30px] shadow-xl sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <Brush size={18} className="text-blue-400"/> Housekeeping
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    User: {user?.username || 'Staff'}
                </p>
            </div>
            <button 
                onClick={fetchRooms} 
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all"
                disabled={loading}
            >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""}/>
            </button>
        </div>
        
        {/* Status Tabs */}
        <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl backdrop-blur-sm">
            {['ALL', 'DIRTY', 'CLEAN'].map(f => (
                <button 
                    key={f} onClick={() => setFilter(f)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        
        {/* Error Banner */}
        {error && (
            <div className="bg-red-100 text-red-600 p-4 rounded-2xl mb-4 flex items-center gap-3 text-sm font-bold border border-red-200">
                <AlertCircle size={20}/> {error}
            </div>
        )}

        {/* Loading State */}
        {loading && rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={40}/>
                <p className="text-xs font-bold uppercase tracking-widest">Syncing Rooms...</p>
            </div>
        ) : (
            /* Room Grid */
            <div className="grid grid-cols-2 gap-4">
                {filteredRooms.map(room => {
                    const isDirty = room.status === 'DIRTY';
                    return (
                        <div 
                            key={room.id} 
                            className={`p-5 rounded-[24px] border-2 shadow-sm flex flex-col justify-between h-44 transition-all active:scale-95 ${
                                isDirty 
                                ? 'bg-white border-red-100 shadow-red-100' 
                                : 'bg-white border-emerald-100 shadow-emerald-100'
                            }`}
                        >
                            <div>
                                <div className="flex justify-between items-start">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{room.room_number}</h2>
                                    <div className={`w-3 h-3 rounded-full ${isDirty ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 truncate">
                                    {room.room_type}
                                </p>
                            </div>
                            
                            {isDirty ? (
                                <button 
                                    onClick={() => updateStatus(room.id, 'AVAILABLE')} 
                                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 active:bg-red-100 transition-colors"
                                >
                                    <XCircle size={16}/> Mark Clean
                                </button>
                            ) : (
                                <div className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100 opacity-80">
                                    <CheckCircle size={16}/> Ready
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        {/* Empty State */}
        {!loading && filteredRooms.length === 0 && !error && (
            <div className="text-center py-20 text-slate-400">
                <CheckCircle className="mx-auto mb-4 opacity-20" size={48}/>
                <p className="font-bold uppercase tracking-widest text-xs">No rooms found</p>
            </div>
        )}
      </div>
      
      {/* Logout Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 safe-area-pb">
          <button 
            onClick={logout} 
            className="w-full py-4 text-slate-400 hover:text-red-500 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-colors"
          >
              <LogOut size={16}/> Sign Out
          </button>
      </div>
    </div>
  );
};

export default HousekeepingMobile;