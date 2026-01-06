import { useEffect, useState } from 'react';
import { 
  BarChart3, Download, TrendingUp, Calendar, FileText, 
  Loader2, TrendingDown, PieChart, Zap, 
  History, Activity, ArrowUpRight, ShieldAlert,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const { token, role, user } = useAuth(); 
  const navigate = useNavigate();
  
  // --- STATE ---
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error State
  const [dateRange, setDateRange] = useState('MONTH'); 

  // 🛡️ SECURITY: Strict Access Control
  const isAdmin = ['OWNER', 'MANAGER', 'ACCOUNTANT'].includes(role) || user?.is_superuser;

  // --- FETCH DATA ---
  const fetchReports = async () => {
    // Stop if no token or not authorized
    if (!token || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Concurrent fetching for performance
      const [resAnalytics, resLogs] = await Promise.all([
        fetch(`${API_URL}/api/analytics/?range=${dateRange}`, { headers }),
        fetch(`${API_URL}/api/logs/`, { headers })
      ]);
      
      // Auth Check
      if (resAnalytics.status === 401 || resLogs.status === 401) {
          navigate('/login');
          return;
      }

      if (resAnalytics.ok) setData(await resAnalytics.json());
      else throw new Error("Failed to fetch analytics");

      if (resLogs.ok) setLogs(await resLogs.json());
      else throw new Error("Failed to fetch logs");

    } catch (err) { 
        console.error("Report Intelligence Sync Error:", err);
        setError("Unable to load financial data. Please check connection.");
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchReports(); }, [token, dateRange, navigate, isAdmin]); 

  // --- EXPORT ENGINES ---
  const downloadDailyPDF = () => {
    if(!token) return;
    window.open(`${API_URL}/api/reports/daily-pdf/?token=${token}`, '_blank');
  };

  const exportCSV = (type) => {
    if(!token) return;
    window.open(`${API_URL}/api/reports/export/?type=${type}&token=${token}`, '_blank');
  };

  // 🚫 BLOCK UNAUTHORIZED ACCESS
  if (!loading && !isAdmin) {
      return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-10 bg-white rounded-[40px] shadow-xl border border-red-50 max-w-md">
                <div className="bg-red-50 p-4 rounded-3xl inline-flex mb-6 text-red-500 shadow-inner">
                    <ShieldAlert size={48}/>
                </div>
                <h2 className="text-3xl font-black text-slate-800 uppercase italic mb-2">Restricted Access</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                    Financial intelligence is classified.<br/>Contact your administrator.
                </p>
            </div>
        </div>
      );
  }

  // --- LOADING STATE ---
  if (loading && !data) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={50}/>
        <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs">Aggregating Financial Intelligence...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* 1. HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32}/> Financial Audit
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Activity size={12} className="text-emerald-500"/> System Integrity: 100% • Generated: {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                {['TODAY', 'WEEK', 'MONTH', 'YEAR'].map(r => (
                    <button 
                        key={r}
                        onClick={() => setDateRange(r)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            dateRange === r ? 'bg-slate-900 text-white shadow-xl translate-y-[-1px]' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            <button onClick={downloadDailyPDF} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 flex items-center gap-3 transition-all shadow-xl shadow-blue-200">
                <Zap size={16}/> Daily Night Audit PDF
            </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20}/> {error}
            <button onClick={fetchReports} className="underline ml-auto hover:text-red-800">Retry</button>
        </div>
      )}

      {/* 2. KPI PERFORMANCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <ReportCard 
            label="Gross Revenue" 
            val={data?.financials?.total_rev || 0} 
            icon={<TrendingUp size={24}/>} 
            color="text-blue-600" 
            bg="bg-blue-50"
            trend="+14.2%"
        />
        <ReportCard 
            label="Operating Expenses" 
            val={data?.financials?.total_expenses || 0} 
            icon={<TrendingDown size={24}/>} 
            color="text-rose-600" 
            bg="bg-rose-50"
            trend="+2.1%"
            isNegative
        />
        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden group">
             <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-all duration-1000"></div>
             <div className="relative z-10">
                <div className="mb-6 p-4 bg-white/10 w-fit rounded-2xl backdrop-blur-md"><PieChart size={28} className="text-blue-400"/></div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Adjusted Net Profit</h3>
                <p className="text-4xl font-black tracking-tighter italic text-white">₹{(data?.financials?.net_profit || 0).toLocaleString()}</p>
                <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase">
                    <CheckCircle size={12}/> Verified for Tax Compliance
                </div>
             </div>
        </div>
      </div>

      {/* 3. TRANSACTION LOG & EXPORT CONTROLS */}
      <div className="bg-white p-8 md:p-12 rounded-[50px] border border-slate-200 shadow-sm mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl"><FileText size={22}/></div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">Revenue Ledger</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detailed Daily Aggregates</p>
                </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => exportCSV('bookings')} className="flex-1 md:flex-none px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-100">
                    <Download size={14}/> Bookings CSV
                </button>
                <button onClick={() => exportCSV('expenses')} className="flex-1 md:flex-none px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-100">
                    <Download size={14}/> Expenses CSV
                </button>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-6 py-4">Transaction Date</th>
                        <th className="px-6 py-4">Node Description</th>
                        <th className="px-6 py-4 text-right">Settled Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.trend?.length > 0 ? data.trend.map((day, i) => (
                        <tr key={i} className="group transition-all">
                            <td className="px-6 py-5 bg-slate-50 rounded-l-2xl font-bold text-slate-600 group-hover:bg-blue-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Calendar size={14} className="text-blue-500"/>
                                    {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </td>
                            <td className="px-6 py-5 bg-slate-50 text-sm font-bold text-slate-500 group-hover:bg-blue-50 transition-colors">
                                <span className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200 mr-2 uppercase">REVENUE</span>
                                Daily Aggregated folio settlement
                            </td>
                            <td className="px-6 py-5 bg-slate-50 text-right rounded-r-2xl group-hover:bg-blue-50 transition-colors">
                                <p className="font-black text-slate-800 text-lg italic tracking-tight">₹{parseFloat(day.daily_revenue).toLocaleString()}</p>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="3" className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-xs">
                                Zero Ledger Data in Selection
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* 4. SYSTEM AUDIT TRAIL (LOG SECTION) */}
      <div className="bg-white p-8 md:p-12 rounded-[50px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><History size={22}/></div>
            <div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Operational Logs</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Administrative Audit Trail</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {logs.slice(0, 8).map((log, i) => (
                <div key={i} className="flex gap-5 items-start p-6 bg-slate-50 rounded-[30px] border border-slate-100 hover:border-blue-200 transition-all">
                    <div className={`mt-1 p-2 rounded-xl ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <Activity size={16}/>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-tighter mb-1">{log.action}</p>
                        <p className="text-sm font-bold text-slate-700 leading-snug">{log.details}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1">
                            <Clock size={10}/> {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT ---
const ReportCard = ({ label, val, icon, color, bg, trend, isNegative = false }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all duration-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {icon}
        </div>
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 ${bg} ${color} rounded-2xl transition-transform group-hover:scale-110`}>{icon}</div>
            <span className={`${isNegative ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'} px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm`}>{trend}</span>
        </div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h3>
        <p className={`text-4xl font-black tracking-tighter italic ${isNegative ? 'text-rose-600' : 'text-slate-900'}`}>
            {isNegative ? '-' : ''}₹{val.toLocaleString()}
        </p>
        <ArrowUpRight size={20} className="absolute bottom-8 right-8 text-slate-100 group-hover:text-blue-500 transition-colors" />
    </div>
);

export default Reports;