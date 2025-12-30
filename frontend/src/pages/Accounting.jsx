import { useEffect, useState } from 'react';
import { 
  CreditCard, TrendingUp, TrendingDown, Calendar, 
  ArrowUpRight, ArrowDownLeft, Loader2, Download, 
  Filter, Printer 
} from 'lucide-react';
import { API_URL } from '../config';

const Accounting = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, CREDIT, DEBIT
  
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/accounting/ledger/`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (res.ok) setTransactions(await res.json());
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // calculations
  const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const balance = totalCredit - totalDebit;

  // filtering
  const filteredTransactions = transactions.filter(t => {
    if(filterType === 'ALL') return true;
    return t.type === filterType;
  });

  // Simple Chart Data (Last 5 transactions for demo visual)
  const recentTx = transactions.slice(0, 10).reverse();

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">General Ledger</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Cash Flow & Financial Health</p>
        </div>
        
        <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2">
                <Printer size={16}/> Print Report
            </button>
            <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Net Balance</span>
                <span className={`text-xl font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance >= 0 ? '+' : ''}₹{balance.toLocaleString()}
                </span>
            </div>
        </div>
      </div>

      {/* VISUAL CHART (CSS BASED) */}
      <div className="bg-slate-900 rounded-[30px] p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={100}/></div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Recent Activity Flow</h3>
        
        <div className="flex items-end gap-2 h-32 w-full">
            {recentTx.map((t, i) => {
                // Normalize height for visual (max 100%)
                const height = Math.min((parseFloat(t.amount) / 5000) * 100, 100); 
                return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative">
                        <div 
                            className={`w-full rounded-t-lg transition-all hover:opacity-80 ${t.type === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ height: `${height}%`, minHeight: '10%' }}
                        ></div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            ₹{parseFloat(t.amount).toLocaleString()}
                        </div>
                    </div>
                )
            })}
             {recentTx.length === 0 && <p className="text-slate-500 text-xs w-full text-center">No recent data to visualize.</p>}
        </div>
        <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between text-[10px] text-slate-500 uppercase tracking-widest">
            <span>Older</span>
            <span>Newer</span>
        </div>
      </div>

      {/* FILTERS & TABLE */}
      <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <div className="flex gap-2">
                {['ALL', 'CREDIT', 'DEBIT'].map(type => (
                    <button 
                        key={type} 
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            filterType === type ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                    >
                        {type}
                    </button>
                ))}
             </div>
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                 {filteredTransactions.length} Transactions
             </div>
        </div>

        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-6 font-bold text-slate-500 text-sm flex items-center gap-2">
                            <Calendar size={14}/> {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td className="p-6 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    t.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {t.type === 'CREDIT' ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                                </div>
                                <div>
                                    <p className="group-hover:text-blue-600 transition-colors">{t.description}</p>
                                    <span className="inline-block bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded uppercase mt-1">
                                        {t.category || "General"}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td className="p-6 text-sm font-mono text-slate-400">
                            {t.reference_id ? `#${t.reference_id}` : "-"}
                        </td>
                        <td className={`p-6 text-right font-black text-lg ${
                            t.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'
                        }`}>
                            {t.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString()}
                        </td>
                    </tr>
                ))}
                {filteredTransactions.length === 0 && (
                    <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No transactions match your filter.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounting;