import { useEffect, useState } from 'react';
import { Sparkles, Trash2, ShieldAlert, CheckCircle, RefreshCcw } from 'lucide-react';
import { API_URL } from '../config';

const Housekeeping = () => {
  const [rooms, setRooms] = useState([]);
  const token = localStorage.getItem('access_token');

  const fetchRooms = async () => {
    const res = await fetch(API_URL + '/api/rooms/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setRooms(data);
  };

  const updateStatus = async (roomId, newStatus) => {
    await fetch(`${API_URL}/api/rooms/${roomId}/`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ status: newStatus })
    });
    fetchRooms();
  };

  useEffect(() => { fetchRooms(); }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Housekeeping Control</h2>
        <p className="text-slate-500">Maintain room cleanliness and maintenance status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rooms.map(room => (
          <div key={room.id} className={`p-6 rounded-2xl border-2 transition-all ${
            room.status === 'DIRTY' ? 'border-orange-200 bg-orange-50' : 
            room.status === 'MAINTENANCE' ? 'border-red-200 bg-red-50' : 
            'border-white bg-white shadow-sm'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-black text-slate-800">Room {room.room_number}</h3>
              <StatusBadge status={room.status} />
            </div>
            
            <div className="space-y-2 mt-6">
              <button 
                onClick={() => updateStatus(room.id, 'AVAILABLE')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-green-600 hover:bg-green-600 hover:text-white transition"
              >
                <CheckCircle size={14}/> Mark Clean
              </button>
              <button 
                onClick={() => updateStatus(room.id, 'DIRTY')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-600 hover:text-white transition"
              >
                <Trash2 size={14}/> Mark Dirty
              </button>
              <button 
                onClick={() => updateStatus(room.id, 'MAINTENANCE')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition"
              >
                <ShieldAlert size={14}/> Maintenance
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    'AVAILABLE': 'text-green-600 bg-green-100',
    'DIRTY': 'text-orange-600 bg-orange-100',
    'MAINTENANCE': 'text-red-600 bg-red-100',
    'OCCUPIED': 'text-blue-600 bg-blue-100'
  };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${colors[status]}`}>{status}</span>;
};

export default Housekeeping;