import { useEffect, useState } from 'react';
import { 
  CheckCircle, LogIn, LogOut, User, 
  Briefcase, ArrowRight, Bell, Grid, List, 
  AlertTriangle, Clock, Calendar, Search, BedDouble
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 

const FrontDesk = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MATRIX'); // MATRIX, ARRIVALS, DEPARTURES, IN_HOUSE

  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const todayStr = new Date().toISOString().split('T')[0];

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch All Rooms (For Matrix)
      const roomRes = await fetch(`${API_URL}/api/rooms/`, { headers });
      
      // 2. Fetch All Active/Today Bookings (For Lists)
      const bookingRes = await fetch(`${API_URL}/api/bookings/`, { headers });

      if (roomRes.ok) setRooms(await roomRes.json());
      if (bookingRes.ok) setBookings(await bookingRes.json());

    } catch (err) { 
      console.error("Front Desk Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---
  const updateBookingStatus = async (id, newStatus) => {
    if(!window.confirm(`Confirm: Mark guest as ${newStatus}?`)) return;
    try {
      // 1. Update Booking
      await fetch(`${API_URL}/api/bookings/${id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      // 2. If Checking Out, use special endpoint to handle room status & charges if needed
      if (newStatus === 'CHECKED_OUT') {
          await fetch(`${API_URL}/api/bookings/${id}/checkout/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
      }

      fetchData(); // Refresh all data
      alert("Status Updated Successfully! ✅");
    } catch (err) { console.error(err); }
  };

  const markRoomClean = async (id) => {
    try {
        await fetch(`${API_URL}/api/rooms/${id}/mark-clean/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
    } catch (err) { console.error(err); }
  };

  // --- DATA PROCESSING ---
  // Map Room ID -> Active Booking (For Matrix Guest Names)
  const activeBookingsMap = {};
  bookings.filter(b => b.status === 'CHECKED_IN').forEach(b => {
      if(b.room) activeBookingsMap[b.room] = b;
  });

  // Filter Lists
  const arrivals = bookings.filter(b => b.check_in_date.startsWith(todayStr) && b.status === 'CONFIRMED');
  const departures = bookings.filter(b => b.check_out_date.startsWith(todayStr) && b.status === 'CHECKED_IN');
  const inHouse = bookings.filter(b => b.status === 'CHECKED_IN');

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center animate-pulse">
            <Grid size={48} className="mx-auto text-blue-300 mb-4"/>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading Reception...</p>
        </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Front Desk</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Live Operations Control</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-600 flex items-center gap-2">
          <Calendar size={16} className="text-blue-500"/> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 🔹 TABS NAVIGATION */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('MATRIX')}
          className={`flex-1 min-w-[200px] p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
            activeTab === 'MATRIX' ? 'border-slate-800 bg-slate-900 text-white shadow-lg' : 'border-white bg-white text-slate-400 hover:border-slate-200'
          }`}
        >
          <div className={`p-3 rounded-xl ${activeTab === 'MATRIX' ? 'bg-white/10' : 'bg-slate-50 text-slate-900'}`}><Grid size={24}/></div>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Live View</div>
            <div className="text-xl font-black">Room Matrix</div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('ARRIVALS')}
          className={`flex-1 min-w-[200px] p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
            activeTab === 'ARRIVALS' ? 'border-green-500 bg-green-50 text-green-700 shadow-lg' : 'border-white bg-white text-slate-400 hover:border-green-200'
          }`}
        >
          <div className={`p-3 rounded-xl ${activeTab === 'ARRIVALS' ? 'bg-green-200' : 'bg-slate-50 text-green-600'}`}><LogIn size={24}/></div>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Arrivals</div>
            <div className="text-xl font-black">{arrivals.length} Guests</div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('DEPARTURES')}
          className={`flex-1 min-w-[200px] p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
            activeTab === 'DEPARTURES' ? 'border-red-500 bg-red-50 text-red-700 shadow-lg' : 'border-white bg-white text-slate-400 hover:border-red-200'
          }`}
        >
          <div className={`p-3 rounded-xl ${activeTab === 'DEPARTURES' ? 'bg-red-200' : 'bg-slate-50 text-red-600'}`}><LogOut size={24}/></div>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Departures</div>
            <div className="text-xl font-black">{departures.length} Guests</div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('IN_HOUSE')}
          className={`flex-1 min-w-[200px] p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
            activeTab === 'IN_HOUSE' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg' : 'border-white bg-white text-slate-400 hover:border-blue-200'
          }`}
        >
          <div className={`p-3 rounded-xl ${activeTab === 'IN_HOUSE' ? 'bg-blue-200' : 'bg-slate-50 text-blue-600'}`}><Briefcase size={24}/></div>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">In-House</div>
            <div className="text-xl font-black">{inHouse.length} Active</div>
          </div>
        </button>
      </div>

      {/* 🏢 VIEW 1: LIVE ROOM MATRIX */}
      {activeTab === 'MATRIX' && (
        <div className="animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {rooms.map(room => {
                    const activeBooking = activeBookingsMap[room.id];
                    let statusColor = "bg-white border-slate-200";
                    let icon = <CheckCircle size={18} className="text-green-400"/>;
                    let textColor = "text-slate-800";

                    if (room.status === 'OCCUPIED') {
                        statusColor = "bg-blue-600 border-blue-600 shadow-xl shadow-blue-200";
                        icon = <User size={18} className="text-white"/>;
                        textColor = "text-white";
                    } else if (room.status === 'DIRTY') {
                        statusColor = "bg-orange-50 border-orange-200";
                        icon = <AlertTriangle size={18} className="text-orange-500"/>;
                    }

                    return (
                        <div 
                            key={room.id}
                            className={`p-6 rounded-[28px] border-2 relative group transition-all hover:scale-[1.02] cursor-pointer ${statusColor}`}
                            onClick={() => {
                                if(room.status === 'OCCUPIED' && activeBooking) navigate(`/folio/${activeBooking.id}`);
                                if(room.status === 'DIRTY' && window.confirm("Mark Clean?")) markRoomClean(room.id);
                            }}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className={`text-3xl font-black tracking-tighter ${textColor}`}>{room.room_number}</span>
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">{icon}</div>
                            </div>
                            
                            <div className="space-y-1">
                                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-80 ${textColor}`}>
                                    {room.room_type}
                                </p>
                                {room.status === 'OCCUPIED' && activeBooking ? (
                                    <div className="mt-2 pt-2 border-t border-white/20">
                                        <p className="text-xs font-bold truncate text-white">{activeBooking.guest_details?.full_name}</p>
                                        <p className="text-[9px] font-medium opacity-70">Out: {activeBooking.check_out_date}</p>
                                    </div>
                                ) : (
                                    <p className={`text-xs font-bold mt-2 ${room.status === 'DIRTY' ? 'text-orange-600' : 'text-green-600'}`}>
                                        {room.status === 'AVAILABLE' ? 'READY' : room.status}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* 📋 VIEW 2: OPERATIONAL LISTS (Arrivals, Departures, In-House) */}
      {activeTab !== 'MATRIX' && (
        <div className="bg-white rounded-[30px] shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-6">Guest Name</th>
                <th className="p-6">Room / Type</th>
                <th className="p-6">Contact</th>
                <th className="p-6">Dates</th>
                <th className="p-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(activeTab === 'ARRIVALS' ? arrivals : activeTab === 'DEPARTURES' ? departures : inHouse).length > 0 ? 
                (activeTab === 'ARRIVALS' ? arrivals : activeTab === 'DEPARTURES' ? departures : inHouse).map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-6">
                    <div className="font-bold text-slate-800 text-base">{b.guest_details?.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ref: #{b.id}</div>
                  </td>
                  <td className="p-6">
                    {b.room_details?.room_number ? (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-black text-xs uppercase tracking-widest">
                            RM {b.room_details.room_number}
                        </span>
                    ) : <span className="text-slate-400 text-xs italic">Unassigned</span>}
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{b.room_type_name || b.room_details?.room_type}</div>
                  </td>
                  <td className="p-6 font-medium text-slate-500">
                    {b.guest_details?.phone || 'N/A'}
                  </td>
                  <td className="p-6 text-xs font-bold text-slate-500">
                    {b.check_in_date} <span className="text-slate-300 mx-1">➜</span> {b.check_out_date}
                  </td>
                  <td className="p-6 text-right">
                    {activeTab === 'ARRIVALS' && (
                      <button 
                        onClick={() => updateBookingStatus(b.id, 'CHECKED_IN')}
                        className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-700 shadow-md shadow-green-100 flex items-center gap-2 ml-auto"
                      >
                        <LogIn size={14}/> Check In
                      </button>
                    )}
                    {activeTab === 'DEPARTURES' && (
                      <button 
                        onClick={() => updateBookingStatus(b.id, 'CHECKED_OUT')}
                        className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 shadow-md shadow-red-100 flex items-center gap-2 ml-auto"
                      >
                        <LogOut size={14}/> Check Out
                      </button>
                    )}
                    {activeTab === 'IN_HOUSE' && (
                      <button 
                        onClick={() => navigate(`/folio/${b.id}`)}
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-100 ml-auto"
                      >
                        View Folio
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">No guests found for this category.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default FrontDesk;