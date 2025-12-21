import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Download, CreditCard, CheckCircle, 
  Clock, Calendar, User, ShieldCheck, Mail, Phone, 
  Loader2, ArrowLeft, FileText, IndianRupee 
} from 'lucide-react';
import { API_URL } from '../config';

const Folio = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false); // ⏳ State for PDF Button

  const token = localStorage.getItem('access_token');

  // 1️⃣ Fetch Booking & Charges Data
  useEffect(() => {
    const fetchFolioData = async () => {
      try {
        setLoading(true);
        
        // A. Fetch Booking Details
        const bookingRes = await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookingData = await bookingRes.json();
        
        // B. Fetch Extra Charges (Services/Food)
        // We fetch this separately to ensure we get all line items clearly
        const chargesRes = await fetch(`${API_URL}/api/charges/?booking=${bookingId}`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        const chargesData = await chargesRes.json();

        if (bookingRes.ok) setBooking(bookingData);
        if (chargesRes.ok) setCharges(Array.isArray(chargesData) ? chargesData : []);
        
      } catch (err) {
        console.error("Error fetching folio:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFolioData();
  }, [bookingId, token]);

  // 2️⃣ Handle PDF Download Logic
  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      
      const res = await fetch(`${API_URL}/api/invoice/${bookingId}/pdf/`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}` 
        }
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      // Convert response to a Blob (Binary Large Object)
      const blob = await res.blob();
      
      // Create a temporary link to download it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_#${bookingId}_${booking?.guest_name || 'Guest'}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("⚠️ Error generating invoice. Please check if backend templates are set up.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Folio...</p>
       </div>
    </div>
  );

  if (!booking) return <div className="p-10 text-center text-red-500 font-bold">Folio Not Found</div>;

  // 🧮 Calculate Totals (Frontend fallback calculation)
  const roomTotal = parseFloat(booking.total_amount || 0);
  const extrasTotal = charges.reduce((acc, curr) => acc + parseFloat(curr.total_cost || 0), 0);
  const grandTotal = roomTotal + extrasTotal;
  const advance = parseFloat(booking.advance_paid || 0);
  const balance = grandTotal - advance;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* 🔙 Navigation Header */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/bookings')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase text-xs tracking-widest">
            <ArrowLeft size={16}/> Back to Reservations
        </button>
        <div className="flex gap-3">
             {/* 🖨️ PDF BUTTON */}
             <button 
                onClick={handleDownloadPDF} 
                disabled={pdfLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 uppercase text-xs tracking-widest"
             >
                {pdfLoading ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                {pdfLoading ? 'Generating...' : 'Download Invoice'}
             </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📄 LEFT: INVOICE PAPER VIEW */}
        <div className="lg:col-span-2 bg-white rounded-[30px] shadow-sm border border-slate-200 overflow-hidden relative">
            
            {/* Invoice Header */}
            <div className="bg-slate-900 text-white p-10 flex justify-between items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Invoice</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">#INV-{booking.id}-{new Date().getFullYear()}</p>
                </div>
                <div className="relative z-10 text-right">
                    <div className="bg-white/10 p-3 rounded-xl inline-flex items-center justify-center mb-2">
                        <FileText className="text-blue-400" size={24}/>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</div>
                    <div className={`text-sm font-black uppercase ${booking.status === 'CHECKED_OUT' ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {booking.status?.replace('_', ' ') || 'ACTIVE'}
                    </div>
                </div>
            </div>

            {/* Guest & Stay Details */}
            <div className="p-10 grid grid-cols-2 gap-12 border-b border-slate-100">
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Billed To Guest</h4>
                    <div className="flex items-center gap-3 mb-2">
                        <User size={16} className="text-blue-600"/>
                        {/* Handles both 'guest_name' (flat) or 'guest_details.full_name' (nested) */}
                        <span className="font-bold text-slate-800 text-lg">
                            {booking.guest_name || booking.guest_details?.full_name || 'Guest'}
                        </span>
                    </div>
                    <div className="space-y-1 pl-7">
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Phone size={12}/> {booking.guest_phone || booking.guest_details?.phone || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Stay Details</h4>
                    <div className="space-y-2">
                        <div className="flex justify-end items-center gap-3">
                            <span className="font-bold text-slate-800">Room {booking.room_number || booking.room_details?.room_number || 'N/A'}</span>
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><CreditCard size={14}/></div>
                        </div>
                        <div className="flex justify-end items-center gap-3">
                            <span className="text-sm font-medium text-slate-500">
                                {booking.check_in_date} — {booking.check_out_date}
                            </span>
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><Calendar size={14}/></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="p-10">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-600">
                        {/* Base Room Charge */}
                        <tr className="border-b border-slate-50">
                            <td className="py-4">
                                <div className="font-bold text-slate-800">Accommodation Charges</div>
                                <div className="text-xs text-slate-400">Room Rent for Stay Duration</div>
                            </td>
                            <td className="py-4 text-right font-bold">₹{roomTotal.toLocaleString()}</td>
                        </tr>
                        
                        {/* Extras */}
                        {charges.map((charge, i) => (
                            <tr key={i} className="border-b border-slate-50">
                                <td className="py-4">
                                    <div className="font-bold text-slate-800">{charge.description || charge.service_name || 'Service Charge'}</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider text-[10px]">{charge.category || 'MISC'} (Qty: {charge.quantity})</div>
                                </td>
                                <td className="py-4 text-right font-bold">₹{parseFloat(charge.total_cost).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="bg-slate-50 p-10">
                <div className="flex flex-col gap-3 max-w-xs ml-auto">
                    <div className="flex justify-between text-sm font-medium text-slate-500">
                        <span>Subtotal</span>
                        <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-emerald-600">
                        <span>Advance Paid</span>
                        <span>- ₹{advance.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 my-2"></div>
                    <div className="flex justify-between text-xl font-black text-slate-900">
                        <span>Total Due</span>
                        <span>₹{balance.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 💳 RIGHT: ACTION PANEL */}
        <div className="space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[30px] shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase mb-1">Quick Actions</h3>
                    <p className="text-slate-400 text-xs mb-6 font-medium">Manage this guest folio instantly.</p>
                    
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all mb-3 text-sm uppercase tracking-widest shadow-lg">
                        <CreditCard size={18}/> Record Payment
                    </button>
                    
                    {booking.status !== 'CHECKED_OUT' && (
                        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-sm uppercase tracking-widest shadow-lg">
                            <CheckCircle size={18}/> Complete Checkout
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-200">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Payment History</h3>
                {advance > 0 ? (
                    <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CheckCircle size={16}/></div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">Advance Payment</div>
                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Received</div>
                        </div>
                        <div className="ml-auto font-black text-slate-800">₹{advance}</div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 text-sm font-medium py-4">No payments recorded yet.</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Folio;