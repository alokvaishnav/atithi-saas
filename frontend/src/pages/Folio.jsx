import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, IndianRupee, Printer, ArrowLeft, 
  Plus, Receipt, User, Calendar
} from 'lucide-react';
import { API_URL } from '../config';

const Folio = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('access_token');

  const fetchFolioData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBooking(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFolioData(); }, [bookingId]);

  if (loading) return <div className="p-8 text-blue-600">Loading Folio...</div>;
  if (!booking) return <div className="p-8 text-red-600">Folio Not Found</div>;

  const roomCharges = parseFloat(booking.total_amount);
  const serviceCharges = booking.charges?.reduce((sum, item) => sum + parseFloat(item.total_cost), 0) || 0;
  const grandTotal = roomCharges + serviceCharges;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* 🔙 BACK BUTTON & HEADER */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold">
          <ArrowLeft size={20}/> Back to List
        </button>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 font-bold text-slate-700">
            <Printer size={18}/> Print Folio
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-bold shadow-lg">
            <Receipt size={18}/> Settle Bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 👤 LEFT COLUMN: GUEST & STAY INFO (Matches image017 layout) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Guest Information</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                {booking.guest_details?.full_name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-lg text-slate-800">{booking.guest_details?.full_name}</div>
                <div className="text-sm text-slate-500">{booking.guest_details?.phone}</div>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Room Number</span>
                <span className="font-bold text-blue-600">Room {booking.room_details?.room_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Check In</span>
                <span className="font-bold">{booking.check_in_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Check Out</span>
                <span className="font-bold">{booking.check_out_date}</span>
              </div>
            </div>
          </div>

          {/* 💰 SUMMARY CARD */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-slate-400 text-xs font-bold uppercase mb-4">Total Balance Due</h3>
            <div className="text-4xl font-bold mb-2">₹{grandTotal.toLocaleString()}</div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Room: ₹{roomCharges}</span>
              <span>Services: ₹{serviceCharges}</span>
            </div>
          </div>
        </div>

        {/* 📑 RIGHT COLUMN: DETAILED TRANSACTIONS (Matches image027/029) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
              Folio Transactions
            </div>
            <table className="w-full text-left">
              <thead className="text-xs text-slate-400 uppercase bg-white border-b">
                <tr>
                  <th className="p-4">Description</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Room Posting */}
                <tr className="border-b border-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-700">Room Accommodation</div>
                    <div className="text-xs text-slate-400">{booking.check_in_date} to {booking.check_out_date}</div>
                  </td>
                  <td className="p-4 text-slate-500">1</td>
                  <td className="p-4 text-right font-bold text-slate-700">₹{roomCharges}</td>
                </tr>

                {/* Service Postings */}
                {booking.charges?.map((charge, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{charge.service_name}</div>
                      <div className="text-xs text-slate-400">POS Entry</div>
                    </td>
                    <td className="p-4 text-slate-500">{charge.quantity}</td>
                    <td className="p-4 text-right font-bold text-slate-700">₹{charge.total_cost}</td>
                  </tr>
                ))}

                {booking.charges?.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-400 italic">No extra charges posted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Folio;