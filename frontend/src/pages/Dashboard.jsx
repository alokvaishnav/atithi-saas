import { useEffect, useState } from 'react';
// 👇 FIXED: Imported Sparkles, Removed Broom
import { IndianRupee, BedDouble, CalendarCheck, LogOut, Loader2, User, Wrench, Sparkles } from 'lucide-react'; 
import { API_URL } from '../config'; 

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('access_token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const roomRes = await fetch(API_URL + '/api/rooms/', { headers: { 'Authorization': `Bearer ${token}` } });
      const bookingRes = await fetch(API_URL + '/api/bookings/', { headers: { 'Authorization': `Bearer ${token}` } });

      if (!roomRes.ok || !bookingRes.ok) throw new Error("Failed to fetch data");

      setRooms(await roomRes.json());
      setBookings(await bookingRes.json());
    } catch (err) {
      console.error("Error:", err);
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateRoomStatus = async (roomId, newStatus) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r));

    try {
      const response = await fetch(API_URL + `/api/rooms/${roomId}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        alert("Failed to update status on server.");
        fetchData(); 
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCheckOut = async (roomId) => {
    if (!window.confirm("Guest is leaving? Mark room as DIRTY?")) return;
    updateRoomStatus(roomId, 'DIRTY');
  };

  const getGuestName = (roomId) => {
    const activeBooking = bookings.find(b => b.room === roomId && b.status !== 'CHECKED_OUT');
    return activeBooking?.guest_details?.full_name || "Unknown Guest";
  };

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth(), i);
      const dateString = currentDate.toISOString().split('T')[0];
      const dailyBookings = bookings.filter(b => dateString >= b.check_in_date && dateString < b.check_out_date);

      days.push(
        <div key={i} className="border border-slate-100 p-2 min-h-[80px] bg-white rounded flex flex-col items-center justify-between hover:shadow-md transition-shadow">
          <span className={`text-sm font-bold ${dateString === new Date().toISOString().split('T')[0] ? 'text-blue-600 bg-blue-100 px-2 rounded-full' : 'text-slate-400'}`}>{i}</span>
          {dailyBookings.length > 0 ? (
            <div className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded w-full text-center font-bold mt-1">{dailyBookings.length} Booked</div>
          ) : ( <div className="text-[10px] text-green-500 font-medium mt-1">Available</div> )}
        </div>
      );
    }
    return days;
  };

  const totalRooms = rooms?.length || 0;
  const totalBookings = bookings?.length || 0;
  const totalRevenue = bookings?.reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0) || 0;

  const getStatusColor = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700 border-green-200';
      case 'OCCUPIED': return 'bg-red-100 text-red-700 border-red-200';
      case 'DIRTY': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'MAINTENANCE': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-blue-600"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
  if (error) return <div className="p-8 text-red-600 font-bold">{error}</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-green-100 rounded-full text-green-600"><IndianRupee size={28} /></div>
          <div><p className="text-sm text-slate-500">Revenue</p><h3 className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600"><CalendarCheck size={28} /></div>
          <div><p className="text-sm text-slate-500">Bookings</p><h3 className="text-2xl font-bold text-slate-800">{totalBookings}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-purple-100 rounded-full text-purple-600"><BedDouble size={28} /></div>
          <div><p className="text-sm text-slate-500">Rooms</p><h3 className="text-2xl font-bold text-slate-800">{totalRooms}</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
           <h2 className="text-xl font-bold text-slate-800 mb-4">Housekeeping & Status</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {rooms.map(room => (
               <div key={room.id} className={`p-5 rounded-xl shadow-sm border-2 relative group bg-white ${getStatusColor(room.status).split(' ')[2]}`}>
                 
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-slate-800">Room {room.room_number}</h3>
                   <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(room.status)}`}>
                     {room.status}
                   </span>
                 </div>
                 
                 {room.status === 'OCCUPIED' ? (
                   <>
                     <div className="flex items-center gap-2 text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded">
                       <User size={14}/> <span className="font-semibold">{getGuestName(room.id)}</span>
                     </div>
                     <button onClick={() => handleCheckOut(room.id)} className="w-full bg-slate-800 text-white py-2 rounded text-sm hover:bg-slate-700 flex items-center justify-center gap-2">
                       <LogOut size={14} /> Check Out & Mark Dirty
                     </button>
                   </>
                 ) : (
                   <div className="flex gap-2 mt-4">
                     {room.status === 'DIRTY' && (
                       // 👇 FIXED: This was the problem. Now using Sparkles!
                       <button onClick={() => updateRoomStatus(room.id, 'AVAILABLE')} className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1">
                         <Sparkles size={14}/> Mark Clean
                       </button>
                     )}
                     
                     {room.status === 'MAINTENANCE' ? (
                        <button onClick={() => updateRoomStatus(room.id, 'AVAILABLE')} className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700">
                          Finish Repairs
                        </button>
                     ) : (
                        <button onClick={() => updateRoomStatus(room.id, 'MAINTENANCE')} className="bg-gray-200 text-gray-600 px-3 py-2 rounded text-sm hover:bg-gray-300" title="Mark for Maintenance">
                          <Wrench size={14}/>
                        </button>
                     )}
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">This Month</h2>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{new Date().toLocaleString('default', { month: 'long' })}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="grid grid-cols-5 gap-2">{renderCalendar()}</div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Dashboard;