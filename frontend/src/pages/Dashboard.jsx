import { useEffect, useState } from 'react';
import { 
  Building, Users, Loader2, LogIn, LogOut, 
  CheckCircle, XCircle, AlertTriangle, Briefcase,
  Sparkles, TrendingUp
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

      if (resRooms.ok) {
        const data = await resRooms.json();
        setRooms(Array.isArray(data) ? data : []);
      } else {
        setRooms([]);
      }

      if (resBookings.ok) {
        const data = await resBookings.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        setBookings([]);
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

  // 🧮 CALCULATE STATS (With Time-Aware Logic)
  const todayStr = new Date().toISOString().split('T')[0];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  // 1. Expected Arrivals (Today) - Using startsWith because of DateTimeField
  const expectedArrivals = safeBookings.filter(b => 
    b.check_in_date?.startsWith(todayStr) && b.status === 'CONFIRMED'
  );

  // 2. Expected Departures (Today)
  const expectedDepartures = safeBookings.filter(b => 
    b.check_out_date?.startsWith(todayStr) && b.status === 'CHECKED_IN'
  );

  // 3. Room Status Counts
  const totalRooms = safeRooms.length;
  const occupiedRooms = safeRooms.filter(r => r.status === 'OCCUPIED').length;
  const dirtyVacant = safeRooms.filter(r => r.status === 'DIRTY').length; 
  const cleanVacant = safeRooms.filter(r => r.status === 'AVAILABLE').length; 
  const maintenance = safeRooms.filter(r => r.status === 'MAINTENANCE').length;
  const rmsToSell = cleanVacant + dirtyVacant; 

  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(0) : 0;

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen text-blue-600 bg-slate-50">
      <Loader2 className="animate-spin mr-2"/> Loading Atithi HMS Dashboard...
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Atithi Dashboard</h1>
        <p className="text-slate-500 font-medium italic">Property Operations Overview</p>
      </div>

      {/* 📊 TOP STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        
        <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-teal-400 flex flex-col items-center justify-center hover:shadow-md transition">
          <div className="p-3 rounded-full bg-teal-50 text-teal-500 mb-2"><Building size={20}/></div>
          <div className="text-2xl font-black text-slate-800">{rmsToSell}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RMS TO SELL</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-purple-500 flex flex-col items-center justify-center hover:shadow-md transition">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mb-2"><Briefcase size={20}/></div>
          <div className="text-2xl font-black text-slate-800">{occupancyRate}%</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OCCUPANCY</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-yellow-400 flex flex-col items-center justify-center hover:shadow-md transition">
          <div className="p-3 rounded-full bg-yellow-50 text-yellow-500 mb-2"><AlertTriangle size={20}/></div>
          <div className="text-2xl font-black text-slate-800">{dirtyVacant}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DIRTY VACANT</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-green-500 flex flex-col items-center justify-center hover:shadow-md transition">
          <div className="p-3 rounded-full bg-green-50 text-green-500 mb-2"><CheckCircle size={20}/></div>
          <div className="text-2xl font-black text-slate-800">{cleanVacant}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CLEAN VACANT</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-blue-500 flex flex-col items-center justify-center hover:shadow-md transition">
          <div className="p-3 rounded-full bg-blue-50 text-blue-500 mb-2"><LogIn size={20}/></div>
          <div className="text-2xl font-black text-slate-800">{expectedArrivals.length}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EXP. ARR</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-t-4 border-red-500 flex flex-col items-center justify-center hover:shadow-md transition">
          <div className="p-3 rounded-full bg-red-50 text-red-500 mb-2"><LogOut size={20}/></div>
          <div className="text-2xl font-black text-slate-800">{expectedDepartures.length}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EXP. DEP</div>
        </div>

      </div>

      {/* 📈 INVENTORY HEALTH DISTRIBUTION CHART */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600"/> Inventory Health Distribution
          </h3>
          <span className="text-[10px] font-bold text-slate-400">TOTAL: {totalRooms} ROOMS</span>
        </div>
        
        <div className="flex h-10 w-full rounded-xl overflow-hidden shadow-inner bg-slate-100">
          <div style={{ width: `${(cleanVacant / totalRooms) * 100}%` }} className="bg-green-500 h-full transition-all duration-1000 border-r border-white/20"></div>
          <div style={{ width: `${(occupiedRooms / totalRooms) * 100}%` }} className="bg-blue-600 h-full transition-all duration-1000 border-r border-white/20"></div>
          <div style={{ width: `${(dirtyVacant / totalRooms) * 100}%` }} className="bg-yellow-400 h-full transition-all duration-1000 border-r border-white/20"></div>
          <div style={{ width: `${(maintenance / totalRooms) * 100}%` }} className="bg-red-600 h-full transition-all duration-1000"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> <span className="text-[10px] font-bold text-slate-500 uppercase">Available</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div> <span className="text-[10px] font-bold text-slate-500 uppercase">In-House</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> <span className="text-[10px] font-bold text-slate-500 uppercase">Dirty</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-600"></div> <span className="text-[10px] font-bold text-slate-500 uppercase">Maintenance</span></div>
        </div>
      </div>

      {/* 📋 SPLIT TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Expected Arrivals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs">
              <LogIn size={18} className="text-blue-500"/> Expected Arrival Today
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-400 border-b text-[10px] uppercase">
              <tr><th className="p-3">Ref ID</th><th className="p-3">Guest Name</th><th className="p-3">Room</th></tr>
            </thead>
            <tbody>
              {expectedArrivals.length > 0 ? expectedArrivals.map(b => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-blue-600 font-bold">#{b.id}</td>
                  <td className="p-3 font-medium text-slate-700">{b.guest_details?.full_name}</td>
                  <td className="p-3 text-slate-500 font-bold">{b.room_details?.room_number || "TBA"}</td>
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
            <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs">
              <LogOut size={18} className="text-red-500"/> Expected Departure Today
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-400 border-b text-[10px] uppercase">
              <tr><th className="p-3">Room</th><th className="p-3">Guest Name</th><th className="p-3">Folio Total</th></tr>
            </thead>
            <tbody>
              {expectedDepartures.length > 0 ? expectedDepartures.map(b => (
                <tr key={b.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-700">RM {b.room_details?.room_number}</td>
                  <td className="p-3 text-slate-600">{b.guest_details?.full_name}</td>
                  <td className="p-3 font-mono text-red-600 font-bold">₹{parseFloat(b.total_amount).toLocaleString()}</td> 
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