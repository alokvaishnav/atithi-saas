import { useEffect, useState } from 'react';
import { IndianRupee, BedDouble, CalendarCheck, LogOut, Loader2, User } from 'lucide-react';
import { API_URL } from '../config'; 

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true); // <--- 1. LOADING STATE
  const [error, setError] = useState(null);     // <--- 2. ERROR STATE

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
      setLoading(false); // <--- Stop loading whether success or fail
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
    // Find a booking for this room that is still active (CONFIRMED/CHECKED_IN)
    // Note: This matches the room ID to the booking's room ID
    const activeBooking = bookings.find(b => b.room === roomId && b.status !== 'CHECKED_OUT');
    return activeBooking?.guest_details?.full_name || "Unknown Guest";
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
          <div><p className="text-sm text-slate-500">Total Revenue</p><h3 className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600"><CalendarCheck size={28} /></div>
          <div><p className="text-sm text-slate-500">Total Bookings</p><h3 className="text-2xl font-bold text-slate-800">{totalBookings}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-purple-100 rounded-full text-purple-600"><BedDouble size={28} /></div>
          <div><p className="text-sm text-slate-500">Total Rooms</p><h3 className="text-2xl font-bold text-slate-800">{totalRooms}</h3></div>
        </div>
      </div>

      {/* Room Grid */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Room Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative group">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Room {room.room_number}</h3>
                <p className="text-sm text-slate-500">{room.room_type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                room.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {room.status}
              </span>
            </div>
            
            <p className="text-2xl font-bold text-slate-900 mb-2">₹{room.price_per_night}</p>

            {/* 👇 SHOW GUEST NAME IF OCCUPIED */}
            {room.status === 'OCCUPIED' && (
              <div className="bg-slate-50 p-2 rounded mb-3 flex items-center gap-2 text-sm text-slate-600">
                <User size={14} /> 
                <span className="font-semibold">{getGuestName(room.id)}</span>
              </div>
            )}

            {room.status === 'OCCUPIED' && (
              <button 
                onClick={() => handleCheckOut(room.id)}
                className="w-full mt-2 bg-slate-800 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
              >
                <LogOut size={16} /> Check Out Guest
              </button>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;