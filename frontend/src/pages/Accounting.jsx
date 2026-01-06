import { useEffect, useState } from 'react';
import { 
  CreditCard, TrendingUp, TrendingDown, Calendar, 
  ArrowUpRight, ArrowDownLeft, Loader2, Download, 
  Filter, Printer, AlertCircle, RefreshCcw
} from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const Accounting = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error State
  const [filterType, setFilterType] = useState('ALL'); // ALL, CREDIT, DEBIT
  
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
          navigate('/login');
          return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Expenses (Money Out) & Bookings (Money In)
      const [expensesRes, bookingsRes] = await Promise.all([
          fetch(`${API_URL}/api/expenses/`, { headers }),
          fetch(`${API_URL}/api/bookings/`, { headers })
      ]);

      // Auth Check
      if (expensesRes.status === 401 || bookingsRes.status === 401) {
          navigate('/login');
          return;
      }

      if (expensesRes.ok && bookingsRes.ok) {
          const expenses = await expensesRes.json();
          const bookings = await bookingsRes.json();

          // 3. Process Expenses -> DEBIT
          const debitTx = expenses.map(e => ({
              id: `EXP-${e.id}`,
              date: e.date,
              description: e.title || e.category, // Fallback if title missing
              category: e.category,
              reference_id: `EXP-${e.id}`,
              amount: parseFloat(e.amount || 0),
              type: 'DEBIT'
          }));

          // 4. Process Booking Payments -> CREDIT
          let creditTx = [];
          bookings.forEach(b => {
              if (b.payments && b.payments.length > 0) {
                  b.payments.forEach(p => {
                      creditTx.push({
                          id: `PAY-${p.id}`,
                          date: p.date,
                          description: `Payment for Room ${b.room_details?.room_number || 'N/A'}`,
                          category: 'Room Revenue',
                          reference_id: `BK-${b.id}`,
                          amount: parseFloat(p.amount || 0),
                          type: 'CREDIT'
                      });
                  });
              }
          });

          // 5. Merge & Sort by Date (Newest First)
          const allTx = [...creditTx, ...debitTx].sort((a, b) => new Date(b.date) - new Date(a.date));
          setTransactions(allTx);
      } else {
          setError("Failed to sync ledger data.");
      }

    } catch (err) { 
        console.error("Accounting Sync Error:", err); 
        setError("Network connection failed.");
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, navigate]);

  // calculations
  const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalCredit - totalDebit;

  // filtering
  const filteredTransactions = transactions.filter(t => {
    if(filterType === 'ALL') return true;
    return t.type === filterType;
  });

  // Simple Chart Data (Last 15 transactions for visual)
  // We reverse strictly for the bar chart so oldest is left, newest is right
  const recentTx = filteredTransactions.slice(0, 15).reverse();

  // --- LOADING STATE ---
  if (loading && transactions.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Syncing Ledger...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">General Ledger</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Cash Flow & Financial Health</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <button 
                onClick={fetchData} 
                className="bg-white p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                title="Refresh Data"
            >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""}/>
            </button>

            <button onClick={() => window.print()} className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
                <Printer size={16}/> Print Report
            </button>
            <div className="flex-1 md:flex-none bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Net Balance</span>
                <span className={`text-xl font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance >= 0 ? '+' : ''}₹{balance.toLocaleString()}
                </span>
            </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20}/> {error}
            <button onClick={fetchData} className="underline ml-auto hover:text-red-800">Retry</button>
        </div>
      )}

      {/* VISUAL CHART (CSS BASED) */}
      <div className="bg-slate-900 rounded-[30px] p-8 mb-8 text-white relative overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={100}/></div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500"/> Recent Activity Flow
        </h3>
        
        <div className="flex items-end gap-2 h-32 w-full">
            {recentTx.map((t, i) => {
                // Normalize height for visual (max 100%) - assumes 10k is a "tall" bar
                const height = Math.min((t.amount / 10000) * 100, 100); 
                return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                        <div 
                            className={`w-full rounded-t-sm transition-all duration-300 hover:opacity-100 opacity-80 ${t.type === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ height: `${Math.max(height, 10)}%` }} // Min height 10% so standard bars show
                        ></div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            ₹{t.amount.toLocaleString()}
                        </div>
                    </div>
                )
            })}
             {recentTx.length === 0 && <p className="text-slate-500 text-xs w-full text-center italic mt-10">No recent transactions found.</p>}
        </div>
        <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between text-[10px] text-slate-500 uppercase tracking-widest">
            <span>Older</span>
            <span>Newer</span>
        </div>
      </div>

      {/* FILTERS & TABLE */}
      <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                {['ALL', 'CREDIT', 'DEBIT'].map(type => (
                    <button 
                        key={type} 
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            filterType === type ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {type}
                    </button>
                ))}
             </div>
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                 {filteredTransactions.length} Transactions Found
             </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Date</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-6 font-bold text-slate-500 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-300"/> 
                                    {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </td>
                            <td className="p-6 font-bold text-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        t.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {t.type === 'CREDIT' ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                                    </div>
                                    <div>
                                        <p className="group-hover:text-blue-600 transition-colors line-clamp-1">{t.description}</p>
                                        <span className="inline-block bg-slate-100 text-slate-400 text-[9px] px-1.5 py-0.5 rounded uppercase mt-1 font-bold tracking-wider">
                                            {t.category || "General"}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="p-6 text-xs font-bold text-slate-400 font-mono tracking-wider">
                                {t.reference_id}
                            </td>
                            <td className={`p-6 text-right font-black text-lg ${
                                t.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'
                            }`}>
                                {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && !loading && (
                        <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No transactions match your filter.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Accounting;