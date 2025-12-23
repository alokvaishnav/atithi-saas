import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Download, CreditCard, CheckCircle, 
  Clock, Calendar, User, ShieldCheck, Mail, Phone, 
  Loader2, ArrowLeft, FileText, Globe, Send, LogOut 
} from 'lucide-react'; 
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../config';

const Folio = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ⏳ Action States
  const [pdfLoading, setPdfLoading] = useState(false); 
  const [emailLoading, setEmailLoading] = useState(false); 
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payingOnline, setPayingOnline] = useState(false); // 👈 New: Razorpay State

  const token = localStorage.getItem('access_token');
  const componentRef = useRef();

  // 1️⃣ Fetch Booking Data
  const fetchFolioData = async () => {
    try {
      setLoading(true);
      const bookingRes = await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookingData = await bookingRes.json();
      
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

  useEffect(() => { fetchFolioData(); }, [bookingId, token]);

  // 🧮 Calculate Totals
  const calculateTotals = () => {
      if (!booking) return { roomTotal: 0, extrasTotal: 0, grandTotal: 0, advance: 0, balance: 0 };
      const roomTotal = parseFloat(booking.total_amount || 0);
      const extrasTotal = charges.reduce((acc, curr) => acc + parseFloat(curr.total_cost || 0), 0);
      const grandTotal = roomTotal + extrasTotal;
      const advance = parseFloat(booking.amount_paid || 0); 
      const balance = grandTotal - advance;
      return { roomTotal, extrasTotal, grandTotal, advance, balance };
  };

  const { roomTotal, extrasTotal, grandTotal, advance, balance } = calculateTotals();

  // 💰 HANDLE MANUAL PAYMENT (Cash/Card)
  const handleManualPayment = async () => {
      if (!paymentAmount || parseFloat(paymentAmount) <= 0) return alert("Enter valid amount");
      try {
          const newPaid = parseFloat(booking.amount_paid || 0) + parseFloat(paymentAmount);
          const res = await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ amount_paid: newPaid })
          });
          if (res.ok) {
              alert("Payment Recorded! 💰");
              setPaymentAmount('');
              fetchFolioData();
          }
      } catch (err) { console.error(err); }
  };

  // 🌐 HANDLE RAZORPAY ONLINE PAYMENT [NEW FEATURE]
  
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
  };

  const handleOnlinePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return alert("Enter valid amount");
    
    setPayingOnline(true);
    const res = await loadRazorpayScript();

    if (!res) {
        alert("Razorpay SDK failed to load. Check your internet connection.");
        setPayingOnline(false);
        return;
    }

    try {
        // 1. Create Order on Backend
        const orderRes = await fetch(`${API_URL}/api/payment/create/`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount: paymentAmount, booking_id: bookingId })
        });
        const orderData = await orderRes.json();

        if (!orderRes.ok) throw new Error(orderData.error);

        // 2. Open Razorpay Options
        const options = {
            key: orderData.key_id, 
            amount: orderData.amount, 
            currency: "INR",
            name: "Atithi Hotel",
            description: `Payment for Booking #${bookingId}`,
            order_id: orderData.order_id,
            handler: async function (response) {
                // 3. Verify Payment on Backend
                try {
                    const verifyRes = await fetch(`${API_URL}/api/payment/verify/`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            booking_id: bookingId,
                            amount: paymentAmount
                        })
                    });
                    
                    if (verifyRes.ok) {
                        alert("✅ Payment Successful!");
                        setPaymentAmount('');
                        fetchFolioData();
                    } else {
                        alert("⚠️ Payment Verification Failed");
                    }
                } catch (err) {
                    console.error(err);
                    alert("Server Error during Verification");
                }
            },
            prefill: {
                name: booking.guest_details?.full_name,
                email: booking.guest_details?.email,
                contact: booking.guest_details?.phone
            },
            theme: { color: "#2563eb" }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

    } catch (err) {
        console.error("Payment Error:", err);
        alert("Error initializing payment.");
    } finally {
        setPayingOnline(false);
    }
  };

  // --- Utility Functions ---
  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      const res = await fetch(`${API_URL}/api/invoice/${bookingId}/pdf/`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_#${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("⚠️ PDF Error."); } finally { setPdfLoading(false); }
  };

  const handleEmailInvoice = async () => {
      if(!window.confirm(`Send invoice to guest?`)) return;
      try {
          setEmailLoading(true);
          const res = await fetch(`${API_URL}/api/invoice/${bookingId}/email/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) alert("✅ Email Sent!");
          else alert("❌ Failed.");
      } catch (e) { alert("Network Error."); } finally { setEmailLoading(false); }
  };

  const handleCheckout = async () => {
      if (balance > 0 && !window.confirm(`Balance of ₹${balance} pending. Checkout anyway?`)) return;
      try {
          const res = await fetch(`${API_URL}/api/bookings/${bookingId}/checkout/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) { alert("Guest Checked Out! 👋"); navigate('/dashboard'); }
      } catch (err) { console.error(err); }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: `Invoice_${bookingId}`,
  });

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!booking) return <div className="p-10 text-center text-red-500 font-bold">Folio Not Found</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* 🔙 Navigation Header */}
      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={() => navigate('/bookings')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase text-xs tracking-widest">
            <ArrowLeft size={16}/> Back to Reservations
        </button>
        <div className="flex gap-3">
             <button onClick={handleEmailInvoice} disabled={emailLoading} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-black shadow-sm hover:bg-slate-50 transition-all uppercase text-xs tracking-widest">
                {emailLoading ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Email
             </button>
             <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-black shadow-sm hover:bg-slate-50 transition-all uppercase text-xs tracking-widest">
                <Printer size={18}/> Print
             </button>
             <button onClick={handleDownloadPDF} disabled={pdfLoading} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">
                {pdfLoading ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>} PDF
             </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📄 LEFT: INVOICE PAPER VIEW */}
        <div className="lg:col-span-2 bg-white rounded-[30px] shadow-sm border border-slate-200 overflow-hidden relative" ref={componentRef}>
            {/* Invoice Header */}
            <div className="bg-slate-900 text-white p-10 flex justify-between items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Invoice</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">#INV-{booking.id}-{new Date().getFullYear()}</p>
                </div>
                <div className="relative z-10 text-right">
                    <div className="bg-white/10 p-3 rounded-xl inline-flex items-center justify-center mb-2"><FileText className="text-blue-400" size={24}/></div>
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
                        <span className="font-bold text-slate-800 text-lg">{booking.guest_details?.full_name || 'Guest'}</span>
                    </div>
                    <div className="space-y-1 pl-7">
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Phone size={12}/> {booking.guest_details?.phone || 'N/A'}</p>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Mail size={12}/> {booking.guest_details?.email || 'N/A'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Stay Details</h4>
                    <div className="space-y-2">
                        <div className="flex justify-end items-center gap-3">
                            <span className="font-bold text-slate-800">Room {booking.room_details?.room_number}</span>
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><CreditCard size={14}/></div>
                        </div>
                        <div className="flex justify-end items-center gap-3">
                            <span className="text-sm font-medium text-slate-500">{new Date(booking.check_in_date).toLocaleDateString()} — {new Date(booking.check_out_date).toLocaleDateString()}</span>
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><Calendar size={14}/></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="p-10">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-slate-600">
                        <tr className="border-b border-slate-50">
                            <td className="py-4"><div className="font-bold text-slate-800">Accommodation</div><div className="text-xs text-slate-400">Room Rent + GST</div></td>
                            <td className="py-4 text-right font-bold">₹{roomTotal.toLocaleString()}</td>
                        </tr>
                        {charges.map((charge, i) => (
                            <tr key={i} className="border-b border-slate-50">
                                <td className="py-4">
                                    <div className="font-bold text-slate-800">{charge.service_name}</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider text-[10px]">{charge.category} (Qty: {charge.quantity})</div>
                                </td>
                                <td className="py-4 text-right font-bold">₹{parseFloat(charge.total_cost).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="bg-slate-50 p-10">
                <div className="flex flex-col gap-3 max-w-xs ml-auto">
                    <div className="flex justify-between text-sm font-medium text-slate-500"><span>Subtotal</span><span>₹{grandTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm font-medium text-emerald-600"><span>Paid</span><span>- ₹{advance.toLocaleString()}</span></div>
                    <div className="border-t border-slate-200 my-2"></div>
                    <div className="flex justify-between text-xl font-black text-slate-900"><span>Balance Due</span><span>₹{balance.toLocaleString()}</span></div>
                </div>
            </div>
        </div>

        {/* 💳 RIGHT: ACTION PANEL */}
        <div className="space-y-6">
            
            {/* Payment Card */}
            <div className="bg-slate-900 text-white p-8 rounded-[30px] shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase mb-1">Quick Actions</h3>
                    <p className="text-slate-400 text-xs mb-6 font-medium">Manage payment & status.</p>
                    
                    {/* Payment Input */}
                    <div className="mb-4">
                        <div className="flex items-center bg-white/10 rounded-xl px-4 border border-white/10">
                            <span className="text-slate-400 mr-2">₹</span>
                            <input 
                                type="number" 
                                placeholder="Enter Amount" 
                                className="bg-transparent border-none text-white font-bold w-full py-3 focus:outline-none placeholder-slate-500"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button 
                            onClick={handleManualPayment} 
                            className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                        >
                            <CreditCard size={18}/> Record Cash
                        </button>
                        <button 
                            onClick={handleOnlinePayment} 
                            disabled={payingOnline}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest shadow-lg"
                        >
                            {payingOnline ? <Loader2 className="animate-spin" size={18}/> : <Globe size={18}/>}
                            Pay Online
                        </button>
                    </div>
                    
                    {booking.status !== 'CHECKED_OUT' && (
                        <button onClick={handleCheckout} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-sm uppercase tracking-widest shadow-lg">
                            <LogOut size={18}/> Checkout Guest
                        </button>
                    )}
                </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-200">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Payment Status</h3>
                {balance <= 0 ? (
                    <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CheckCircle size={16}/></div>
                        <div><div className="font-bold text-slate-800 text-sm">Fully Paid</div><div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">No Dues</div></div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Clock size={16}/></div>
                        <div><div className="font-bold text-slate-800 text-sm">Payment Pending</div><div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">₹{balance} Due</div></div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Folio;