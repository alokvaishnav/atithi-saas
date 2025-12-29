import { useEffect, useState } from 'react';
import { 
  BarChart3, Download, TrendingUp, Calendar, FileText 
} from 'lucide-react';
import { API_URL } from '../config';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/analytics/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setData(await res.json());
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Generating Report...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Financial Audit</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Generated: {new Date().toLocaleDateString()}</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2">
            <Download size={16}/> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Total Revenue</h3>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{(data?.financials?.total_rev || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Total Expenses</h3>
            <p className="text-4xl font-black text-red-500 tracking-tighter">-₹{(data?.financials?.total_expenses || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[30px] shadow-xl text-white">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Net Profit</h3>
            <p className="text-4xl font-black tracking-tighter italic">₹{(data?.financials?.net_profit || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 uppercase italic mb-6">7-Day Transaction Log</h3>
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Revenue</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data?.trend?.map((day, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-600 flex items-center gap-2">
                            <Calendar size={14}/> {day.date}
                        </td>
                        <td className="p-4 font-black text-slate-800 text-right">
                            ₹{parseFloat(day.daily_revenue).toLocaleString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;