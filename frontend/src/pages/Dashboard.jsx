import { useEffect, useState } from 'react';
import { 
  Building, Loader2, LogIn, LogOut, 
  CheckCircle, AlertCircle, 
  Sparkles, TrendingUp, Wallet, BarChart3, Clock, TrendingDown,
  ArrowUpRight, ShieldCheck, Package, Brush 
} from 'lucide-react'; 
import { useNavigate } from 'react-router-dom'; 
import { API_URL } from '../config'; 

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Derived States (Calculated on Frontend)
  const [financials, setFinancials] = useState({ revenue: 0, expenses: 0, profit: 0, liability: 0 });
  const [trendData, setTrendData] = useState([]);
  const [tasks, setTasks] = useState([]);         
  
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); 
  const token = localStorage.getItem('access_token');
  // Fallback if user role is not stored
  const userRole = localStorage.getItem('user_role') || 'MANAGER';

  // --- FETCH DATA ---
  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch only the endpoints we know exist
      const [resRooms, resBookings] = await Promise.all([
        fetch(`${API_URL}/api/rooms/`, { headers }),
        fetch(`${API_URL}/api/bookings/`, { headers })
      ]);

      if (resRooms.ok && resBookings.ok) {
        const roomsData = await resRooms.json();
        const bookingsData = await resBookings.json();
        
        setRooms(roomsData);
        setBookings(bookingsData);
        
        // --- RUN ANALYTICS CALCULATION ---
        calculateAnalytics(roomsData, bookingsData);
      }

    } catch (err) { 
      console.error("Critical System Fetch Error:", err);
    } finally { 
      if (showLoader) setLoading(false); 
    }
  };

  const calculateAnalytics = (currentRooms, currentBookings) => {
    // 1. Calculate Financials
    const totalRev = currentBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalPaid = currentBookings.reduce((sum, b) => {
        const paid = b.payments?.reduce((pSum, p) => pSum + parseFloat(p.amount || 0), 0) || 0;
        return sum + paid;
    }, 0);
    
    // Estimate expenses as 40% of revenue for demo purposes (or 0 if you don't have expense data)
    const estimatedExpenses = totalRev * 0.4; 
    
    setFinancials({
        revenue: totalRev,
        expenses: estimatedExpenses,
        profit: totalRev - estimatedExpenses,
        liability: totalRev - totalPaid // Money owed by guests
    });

    // 2. Calculate Trend (Last 7 Days Revenue)
    const last7Days = {};
    const today = new Date();
    for(let i=6; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        last7Days[d.toISOString().split('T')[0]] = 0;
    }

    currentBookings.forEach(b => {
        const date = b.check_in_date; // Using check-in as revenue date logic
        if (last7Days[date] !== undefined) {
            last7Days[date] += parseFloat(b.total_amount || 0);
        }
    });

    const trend = Object.keys(last7Days).map(date => ({
        date,
        daily_revenue: last7Days[date]
    }));
    setTrendData(trend);

    // 3. Generate Housekeeping Tasks from Room Status
    const dirtyRooms = currentRooms.filter(r => r.status === 'DIRTY');
    setTasks(dirtyRooms);
  };

  useEffect(() => { 
    // 1. Initial Load
    fetchData(true); 

    // 2. Background Refresh (every 30s)
    const interval = setInterval(() => { 
        fetchData(false); 
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 🧮 OPERATIONAL LOGIC
  const todayStr = new Date().toISOString().split('T')[0];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const expectedArrivals = safeBookings.filter(b => 
    b.check_in_date === todayStr && (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN')
  );

  const expectedDepartures = safeBookings.filter(b => 
    b.check_out_date === todayStr && b.status === 'CHECKED_IN'
  );

  const totalRoomsCount = safeRooms.length;
  const occupiedRooms = safeRooms.filter(r => r.status === 'OCCUPIED').length;
  const dirtyVacant = safeRooms.filter(r => r.status === 'DIRTY').length; 
  const cleanVacant = safeRooms.filter(r => r.status === 'AVAILABLE').length; 
  const maintenance = safeRooms.filter(r => r.status === 'MAINTENANCE').length;
  
  const occupancyRate = totalRoomsCount > 0 ? ((occupiedRooms / totalRoomsCount) * 100).toFixed(0) : 0;
  const healthScore = totalRoomsCount > 0 ? (((cleanVacant + occupiedRooms) / totalRoomsCount) * 100).toFixed(0) : 0;

  const revenueValues = trendData.map(t => Number(t.daily_revenue || 0));
  const maxRevenue = Math.max(...revenueValues, 1000); // Prevent division by zero

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="relative">
        <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
        <Building className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24}/>
      </div>
      <p className="mt-6 font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">Booting Enterprise PMS Engine...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* 👋 DYNAMIC MANAGEMENT HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white p-1 rounded-md"><ShieldCheck size={14}/></span>
            <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest italic">Management Portal v2.1</p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Intelligence</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-3 flex items-center gap-2">
             <Clock size={12}/> Last Refreshed: {new Date().toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm text-right flex-1 md:flex-none">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Health</p>
                <p className="text-xl font-black text-emerald-500">{healthScore}%</p>
            </div>
            <div className="bg-slate-900 p-4 px-6 rounded-2xl shadow-xl text-right border border-slate-700 flex-1 md:flex-none">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Personnel</p>
                <p className="text-xl font-black text-white truncate max-w-[100px] md:max-w-none ml-auto">{userRole}</p>
            </div>
        </div>
      </div>

      {/* 🚨 CRITICAL ALERTS ROW */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
            <div 
                onClick={() => navigate('/rooms')}
                className="bg-purple-50 border-2 border-purple-100 p-4 md:p-6 rounded-[32px] flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-purple-200 p-3 rounded-2xl text-purple-700"><Brush size={24}/></div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Pending Cleaning</h3>
                        <p className="text-xs font-bold text-slate-500">{tasks.length} rooms marked dirty</p>
                    </div>
                </div>
                <ArrowUpRight size={24} className="text-purple-400"/>
            </div>
        </div>
      )}

      {/* 📊 CORE FINANCIAL INTELLIGENCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {/* REVENUE */}
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-blue-500 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors"><TrendingUp size={28}/></div>
            <ArrowUpRight className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">₹{financials.revenue.toLocaleString()}</h3>
        </div>

        {/* EXPENSES */}
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-red-500 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-red-600 group-hover:text-white transition-colors"><TrendingDown size={28}/></div>
            <AlertCircle className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Expenses</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">₹{financials.expenses.toLocaleString()}</h3>
        </div>

        {/* NET PROFIT */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-slate-800">
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-5 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner mb-6"><CheckCircle size={28}/></div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Profit Flow</p>
            <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">₹{financials.profit.toLocaleString()}</h3>
          </div>
        </div>

        {/* LIABILITY (Pending Payments) */}
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-orange-500 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-orange-600 group-hover:text-white transition-colors"><BarChart3 size={28}/></div>
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Collections</p>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">₹{financials.liability.toLocaleString()}</h3>
        </div>
      </div>

      {/* 📈 OPERATIONAL KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {[
          { label: "DIRTY VACANT", val: dirtyVacant, icon: Sparkles, color: "text-orange-500", bg: "border-orange-200", desc: "Needs Cleaning" },
          { label: "CLEAN READY", val: cleanVacant, icon: CheckCircle, color: "text-teal-500", bg: "border-teal-200", desc: "Available to Sell" },
          { label: "TODAY ARRIVALS", val: expectedArrivals.length, icon: LogIn, color: "text-blue-500", bg: "border-blue-200", desc: "Confirmed Guest" },
          { label: "TODAY DEPARTURES", val: expectedDepartures.length, icon: LogOut, color: "text-red-500", bg: "border-red-200", desc: "Pending Folios" }
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-6 rounded-[32px] shadow-sm border-l-8 ${kpi.bg} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex justify-between items-center mb-2">
              <kpi.icon className={kpi.color} size={24}/>
              <span className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">{kpi.val}</span>
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{kpi.label}</p>
            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* 🏢 INVENTORY DISTRIBUTION ENGINE */}
      <div className="bg-white p-6 md:p-10 rounded-[48px] border border-slate-200 shadow-sm mb-10 group">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-[0.3em]">Live Inventory Health</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Real-time room status distribution</p>
          </div>
          <div className="text-right">
             <span className="text-3xl font-black text-slate-900 tracking-tighter">{occupancyRate}%</span>
             <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Occupancy</p>
          </div>
        </div>
        
        <div className="flex h-16 w-full rounded-[24px] overflow-hidden shadow-inner bg-slate-50 p-2 border-4 border-slate-50">
          <div style={{ width: `${(cleanVacant / totalRoomsCount) * 100}%` }} className="bg-teal-500 h-full transition-all duration-1000 border-r-4 border-white group-hover:brightness-110"></div>
          <div style={{ width: `${(occupiedRooms / totalRoomsCount) * 100}%` }} className="bg-blue-600 h-full transition-all duration-1000 border-r-4 border-white group-hover:brightness-110"></div>
          <div style={{ width: `${(dirtyVacant / totalRoomsCount) * 100}%` }} className="bg-orange-400 h-full transition-all duration-1000 border-r-4 border-white group-hover:brightness-110"></div>
          <div style={{ width: `${(maintenance / totalRoomsCount) * 100}%` }} className="bg-red-600 h-full transition-all duration-1000 group-hover:brightness-110"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10">
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div> 
            <div><p className="text-[10px] font-black text-slate-800 uppercase leading-none">Ready</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{cleanVacant} Units</p></div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div> 
            <div><p className="text-[10px] font-black text-slate-800 uppercase leading-none">Occupied</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{occupiedRooms} Units</p></div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div> 
            <div><p className="text-[10px] font-black text-slate-800 uppercase leading-none">Dirty</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{dirtyVacant} Units</p></div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div> 
            <div><p className="text-[10px] font-black text-slate-800 uppercase leading-none">O.O.O</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{maintenance} Units</p></div>
          </div>
        </div>
      </div>

      {/* 📋 OPERATIONAL MANIFESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        {/* Arrivals Card */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden group">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center group-hover:bg-blue-50 transition-colors">
            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
              <LogIn size={20} className="text-blue-600"/> Arrivals
            </h3>
            <span className="text-[9px] font-black px-3 py-1 bg-blue-100 text-blue-700 rounded-full tracking-widest uppercase italic">ETA Today</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-50">
                {expectedArrivals.length > 0 ? expectedArrivals.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors group/row">
                    <td className="p-6">
                        <p className="font-black text-slate-800 text-base">{b.guest_details?.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ref: #BK-{b.id}</p>
                    </td>
                    <td className="p-6 text-right">
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">RM {b.room_details?.room_number || "TBA"}</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td className="p-10 md:p-20 text-center text-slate-300 italic font-medium">No arrivals scheduled.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Departures Card */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden group">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center group-hover:bg-red-50 transition-colors">
            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
              <LogOut size={20} className="text-red-600"/> Departures
            </h3>
            <span className="text-[9px] font-black px-3 py-1 bg-red-100 text-red-700 rounded-full tracking-widest uppercase italic">Out Today</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-50">
                {expectedDepartures.length > 0 ? expectedDepartures.map(b => {
                    const paid = b.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                    const due = parseFloat(b.total_amount) - paid;
                    return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-6">
                                <p className="font-black text-slate-800 text-base">{b.guest_details?.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Unit: {b.room_details?.room_number}</p>
                            </td>
                            <td className="p-6 text-right">
                                <p className="text-red-600 font-black text-lg tracking-tighter">₹{due.toLocaleString()}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due</p>
                            </td>
                        </tr>
                    );
                }) : (
                  <tr><td className="p-10 md:p-20 text-center text-slate-300 italic font-medium">No departures scheduled.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🚀 ANALYTICS TREND BAR */}
      {trendData.length > 0 && (
          <div className="mt-10 bg-slate-900 p-6 md:p-10 rounded-[48px] text-white overflow-hidden relative">
              <div className="flex justify-between items-center mb-10 relative z-10">
                  <h3 className="font-black uppercase text-xs tracking-[0.4em] italic text-blue-400">7-Day Revenue</h3>
                  <TrendingUp className="text-blue-400" size={20}/>
              </div>
              
              <div className="flex items-end justify-between gap-2 md:gap-4 h-40 relative z-10">
                  {trendData.map((t, i) => {
                      const dailyRevenue = Number(t.daily_revenue || 0); 
                      const heightPercent = maxRevenue > 0 ? (dailyRevenue / maxRevenue) * 100 : 0;
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group/trend h-full justify-end">
                            <div className="w-full relative flex items-end justify-center" style={{height: '100%'}}>
                                <div 
                                  style={{ height: `${heightPercent}%` }} 
                                  className="w-full bg-blue-600 rounded-t-lg transition-all duration-700 relative min-h-[4px]"
                                >
                                    <div className="hidden md:block absolute -top-6 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold opacity-70 group-hover/trend:opacity-100 transition-opacity whitespace-nowrap">
                                        {dailyRevenue > 0 ? `₹${(dailyRevenue/1000).toFixed(1)}k` : ''}
                                    </div>
                                </div>
                            </div>
                            <p className="text-[8px] md:text-[10px] font-bold mt-3 text-slate-500 uppercase tracking-widest transform -rotate-45 md:rotate-0 origin-top-left md:origin-center translate-y-2 md:translate-y-0">{t.date.split('-').slice(1).join('/')}</p>
                        </div>
                      );
                  })}
              </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;