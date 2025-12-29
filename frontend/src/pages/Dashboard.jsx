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
  const [analytics, setAnalytics] = useState(null);
  const [inventory, setInventory] = useState([]); 
  const [tasks, setTasks] = useState([]);         
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); 
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  const fetchData = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resRooms, resBookings, resAnalytics, resInv, resTasks] = await Promise.all([
        fetch(API_URL + '/api/rooms/', { headers }),
        fetch(API_URL + '/api/bookings/', { headers }),
        fetch(API_URL + '/api/analytics/', { headers }),
        fetch(API_URL + '/api/inventory/', { headers }),    
        fetch(API_URL + '/api/housekeeping/', { headers })  
      ]);

      if (resRooms.ok) setRooms(await resRooms.json());
      if (resBookings.ok) setBookings(await resBookings.json());
      if (resAnalytics.ok) setAnalytics(await resAnalytics.json());
      if (resInv.ok) setInventory(await resInv.json());
      if (resTasks.ok) setTasks(await resTasks.json());

    } catch (err) { 
      console.error("Critical System Fetch Error:", err);
    } finally { 
      if (showLoader) setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(true); 
    const interval = setInterval(() => { 
        fetchData(false); 
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🧮 OPERATIONAL LOGIC
  const todayStr = new Date().toISOString().split('T')[0];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const expectedArrivals = safeBookings.filter(b => b.check_in_date?.startsWith(todayStr) && b.status === 'CONFIRMED');
  const expectedDepartures = safeBookings.filter(b => b.check_out_date?.startsWith(todayStr) && b.status === 'CHECKED_IN');

  const totalRoomsCount = safeRooms.length;
  const occupiedRooms = safeRooms.filter(r => r.status === 'OCCUPIED').length;
  const dirtyVacant = safeRooms.filter(r => r.status === 'DIRTY').length; 
  const cleanVacant = safeRooms.filter(r => r.status === 'AVAILABLE').length; 
  const maintenance = safeRooms.filter(r => r.status === 'MAINTENANCE').length;
  
  const occupancyRate = totalRoomsCount > 0 ? ((occupiedRooms / totalRoomsCount) * 100).toFixed(0) : 0;
  const healthScore = totalRoomsCount > 0 ? (((cleanVacant + occupiedRooms) / totalRoomsCount) * 100).toFixed(0) : 0;

  const trendData = analytics?.trend || [];
  const revenueValues = trendData.map(t => Number(t.daily_revenue || 0));
  const maxRevenue = Math.max(...revenueValues, 5000);

  const lowStockItems = Array.isArray(inventory) ? inventory.filter(i => i.current_stock <= i.min_stock_alert) : [];
  const pendingTasks = Array.isArray(tasks) ? tasks.filter(t => t.status !== 'COMPLETED') : [];

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
      <p className="mt-6 font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">Booting Enterprise PMS Engine...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
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

      {(lowStockItems.length > 0 || pendingTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
            {lowStockItems.length > 0 && (
                <div onClick={() => navigate('/inventory')} className="bg-orange-50 border-2 border-orange-100 p-4 md:p-6 rounded-[32px] flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-200 p-3 rounded-2xl text-orange-700"><Package size={24}/></div>
                        <div><h3 className="font-black text-slate-800 text-lg">Low Stock Alert</h3><p className="text-xs font-bold text-slate-500">{lowStockItems.length} items need restocking</p></div>
                    </div>
                </div>
            )}
            {pendingTasks.length > 0 && (
                <div onClick={() => navigate('/housekeeping')} className="bg-purple-50 border-2 border-purple-100 p-4 md:p-6 rounded-[32px] flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-200 p-3 rounded-2xl text-purple-700"><Brush size={24}/></div>
                        <div><h3 className="font-black text-slate-800 text-lg">Pending Cleaning</h3><p className="text-xs font-bold text-slate-500">{pendingTasks.length} tasks assigned</p></div>
                    </div>
                </div>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue</p><h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">₹{(analytics?.financials?.total_rev || 0).toLocaleString()}</h3></div>
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p><h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">₹{(analytics?.financials?.total_expenses || 0).toLocaleString()}</h3></div>
        <div className="bg-slate-900 p-6 md:p-8 rounded-[40px] shadow-2xl relative overflow-hidden"><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Profit Flow</p><h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">₹{(analytics?.financials?.net_profit || 0).toLocaleString()}</h3></div>
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-slate-200 shadow-sm"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Advance Float</p><h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">₹{(analytics?.financials?.total_advance || 0).toLocaleString()}</h3></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {[
          { label: "DIRTY VACANT", val: dirtyVacant, icon: Sparkles, color: "text-orange-500", bg: "border-orange-200", desc: "Needs Cleaning" },
          { label: "CLEAN READY", val: cleanVacant, icon: CheckCircle, color: "text-teal-500", bg: "border-teal-200", desc: "Available to Sell" },
          { label: "TODAY ARRIVALS", val: expectedArrivals.length, icon: LogIn, color: "text-blue-500", bg: "border-blue-200", desc: "Confirmed Guest" },
          { label: "TODAY DEPARTURES", val: expectedDepartures.length, icon: LogOut, color: "text-red-500", bg: "border-red-200", desc: "Pending Folios" }
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-6 rounded-[32px] shadow-sm border-l-8 ${kpi.bg} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex justify-between items-center mb-2"><kpi.icon className={kpi.color} size={24}/><span className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">{kpi.val}</span></div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {trendData.length > 0 && (
          <div className="mt-10 bg-slate-900 p-6 md:p-10 rounded-[48px] text-white overflow-hidden relative">
              <div className="flex justify-between items-center mb-10 relative z-10"><h3 className="font-black uppercase text-xs tracking-[0.4em] italic text-blue-400">7-Day Revenue</h3><TrendingUp className="text-blue-400" size={20}/></div>
              <div className="flex items-end justify-between gap-2 md:gap-4 h-40 relative z-10">
                  {trendData.map((t, i) => {
                      const dailyRevenue = Number(t.daily_revenue || 0); 
                      const heightPercent = maxRevenue > 0 ? (dailyRevenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group/trend h-full justify-end">
                            <div className="w-full relative flex items-end justify-center" style={{height: '100%'}}>
                                <div style={{ height: `${heightPercent}%` }} className="w-full bg-blue-600 rounded-t-lg transition-all duration-700 relative min-h-[4px]"></div>
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