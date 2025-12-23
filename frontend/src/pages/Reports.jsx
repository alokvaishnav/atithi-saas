import { useEffect, useState } from 'react';
import { 
  TrendingUp, FileBarChart, Printer, ShieldCheck, 
  Landmark, Wallet, PieChart, Activity, Calendar
} from 'lucide-react';
import { API_URL } from '../config'; 

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🗓️ DATE FILTER STATE (Default: Current Month)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const token = localStorage.getItem('access_token');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Parallel Fetching for speed
        const [resB, resR] = await Promise.all([
          fetch(`${API_URL}/api/bookings/`, { headers }),
          fetch(`${API_URL}/api/rooms/`, { headers })
        ]);

        const bData = await resB.json();
        const rData = await resR.json();
        
        setBookings(Array.isArray(bData) ? bData : []);
        setRooms(Array.isArray(rData) ? rData : []);
      } catch (err) {
        console.error("Report Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // 🔍 FILTER DATA BY DATE RANGE
  const filteredBookings = bookings.filter(b => {
      const checkIn = b.check_in_date?.split('T')[0];
      return checkIn >= startDate && checkIn <= endDate;
  });

  // 📊 PROFESSIONAL AUDIT CALCULATIONS (Based on Filtered Data)
  
  // 1. Room Revenue Logic (Base and Tax)
  const roomNet = filteredBookings.reduce((sum, b) => sum + parseFloat(b.subtotal_amount || 0), 0);
  const roomTax = filteredBookings.reduce((sum, b) => sum + parseFloat(b.tax_amount || 0), 0);
  
  // 2. POS/Service Revenue Logic (Base and Tax)
  const posNet = filteredBookings.reduce((sum, b) => {
    const chargesNet = b.charges?.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0) || 0;
    return sum + chargesNet;
  }, 0);
  
  const posTax = filteredBookings.reduce((sum, b) => {
    const chargesTax = b.charges?.reduce((s, c) => s + parseFloat(c.tax_amount || 0), 0) || 0;
    return sum + chargesTax;
  }, 0);

  const totalNetRevenue = roomNet + posNet;
  const totalTaxCollected = roomTax + posTax;
  const grandTotal = totalNetRevenue + totalTaxCollected;

  // 3. Operational KPIs (Live Status - Not Filtered by Date)
  const inHouseCount = bookings.filter(b => b.status === 'CHECKED_IN').length;
  const occupancyPercent = rooms.length > 0 ? ((inHouseCount / rooms.length) * 100).toFixed(1) : 0;
  
  const todayArrivals = bookings.filter(b => b.check_in_date?.split('T')[0] === today).length;
  const todayDepartures = bookings.filter(b => b.check_out_date?.split('T')[0] === today).length;

  const handlePrintReport = () => { window.print(); };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-blue-600 font-bold animate-pulse flex items-center gap-3 bg-white p-6 rounded-3xl shadow-xl border border-blue-50">
        <Activity className="animate-spin" /> Compiling Financial Intelligence...
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 no-print">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Tax & Financial Audit</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
            Night Audit Summary • {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
          </p>
        </div>

        {/* 🗓️ DATE FILTERS */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-3">
                <Calendar size={16} className="text-slate-400"/>
                <span className="text-[10px] font-black uppercase text-slate-400">Range:</span>
            </div>
            <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none"
            />
            <span className="text-slate-300 font-black">-</span>
            <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-700 p-2 outline-none"
            />
        </div>

        <div className="flex gap-4">
          <button onClick={handlePrintReport} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-slate-50 shadow-sm font-black text-xs uppercase transition-all">
            <Printer size={18} className="text-blue-600" /> Export PDF
          </button>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 font-black text-xs uppercase">
            <ShieldCheck size={18} /> Close Day Audit
          </button>
        </div>
      </div>

      {/* 1. FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Wallet size={20}/></div>
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Net Sales (Ex. Tax)</div>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tighter">₹{totalNetRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1 uppercase tracking-tighter">Verified Room & POS Revenue</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Landmark size={20}/></div>
                <div className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">GST Liability (Payable)</div>
            </div>
            <div className="text-4xl font-black text-blue-600 tracking-tighter">₹{totalTaxCollected.toLocaleString()}</div>
            <p className="text-[10px] text-blue-400 font-bold mt-2 uppercase tracking-tighter">Total Tax Collected from Guests</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl border-b-8 border-blue-600">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white"><PieChart size={20}/></div>
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Consolidated Total</div>
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">₹{grandTotal.toLocaleString()}</div>
            <p className="text-[10px] text-blue-400 font-bold mt-2 uppercase tracking-tighter">Final Net Cashflow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 2. TAX BREAKDOWN TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-[0.2em]">
            <TrendingUp size={16} className="text-blue-600"/> Revenue Stream Analysis
          </div>
          <table className="w-full text-left">
            <thead className="text-[9px] text-slate-400 uppercase bg-white border-b font-black tracking-widest">
              <tr>
                <th className="p-6">Revenue Department</th>
                <th className="p-6 text-right">Net Sales</th>
                <th className="p-6 text-right">Tax Value</th>
                <th className="p-6 text-right">Total (Incl. Tax)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50 group transition-colors">
                  <td className="p-6 font-black text-slate-800">Room Division Revenue</td>
                  <td className="p-6 text-right font-mono text-slate-500">₹{roomNet.toLocaleString()}</td>
                  <td className="p-6 text-right font-mono text-blue-500">₹{roomTax.toLocaleString()}</td>
                  <td className="p-6 text-right font-black text-slate-900 group-hover:text-blue-600">₹{(roomNet + roomTax).toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50 group transition-colors">
                  <td className="p-6 font-black text-slate-800">F&B & Ancillary Services</td>
                  <td className="p-6 text-right font-mono text-slate-500">₹{posNet.toLocaleString()}</td>
                  <td className="p-6 text-right font-mono text-blue-500">₹{posTax.toLocaleString()}</td>
                  <td className="p-6 text-right font-black text-slate-900 group-hover:text-blue-600">₹{(posNet + posTax).toLocaleString()}</td>
                </tr>
            </tbody>
            <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td className="p-6 font-black uppercase text-[10px] tracking-widest">Grand Summary</td>
                  <td className="p-6 text-right font-black">₹{totalNetRevenue.toLocaleString()}</td>
                  <td className="p-6 text-right font-black">₹{totalTaxCollected.toLocaleString()}</td>
                  <td className="p-6 text-right font-black text-green-400 text-lg">₹{grandTotal.toLocaleString()}</td>
                </tr>
            </tfoot>
          </table>
        </div>

        {/* 3. PERFORMANCE STATISTICS */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-2 uppercase text-xs tracking-[0.2em]">
                <FileBarChart size={18} className="text-blue-500"/> Operational KPIs
            </h3>
            
            <div className="space-y-10">
                <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                        Room Occupancy Index <span>{occupancyPercent}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-50 rounded-full p-1 border border-slate-100">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-sm" style={{width: `${occupancyPercent}%`}}></div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 border-t border-slate-50 pt-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Room Rate</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tighter">₹{(roomNet / (inHouseCount || 1)).toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">RevPAR</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tighter">₹{(roomNet / (rooms.length || 1)).toFixed(0)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-blue-600 p-6 rounded-[24px] text-white shadow-xl shadow-blue-100">
                  <div className="text-center border-r border-white/10">
                    <div className="text-3xl font-black tracking-tighter">{todayArrivals}</div>
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Arrivals Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black tracking-tighter">{todayDepartures}</div>
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Departures Today</div>
                  </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* PRINT-ONLY FOOTER */}
      <div className="hidden print:block mt-20 border-t border-slate-900 pt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-[0.4em]">
        End of Night Audit Report • System Generated
      </div>
    </div>
  );
};

export default Reports;