import { useEffect, useState } from 'react';
import { 
  CheckCircle, LogIn, LogOut, User, 
  Briefcase, Grid, AlertTriangle, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

const FrontDesk = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MATRIX'); 

  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [roomRes, bookingRes] = await Promise.all([
          fetch(`${API_URL}/api/rooms/`, { headers }),
          fetch(`${API_URL}/api/bookings/`, { headers })
      ]);
      if (roomRes.ok) setRooms(await roomRes.json());
      if (bookingRes.ok) setBookings(await bookingRes.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateBookingStatus = async (id, newStatus) => {
    if(!window.confirm(`Confirm: Mark guest as ${newStatus}?`)) return;
    await fetch(`${API_URL}/api/bookings/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const markRoomClean = async (id) => {
    await fetch(`${API_URL}/api/rooms/${id}/mark-clean/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchData();
  };

  const activeBookingsMap = {};
  bookings.filter(b => b.status === 'CHECKED_IN').forEach(b => {
      if(b.room) activeBookingsMap[b.room] = b;
  });

  const arrivals = bookings.filter(b => b.check_in_date === todayStr && b.status === 'CONFIRMED');
  const departures = bookings.filter(b => b.check_out_date === todayStr && b.status === 'CHECKED_IN');
  const inHouse = bookings.filter(b => b.status === 'CHECKED_IN');

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold uppercase">Loading Reception...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Front Desk</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Live Operations Control</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
          <Calendar size={16} className="text-blue-500"/> {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        {['MATRIX', 'ARRIVALS', 'DEPARTURES', 'IN_HOUSE'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 min-w-[150px] p-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${activeTab === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-white'}`}>
                {t.replace('_', ' ')}
            </button>
        ))}
      </div>

      {activeTab === 'MATRIX' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {rooms.map(room => {
                const activeBooking = activeBookingsMap[room.id];
                let color = "bg-white border-slate-200";
                let icon = <CheckCircle size={18} className="text-green-400"/>;
                if (room.status === 'OCCUPIED') { color = "bg-blue-600 border-blue-600 text-white"; icon = <User size={18} className="text-white"/>; }
                else if (room.status === 'DIRTY') { color = "bg-orange-50 border-orange-200"; icon = <AlertTriangle size={18} className="text-orange-500"/>; }

                return (
                    <div key={room.id} className={`p-6 rounded-[28px] border-2 cursor-pointer transition-transform hover:scale-105 ${color}`}
                        onClick={() => {
                            if(room.status === 'OCCUPIED' && activeBooking) navigate(`/folio/${activeBooking.id}`);
                            if(room.status === 'DIRTY' && window.confirm("Mark Clean?")) markRoomClean(room.id);
                        }}>
                        <div className="flex justify-between items-start mb-6">
                            <span className="text-3xl font-black tracking-tighter">{room.room_number}</span>
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">{icon}</div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{room.room_type}</p>
                        {activeBooking && <p className="text-xs font-bold mt-2 truncate">{activeBooking.guest_details?.full_name}</p>}
                    </div>
                );
            })}
        </div>
      )}

      {activeTab !== 'MATRIX' && (
        <div className="bg-white rounded-[30px] border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <tr><th className="p-6">Guest</th><th className="p-6">Room</th><th className="p-6 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(activeTab === 'ARRIVALS' ? arrivals : activeTab === 'DEPARTURES' ? departures : inHouse).map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-6 font-bold text-slate-800">{b.guest_details?.full_name}</td>
                  <td className="p-6 font-bold text-slate-500">RM {b.room_details?.room_number || "NA"}</td>
                  <td className="p-6 text-right">
                    {activeTab === 'ARRIVALS' && <button onClick={() => updateBookingStatus(b.id, 'CHECKED_IN')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs">Check In</button>}
                    {activeTab === 'DEPARTURES' && <button onClick={() => updateBookingStatus(b.id, 'CHECKED_OUT')} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs">Check Out</button>}
                    {activeTab === 'IN_HOUSE' && <button onClick={() => navigate(`/folio/${b.id}`)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs">Folio</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FrontDesk;