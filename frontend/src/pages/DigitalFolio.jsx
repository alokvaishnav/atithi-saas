import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Loader2, ShieldCheck, Download, Share2, 
  MapPin, Phone, CheckCircle, AlertCircle, 
  QrCode, Copy 
} from 'lucide-react';
import { API_URL } from '../config';

const DigitalFolio = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFolio = async () => {
        try {
            const res = await fetch(`${API_URL}/api/bookings/${id}/public_folio/`);
            if (res.ok) {
                setBooking(await res.json());
            }
        } catch (err) { 
            console.error("Failed to fetch folio:", err); 
        } finally { 
            setLoading(false); 
        }
    };
    fetchFolio();
  }, [id]);

  const handleShare = async () => {
    const shareData = {
      title: `${booking?.hotel_name} - Invoice`,
      text: `Here is the invoice for ${booking?.guest_name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10"/>
    </div>
  );
  
  if (!booking) return (
    <div className="h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">
        Folio Not Found
    </div>
  );

  // Financial Calculations
  const totalPaid = booking.payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
  
  // Grand Total = Room Tariff + Extra Charges
  const roomTariff = parseFloat(booking.total_amount || 0);
  const extraCharges = booking.charges?.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0) || 0;
  const grandTotal = roomTariff + extraCharges;
  
  const balance = grandTotal - totalPaid;
  const isPaid = balance <= 0;

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans flex justify-center py-10">
      <div className="w-full max-w-lg bg-white rounded-[30px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* HEADER BRANDING */}
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-30"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <ShieldCheck size={40} className="text-blue-400 mb-3"/>
                <h1 className="text-xl font-black uppercase tracking-widest">{booking.hotel_name || "ATITHI HOTEL"}</h1>
                
                <div className="flex items-center gap-4 mt-3 text-slate-400">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                        <MapPin size={10}/> Main Street, India
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                        <Phone size={10}/> +91 98765 43210
                    </div>
                </div>
            </div>
        </div>

        {/* CONTENT BODY */}
        <div className="p-8 flex-1">
            
            {/* STATUS BADGE */}
            <div className="flex justify-center -mt-12 mb-6 relative z-20">
                <div className={`px-6 py-2 rounded-full shadow-lg border-4 border-white flex items-center gap-2 ${isPaid ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                    {isPaid ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isPaid ? "Fully Paid" : "Payment Due"}
                    </span>
                </div>
            </div>

            {/* GUEST INFO */}
            <div className="text-center mb-8 border-b border-slate-100 pb-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bill To</p>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{booking.guest_name}</h2>
                <div className="inline-block px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
                    Room {booking.room_number || "N/A"}
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                    INV-{booking.id}-{new Date().getFullYear()}
                </p>
            </div>

            {/* DATES GRID */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Check In</span>
                    <span className="text-sm font-black text-slate-800">{booking.check_in_date}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Check Out</span>
                    <span className="text-sm font-black text-slate-800">{booking.check_out_date}</span>
                </div>
            </div>

            {/* CHARGES BREAKDOWN */}
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Invoice Details</h3>
            <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center group">
                    <span className="text-sm font-bold text-slate-600">Room Charges</span>
                    <span className="text-sm font-black text-slate-800">₹{roomTariff.toLocaleString()}</span>
                </div>
                
                {booking.charges?.map((c, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-500">{c.description}</span>
                        <span className="text-sm font-bold text-slate-700">₹{parseFloat(c.amount).toLocaleString()}</span>
                    </div>
                ))}
            </div>

            {/* PAYMENT HISTORY */}
            {booking.payments && booking.payments.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment History</h3>
                    <div className="space-y-2">
                        {booking.payments.map((p, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-emerald-50 p-2 px-3 rounded-lg border border-emerald-100">
                                <span className="font-bold text-emerald-700 uppercase">{p.payment_mode || "Payment"}</span>
                                <span className="font-black text-emerald-700">- ₹{parseFloat(p.amount).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOTALS BOX */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-2 shadow-xl shadow-slate-200">
                <div className="flex justify-between text-sm font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-400">
                    <span>Total Paid</span>
                    <span>- ₹{totalPaid.toLocaleString()}</span>
                </div>
                <div className="h-px bg-white/20 my-2"></div>
                <div className="flex justify-between text-xl font-black">
                    <span>Balance Due</span>
                    <span>₹{balance.toLocaleString()}</span>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                    onClick={handleShare}
                    className="py-4 bg-slate-100 text-slate-700 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                    {copied ? <CheckCircle size={14}/> : <Share2 size={14}/>} {copied ? "Copied" : "Share"}
                </button>
                <button 
                    onClick={() => window.print()} 
                    className="py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    <Download size={14}/> Download
                </button>
            </div>
            
            {/* QR CODE FOOTER */}
            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
                <QrCode size={48} className="text-slate-800 mb-2"/>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Scan to verify authenticity</p>
                <p className="text-[8px] text-slate-300 mt-1">Generated by Atithi HMS</p>
            </div>

        </div>

      </div>
    </div>
  );
};

export default DigitalFolio;