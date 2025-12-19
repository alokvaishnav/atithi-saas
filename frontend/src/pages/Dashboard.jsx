import { useEffect, useState } from 'react';
import { 
  Building, Users, Loader2, LogIn, LogOut, 
  CheckCircle, XCircle, AlertTriangle, Briefcase 
} from 'lucide-react'; 
import { API_URL } from '../config'; 

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('access_token');

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resRooms, resBookings] = await Promise.all([
        fetch(API_URL + '/api/rooms/', { headers }),
        fetch(API_URL + '/api/bookings/', { headers })
      ]);

      // 🛡️ SAFETY CHECK: Only set data if request was successful
      if (resRooms.ok) {
        const data = await resRooms.json();
        setRooms(Array.isArray(data) ? data : []); // Ensure it's an array
      } else {
        console.error("Failed to fetch rooms:", resRooms.status);
        setRooms([]); // Fallback to empty
      }

      if (resBookings.ok) {
        const data = await resBookings.json();
        setBookings(Array.isArray(data) ? data : []); // Ensure it's an array
      } else {
        console.error("Failed to fetch bookings:", resBookings.status);
        setBookings([]); // Fallback to empty
      }

    } catch (err) { 
      console.error("Error fetching dashboard data:", err);
      setRooms([]);
      setBookings([]);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🧮 CALCULATE STATS (With Safety Checks)
  const todayStr = new Date().toISOString().split('T')[0];

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  // 1. Expected Arrivals (Check-in Today)
  const expectedArrivals = safeBookings.filter(b => b.check_in_date === todayStr && b.status === 'CONFIRMED');

  // 2. Expected Departures (Check-out Today)
  const expectedDepartures = safeBookings.filter(b => b.check_out_date === todayStr && b.status === 'CHECKED_IN');

  // 3. Room Status Counts
  const totalRooms = safeRooms.length;
  const occupiedRooms = safeRooms.filter(r => r.status === 'OCCUPIED').length;
  const dirtyVacant = safeRooms.filter(r => r.status === 'DIRTY').length; 
  const cleanVacant = safeRooms.filter(r => r.status === 'AVAILABLE').length; 
  const rmsToSell = cleanVacant + dirtyVacant; 

  if (loading) return <div className="p-8 flex items-center text-blue-600"><Loader2 className="animate-spin mr-2"/> Loading Dashboard...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Welcome back, ADMIN</p>
      </div>

      {/* 📊 TOP STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        
        {/* Card 1: Rooms to Sell */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-teal-400 flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-teal-50 text-teal-500 mb-2"><Building size={24}/></div>
          <div className="text-2xl font-bold text-slate-800">{rmsToSell}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">RMS TO SELL</div>
        </div>

        {/* Card 2: Total Occupancy */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-purple-500 flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mb-2"><Briefcase size={24}/></div>
          <div className="text-2xl font-bold text-slate-800">{occupiedRooms}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL OCC</div>
        </div>

        {/* Card 3: Dirty Vacant */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-yellow-400 flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-yellow-50 text-yellow-500 mb-2"><AlertTriangle size={24}/></div>
          <div className="text-2xl font-bold text-slate-800">{dirtyVacant}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">DIRTY VACANT</div>
        </div>

        {/* Card 4: Clean Vacant */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-green-500 flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-green-50 text-green-500 mb-2"><CheckCircle size={24}/></div>
          <div className="text-2xl font-bold text-slate-800">{cleanVacant}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">CLEAN VACANT</div>
        </div>

        {/* Card 5: Exp. Arrival */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-blue-500 flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-blue-50 text-blue-500 mb-2"><LogIn size={24}/></div>
          <div className="text-2xl font-bold text-slate-800">{expectedArrivals.length}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">EXP. ARR</div>
        </div>

        {/* Card 6: Exp. Departure */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-t-4 border-red-500 flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-red-50 text-red-500 mb-2"><LogOut size={24}/></div>
          <div className="text-2xl font-bold text-slate-800">{expectedDepartures.length}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">EXP. DEP</div>
        </div>

      </div>

      {/* 📋 SPLIT TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Expected Arrivals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <LogIn size={18} className="text-blue-500"/> Expected Arrival
            </h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{todayStr}</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-400 border-b">
              <tr><th className="p-3 font-medium">Reser. No</th><th className="p-3 font-medium">Guest Name</th><th className="p-3 font-medium">Room</th></tr>
            </thead>
            <tbody>
              {expectedArrivals.length > 0 ? expectedArrivals.map(b => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-blue-600 font-bold">#{b.id}</td>
                  <td className="p-3 font-medium text-slate-700">{b.guest_details?.full_name}</td>
                  <td className="p-3 text-slate-500">{b.room_details?.room_number || "Unassigned"}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="p-6 text-center text-slate-400 italic">No arrivals expected today.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Expected Departures */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <LogOut size={18} className="text-red-500"/> Expected Departure
            </h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">{todayStr}</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-400 border-b">
              <tr><th className="p-3 font-medium">Room</th><th className="p-3 font-medium">Guest Name</th><th className="p-3 font-medium">Balance</th></tr>
            </thead>
            <tbody>
              {expectedDepartures.length > 0 ? expectedDepartures.map(b => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-700">{b.room_details?.room_number}</td>
                  <td className="p-3 text-slate-600">{b.guest_details?.full_name}</td>
                  <td className="p-3 font-mono text-red-600 font-bold">₹{b.total_amount}</td> 
                </tr>
              )) : (
                <tr><td colSpan="3" className="p-6 text-center text-slate-400 italic">No departures expected today.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;