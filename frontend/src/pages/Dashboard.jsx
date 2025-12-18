import { useEffect, useState } from 'react';
import { IndianRupee, BedDouble, CalendarCheck, LogOut } from 'lucide-react';
import { API_URL } from '../config'; // <--- Importing the Cloud URL

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Fetch Data
  const fetchData = () => {
    fetch(API_URL + '/api/rooms/')
      .then(res => res.json())
      .then(data => setRooms(data));

    fetch(API_URL + '/api/bookings/')
      .then(res => res.json())
      .then(data => setBookings(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🧹 HANDLE CHECK-OUT
  const handleCheckOut = async (roomId) => {
    if (!window.confirm("Are you sure the guest has left? This will make the room Available.")) return;

    try {
      const response = await fetch(API_URL + `/api/rooms/${roomId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' })
      });

      if (response.ok) {
        alert("Room is now Clean & Available! ✨");
        fetchData(); // Refresh the screen
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Stats Logic
  const totalRooms = rooms.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);

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

            {/* SHOW CHECK-OUT BUTTON ONLY IF OCCUPIED */}
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