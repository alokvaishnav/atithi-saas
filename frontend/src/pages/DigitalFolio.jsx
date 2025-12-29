import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, ShieldCheck, Download } from 'lucide-react';
import { API_URL } from '../config';

const DigitalFolio = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolio = async () => {
        try {
            const res = await fetch(`${API_URL}/api/bookings/${id}/public_folio/`);
            if (res.ok) setBooking(await res.json());
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };
    fetchFolio();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!booking) return <div className="h-screen flex items-center justify-center text-slate-400">Folio Not Found</div>;

  const totalPaid = booking.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const grandTotal = parseFloat(booking.total_amount) + (booking.charges?.reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0);
  const balance = grandTotal - totalPaid;

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans flex justify-center">
      <div className="w-full max-w-md bg-white rounded-[30px] shadow-xl overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-30"></div>
            <ShieldCheck size={40} className="mx-auto mb-4 relative z-10 text-blue-400"/>
            <h1 className="text-xl font-black uppercase tracking-widest relative z-10">{booking.hotel_name || "ATITHI HOTEL"}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 relative z-10">Digital Guest Folio</p>
        </div>

        <div className="p-8">
            <div className="text-center mb-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Welcome, Guest</p>
                <h2 className="text-2xl font-black text-slate-800">{booking.guest_name}</h2>
                <div className="inline-block px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mt-2">
                    Room {booking.room_number}
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500">Check In</span>
                    <span className="text-xs font-black text-slate-800">{booking.check_in_date}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500">Check Out</span>
                    <span className="text-xs font-black text-slate-800">{booking.check_out_date}</span>
                </div>
            </div>

            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Charges</h3>
            <div className="space-y-3 mb-8">
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-slate-600">Room Tariff</span>
                    <span className="text-sm font-black text-slate-800">₹{parseFloat(booking.total_amount).toLocaleString()}</span>
                </div>
                {booking.charges?.map((c, i) => (
                    <div key={i} className="flex justify-between">
                        <span className="text-sm font-medium text-slate-500">{c.description}</span>
                        <span className="text-sm font-bold text-slate-700">₹{parseFloat(c.amount).toLocaleString()}</span>
                    </div>
                ))}
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                    <span>Total</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-green-600">
                    <span>Paid</span>
                    <span>- ₹{totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-slate-900 border-t border-slate-200 pt-3 mt-2">
                    <span>Balance</span>
                    <span>₹{balance.toLocaleString()}</span>
                </div>
            </div>

            <button onClick={() => window.print()} className="w-full py-4 mt-8 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <Download size={16}/> Download Receipt
            </button>
        </div>

      </div>
    </div>
  );
};

export default DigitalFolio;