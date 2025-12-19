import { useEffect, useState } from 'react';
import { 
  Download, TrendingUp, IndianRupee, PieChart, 
  Users, Calendar, FileBarChart, Printer, ArrowRightCircle, ShieldCheck
} from 'lucide-react';
import { API_URL } from '../config'; 

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        const [resB, resR] = await Promise.all([
          fetch(API_URL + '/api/bookings/', { headers }),
          fetch(API_URL + '/api/rooms/', { headers })
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

  // 📊 PROFESSIONAL AUDIT CALCULATIONS
  
  // 1. Room Revenue Logic (Split by Net and Tax)
  const roomNet = bookings.reduce((sum, b) => sum + parseFloat(b.subtotal_amount || 0), 0);
  const roomTax = bookings.reduce((sum, b) => sum + parseFloat(b.tax_amount || 0), 0);
  
  // 2. POS/Service Revenue Logic (Split by Net and Tax)
  const posNet = bookings.reduce((sum, b) => {
    const chargesNet = b.charges?.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0) || 0;
    return sum + chargesNet;
  }, 0);
  
  const posTax = bookings.reduce((sum, b) => {
    const chargesTax = b.charges?.reduce((s, c) => s + parseFloat(c.tax_amount || 0), 0) || 0;
    return sum + chargesTax;
  }, 0);

  const totalNetRevenue = roomNet + posNet;
  const totalTaxCollected = roomTax + posTax;
  const grandTotal = totalNetRevenue + totalTaxCollected;

  // 3. Occupancy Statistics
  const inHouseCount = bookings.filter(b => b.status === 'CHECKED_IN').length;
  const occupancyPercent = rooms.length > 0 ? ((inHouseCount / rooms.length) * 100).toFixed(1) : 0;
  
  const todayArrivals = bookings.filter(b => b.check_in_date?.startsWith(today)).length;
  const todayDepartures = bookings.filter(b => b.check_out_date?.startsWith(today)).length;

  const handlePrintReport = () => { window.print(); };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-blue-600 font-bold animate-pulse flex items-center gap-2">
        <ArrowRightCircle className="animate-spin" /> Compiling Night Audit...
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Financial Audit</h2>
          <p className="text-slate-500 font-medium">System Date: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrintReport} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 shadow-sm font-bold">
            <Printer size={18} /> Export PDF
          </button>
          <button className="bg-slate-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-black transition shadow-lg font-bold">
            <ShieldCheck size={18} /> Finalize Night Audit
          </button>
        </div>
      </div>

      {/* 1. FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Net Revenue (Earnings)</div>
            <div className="text-3xl font-black text-slate-800">₹{totalNetRevenue.toLocaleString()}</div>
            <div className="mt-2 text-[10px] text-green-600 font-bold bg-green-50 w-fit px-2 py-0.5 rounded">Excluding GST</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-blue-600 text-[10px] font-black uppercase mb-1 tracking-widest text-opacity-70">GST Collected (Liability)</div>
            <div className="text-3xl font-black text-blue-600">₹{totalTaxCollected.toLocaleString()}</div>
            <div className="mt-2 text-[10px] text-blue-600 font-bold bg-blue-50 w-fit px-2 py-0.5 rounded">Tax Liability</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-blue-600">
            <div className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Grand Total (Cash In)</div>
            <div className="text-3xl font-black text-slate-900">₹{grandTotal.toLocaleString()}</div>
            <div className="mt-2 text-[10px] text-slate-500 font-bold bg-slate-100 w-fit px-2 py-0.5 rounded">Including All Taxes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. TAX BREAKDOWN TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-widest">
            <TrendingUp size={16} className="text-blue-600"/> Revenue & Tax Analysis
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-slate-400 uppercase bg-white border-b font-black">
              <tr>
                <th className="p-4">Department</th>
                <th className="p-4 text-right">Net Sales</th>
                <th className="p-4 text-right">Tax Value</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-700">Room Division</td>
                  <td className="p-4 text-right font-mono text-slate-600">₹{roomNet.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-blue-500">₹{roomTax.toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-slate-800">₹{(roomNet + roomTax).toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-700">F&B / Services</td>
                  <td className="p-4 text-right font-mono text-slate-600">₹{posNet.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-blue-500">₹{posTax.toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-slate-800">₹{(posNet + posTax).toLocaleString()}</td>
                </tr>
            </tbody>
            <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td className="p-4 font-bold">Consolidated Total</td>
                  <td className="p-4 text-right font-bold">₹{totalNetRevenue.toLocaleString()}</td>
                  <td className="p-4 text-right font-bold">₹{totalTaxCollected.toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-green-400">₹{grandTotal.toLocaleString()}</td>
                </tr>
            </tfoot>
          </table>
        </div>

        {/* 3. PERFORMANCE STATISTICS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                <FileBarChart size={18} className="text-blue-500"/> Key Metrics (KPIs)
            </h3>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase">Room Occupancy</div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${occupancyPercent}%`}}></div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Room Rate (ARR)</div>
                        <div className="text-xl font-black text-slate-800">₹{(roomNet / (inHouseCount || 1)).toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RevPAR</div>
                        <div className="text-xl font-black text-slate-800">₹{(roomNet / (rooms.length || 1)).toFixed(0)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-800">{todayArrivals}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Today Arrivals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-800">{todayDepartures}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Today Departures</div>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;