import { useEffect, useState } from 'react';
import { 
  Building, Users, Loader2, LogIn, LogOut, 
  CheckCircle, XCircle, AlertTriangle, Briefcase,
  Sparkles, TrendingUp, Wallet, BarChart3, Clock, AlertCircle
} from 'lucide-react'; 
import { API_URL } from '../config'; 

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resRooms, resBookings, resAnalytics] = await Promise.all([
        fetch(API_URL + '/api/rooms/', { headers }),
        fetch(API_URL + '/api/bookings/', { headers }),
        fetch(API_URL + '/api/analytics/', { headers })
      ]);

      if (resRooms.ok) setRooms(await resRooms.json());
      if (resBookings.ok) setBookings(await resBookings.json());
      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());

    } catch (err) { 
      console.error("Error fetching dashboard data:", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🧮 OPERATIONAL CALCULATIONS
  const todayStr = new Date().toISOString().split('T')[0];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const expectedArrivals = safeBookings.filter(b => 
    b.check_in_date?.startsWith(todayStr) && b.status === 'CONFIRMED'
  );

  const expectedDepartures = safeBookings.filter(b => 
    b.check_out_date?.startsWith(todayStr) && b.status === 'CHECKED_IN'
  );

  const totalRoomsCount = safeRooms.length;
  const occupiedRooms = safeRooms.filter(r => r.status === 'OCCUPIED').length;
  const dirtyVacant = safeRooms.filter(r => r.status === 'DIRTY').length; 
  const cleanVacant = safeRooms.filter(r => r.status === 'AVAILABLE').length; 
  const maintenance = safeRooms.filter(r => r.status === 'MAINTENANCE').length;
  const rmsToSell = cleanVacant + dirtyVacant; 

  const occupancyRate = totalRoomsCount > 0 ? ((occupiedRooms / totalRoomsCount) * 100).toFixed(0) : 0;

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Initializing Atithi HMS...</p>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* 👋 HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Property Dashboard</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Role: <span className="text-blue-600">{userRole}</span> • Operations Status: <span className="text-green-500">Live</span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">System Date</p>
          <p className="text-lg font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* 📊 EXECUTIVE FINANCIALS (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Wallet size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
            <h3 className="text-xl font-black text-slate-900">₹{parseFloat(analytics?.financials?.total_rev || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance Float</p>
            <h3 className="text-xl font-black text-slate-900">₹{parseFloat(analytics?.financials?.total_advance || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupancy %</p>
            <h3 className="text-xl font-black text-slate-900">{occupancyRate}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-inner"><Building size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Liability</p>
            <h3 className="text-xl font-black text-slate-900">₹{parseFloat(analytics?.financials?.total_tax || 0).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* 📈 OPERATIONAL KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border-t-4 border-yellow-400">
          <div className="flex justify-between items-center mb-2">
            <AlertTriangle className="text-yellow-500" size={18}/>
            <span className="text-2xl font-black">{dirtyVacant}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirty Vacant</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border-t-4 border-teal-500">
          <div className="flex justify-between items-center mb-2">
            <CheckCircle className="text-teal-500" size={18}/>
            <span className="text-2xl font-black">{cleanVacant}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clean Vacant</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border-t-4 border-blue-500">
          <div className="flex justify-between items-center mb-2">
            <LogIn className="text-blue-500" size={18}/>
            <span className="text-2xl font-black">{expectedArrivals.length}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today Arrivals</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border-t-4 border-red-500">
          <div className="flex justify-between items-center mb-2">
            <LogOut className="text-red-500" size={18}/>
            <span className="text-2xl font-black">{expectedDepartures.length}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today Departures</p>
        </div>
      </div>

      {/* 📈 INVENTORY HEALTH BAR */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600"/> Inventory Distribution Health
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventory: {totalRoomsCount} Units</span>
        </div>
        
        <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-100 p-1">
          <div style={{ width: `${(cleanVacant / totalRoomsCount) * 100}%` }} className="bg-teal-500 h-full transition-all duration-1000 border-r-2 border-white/20 rounded-l-xl"></div>
          <div style={{ width: `${(occupiedRooms / totalRoomsCount) * 100}%` }} className="bg-blue-600 h-full transition-all duration-1000 border-r-2 border-white/20"></div>
          <div style={{ width: `${(dirtyVacant / totalRoomsCount) * 100}%` }} className="bg-yellow-400 h-full transition-all duration-1000 border-r-2 border-white/20"></div>
          <div style={{ width: `${(maintenance / totalRoomsCount) * 100}%` }} className="bg-red-600 h-full transition-all duration-1000 rounded-r-xl"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500"></div> <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Ready (Clean)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600"></div> <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">In-House</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Needs Cleaning</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600"></div> <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Out of Order</span></div>
        </div>
      </div>

      {/* 📋 SPLIT DATA TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Arrivals Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-700 flex items-center gap-2 uppercase text-xs tracking-widest">
              <LogIn size={18} className="text-blue-500"/> Check-in Manifest
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 border-b text-[10px] font-black uppercase tracking-widest">
                <tr><th className="p-6">ID</th><th className="p-6">Guest</th><th className="p-6">Allocation</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expectedArrivals.length > 0 ? expectedArrivals.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 font-bold text-blue-600">#{b.id}</td>
                    <td className="p-6 font-black text-slate-800">{b.guest_details?.full_name}</td>
                    <td className="p-6"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-xs uppercase">Room {b.room_details?.room_number || "TBA"}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="p-12 text-center text-slate-400 italic">No scheduled arrivals for today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Departures Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-700 flex items-center gap-2 uppercase text-xs tracking-widest">
              <LogOut size={18} className="text-red-500"/> Check-out Manifest
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-400 border-b text-[10px] font-black uppercase tracking-widest">
                <tr><th className="p-6">Unit</th><th className="p-6">Guest</th><th className="p-6">Folio Balance</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expectedDepartures.length > 0 ? expectedDepartures.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 font-black text-slate-700">RM {b.room_details?.room_number}</td>
                    <td className="p-6 font-black text-slate-800">{b.guest_details?.full_name}</td>
                    <td className="p-6 font-black text-red-600">₹{parseFloat(b.total_amount).toLocaleString()}</td> 
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="p-12 text-center text-slate-400 italic">No scheduled departures for today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;