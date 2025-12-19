import { useEffect, useState } from 'react';
import { IndianRupee, BedDouble, CalendarCheck, LogOut, Loader2, User } from 'lucide-react';
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
      
      // Fetch Rooms
      const roomRes = await fetch(API_URL + '/api/rooms/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch Bookings
      const bookingRes = await fetch(API_URL + '/api/bookings/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!roomRes.ok || !bookingRes.ok) throw new Error("Failed to fetch data");

      const roomData = await roomRes.json();
      const bookingData = await bookingRes.json();

      setRooms(roomData);
      setBookings(bookingData);
    } catch (err) {
      console.error("Error:", err);
      setError("Could not load dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckOut = async (roomId) => {
    if (!window.confirm("Are you sure the guest has left?")) return;

    try {
      const response = await fetch(API_URL + `/api/rooms/${roomId}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'AVAILABLE' })
      });

      if (response.ok) {
        alert("Room is now Clean & Available! ✨");
        fetchData(); 
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Helper to find who is in the room
  const getGuestName = (roomId) => {
    const activeBooking = bookings.find(b => b.room === roomId && b.status !== 'CHECKED_OUT');
    return activeBooking?.guest_details?.full_name || "Unknown Guest";
  };

  // 👇 NEW: CALENDAR LOGIC (Simple 30-Day View)
  const renderCalendar = () => {
    const today = new Date();
    // Get total days in current month (e.g., 30 or 31)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
      // Create date object for this specific day
      const currentDate = new Date(today.getFullYear(), today.getMonth(), i);
      const dateString = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Check how many bookings overlap with this date
      const dailyBookings = bookings.filter(b => 
        dateString >= b.check_in_date && dateString < b.check_out_date
      );

      days.push(
        <div key={i} className="border border-slate-100 p-2 min-h-[80px] bg-white rounded flex flex-col items-center justify-between hover:shadow-md transition-shadow">
          <span className={`text-sm font-bold ${
             dateString === new Date().toISOString().split('T')[0] ? 'text-blue-600 bg-blue-100 px-2 rounded-full' : 'text-slate-400'
          }`}>{i}</span>
          
          {dailyBookings.length > 0 ? (
            <div className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded w-full text-center font-bold mt-1">
              {dailyBookings.length} Booked
            </div>
          ) : (
             <div className="text-[10px] text-green-500 font-medium mt-1">Available</div>
          )}
        </div>
      );
    }
    return days;
  };

  // Stats
  const totalRooms = rooms?.length || 0;
  const totalBookings = bookings?.length || 0;
  const totalRevenue = bookings?.reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600">
        <Loader2 className="animate-spin mr-2" /> Loading Dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>
      
      {/* KPI Cards */}
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
        
        {/* LEFT COLUMN: LIVE ROOM STATUS */}
        <div className="lg:col-span-2">
           <h2 className="text-xl font-bold text-slate-800 mb-4">Live Room Status</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {rooms.map(room => (
               <div key={room.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative group">
                 
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-slate-800">Room {room.room_number}</h3>
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                     room.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                   }`}>
                     {room.status}
                   </span>
                 </div>
                 
                 {room.status === 'OCCUPIED' && (
                   <div className="flex items-center gap-2 text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded">
                     <User size={14}/> 
                     <span className="font-semibold">{getGuestName(room.id)}</span>
                   </div>
                 )}

                 {room.status === 'OCCUPIED' && (
                   <button 
                     onClick={() => handleCheckOut(room.id)}
                     className="w-full bg-slate-800 text-white py-2 rounded text-sm hover:bg-slate-700 flex items-center justify-center gap-2"
                   >
                     <LogOut size={14} /> Check Out
                   </button>
                 )}
               </div>
             ))}
           </div>
        </div>

        {/* RIGHT COLUMN: CALENDAR WIDGET */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">This Month</h2>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
              {new Date().toLocaleString('default', { month: 'long' })}
            </span>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            {/* Grid for days */}
            <div className="grid grid-cols-5 gap-2">
              {renderCalendar()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Dashboard;