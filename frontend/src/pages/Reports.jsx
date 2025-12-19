import { useEffect, useState } from 'react';
import { Download, TrendingUp, IndianRupee, PieChart } from 'lucide-react';
import { API_URL } from '../config'; 

const Reports = () => {
  const [bookings, setBookings] = useState([]);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetch(API_URL + '/api/bookings/', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setBookings(data));
  }, []);

  // 📊 CALCULATIONS
  const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN').length;
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
  
  // Calculate Revenue per Room Type (Simple Logic)
  const revenueByRoom = bookings.reduce((acc, curr) => {
    const roomNum = curr.room_details?.room_number || 'Unknown';
    acc[roomNum] = (acc[roomNum] || 0) + parseFloat(curr.total_amount);
    return acc;
  }, {});

  const handlePrintReport = () => {
    window.print(); // Simple browser print (Save as PDF)
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Financial Reports</h2>
        <button onClick={handlePrintReport} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-slate-700">
          <Download size={18} /> Export PDF
        </button>
      </div>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center gap-3 mb-2 text-green-700 font-bold">
            <IndianRupee size={20}/> Total Revenue
          </div>
          <div className="text-3xl font-bold text-slate-800">₹{totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3 mb-2 text-blue-700 font-bold">
            <TrendingUp size={20}/> Active Bookings
          </div>
          <div className="text-3xl font-bold text-slate-800">{confirmedBookings}</div>
        </div>

        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <div className="flex items-center gap-3 mb-2 text-red-700 font-bold">
            <PieChart size={20}/> Cancellations
          </div>
          <div className="text-3xl font-bold text-slate-800">{cancelledBookings}</div>
        </div>
      </div>

      {/* 2. Room Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
          Revenue by Room
        </div>
        <table className="w-full text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b">
            <tr><th className="p-4">Room Number</th><th className="p-4 text-right">Total Earned</th></tr>
          </thead>
          <tbody>
            {Object.entries(revenueByRoom).map(([room, amount]) => (
              <tr key={room} className="border-b border-slate-50">
                <td className="p-4 font-bold text-slate-700">Room {room}</td>
                <td className="p-4 text-right font-mono text-green-600">₹{amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;