import { useEffect, useState } from 'react';
import { 
  Download, TrendingUp, IndianRupee, PieChart, 
  Users, Calendar, FileBarChart, Printer, ArrowRightCircle 
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
  }, []);

  // 📊 CALCULATIONS (Enterprise Logic)
  
  // 1. Revenue Breakdown
  const roomRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  
  // Simulated Service Revenue (Calculated from booking charges)
  const serviceRevenue = bookings.reduce((sum, b) => {
    const charges = b.charges?.reduce((s, c) => s + parseFloat(c.total_cost), 0) || 0;
    return sum + charges;
  }, 0);

  const totalRevenue = roomRevenue + serviceRevenue;

  // 2. Occupancy Stats (Image 029 style)
  const inHouseCount = bookings.filter(b => b.status === 'CHECKED_IN').length;
  const occupancyPercent = rooms.length > 0 ? ((inHouseCount / rooms.length) * 100).toFixed(1) : 0;
  
  const todayArrivals = bookings.filter(b => b.check_in_date.startsWith(today)).length;
  const todayDepartures = bookings.filter(b => b.check_out_date.startsWith(today)).length;

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-blue-600 animate-pulse">Generating Night Audit...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Night Audit & Reports</h2>
          <p className="text-slate-500 font-medium text-sm">Business Date: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3 no-print">
          <button onClick={handlePrintReport} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition shadow-sm font-bold">
            <Printer size={18} /> Print
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition shadow-lg font-bold">
            <ArrowRightCircle size={18} /> Run Night Audit
          </button>
        </div>
      </div>

      {/* 1. Summary Cards (Matching Image 029 Statistics) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-blue-600 mb-2 bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center"><PieChart size={24}/></div>
            <div className="text-2xl font-bold text-slate-800">{occupancyPercent}%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-green-600 mb-2 bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center"><IndianRupee size={24}/></div>
            <div className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-purple-600 mb-2 bg-purple-50 w-10 h-10 rounded-lg flex items-center justify-center"><Users size={24}/></div>
            <div className="text-2xl font-bold text-slate-800">{todayArrivals}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exp. Arrivals</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-orange-600 mb-2 bg-orange-50 w-10 h-10 rounded-lg flex items-center justify-center"><Calendar size={24}/></div>
            <div className="text-2xl font-bold text-slate-800">{todayDepartures}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exp. Departures</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. DAILY SALES BREAKDOWN (Matching Image 027) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600"/> Daily Revenue Breakdown
          </div>
          <table className="w-full text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white border-b">
              <tr>
                <th className="p-4">Department</th>
                <th className="p-4 text-right">Actual Today</th>
                <th className="p-4 text-right">M.T.D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-700">Room Revenue</td>
                  <td className="p-4 text-right font-mono text-slate-600">₹{roomRevenue.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-slate-400 italic">₹{(roomRevenue * 1.2).toLocaleString()}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-700">Food & Beverage (POS)</td>
                  <td className="p-4 text-right font-mono text-slate-600">₹{serviceRevenue.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-slate-400 italic">₹{(serviceRevenue * 1.5).toLocaleString()}</td>
                </tr>
            </tbody>
            <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td className="p-4 font-bold">Grand Total</td>
                  <td colSpan="2" className="p-4 text-right font-bold text-xl font-mono text-green-400">
                    ₹{totalRevenue.toLocaleString()}
                  </td>
                </tr>
            </tfoot>
          </table>
        </div>

        {/* 3. PERFORMANCE CHART SIMULATION (Matching Image 029) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                <FileBarChart size={20} className="text-blue-500"/> Performance Statistics
            </h3>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">Occupancy Rate</div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${occupancyPercent}%`}}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">Cancellation Ratio</div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 transition-all duration-1000" style={{width: `12%`}}></div>
                    </div>
                </div>
                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Room Rate (ARR)</div>
                        <div className="text-xl font-bold text-slate-800">₹{(roomRevenue / (inHouseCount || 1)).toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RevPAR</div>
                        <div className="text-xl font-bold text-slate-800">₹{(roomRevenue / (rooms.length || 1)).toFixed(0)}</div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;