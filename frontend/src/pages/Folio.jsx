import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, CreditCard, Send, CheckCircle, 
  ArrowLeft, FileText, Download, Plus, Trash2, Loader2, LogOut 
} from 'lucide-react';
import { API_URL } from '../config';
import { useReactToPrint } from 'react-to-print';

const Folio = () => {
  const { id } = useParams(); // Standardized to 'id' to match Router
  const navigate = useNavigate();
  
  // Data State
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Modal visibility state
  
  // Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('CASH');
  const [newItem, setNewItem] = useState({ description: '', amount: '' });

  const token = localStorage.getItem('access_token');
  const printRef = useRef();

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/bookings/${id}/folio/`, { // Correct endpoint for full folio details
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (res.ok) {
        setBooking(await res.json());
      } else {
          // Handle error (e.g., booking not found)
          console.error("Failed to fetch booking");
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // --- CALCULATIONS ---
  // Ensure booking exists before accessing properties
  const items = booking?.charges || [];
  const payments = booking?.payments || [];

  // 1. Totals (Backend is source of truth for total_amount usually, but let's derive for UI if needed)
  const grandTotal = booking ? parseFloat(booking.total_amount) : 0;
  
  // 2. Room Rent Calculation (Total - Extras) - This logic assumes total_amount includes everything
  const totalExtras = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  // Simple check to avoid negative numbers if data is sync issue
  const roomRentDisplay = Math.max(0, grandTotal - totalExtras); 

  // 3. Balance
  const totalPaid = booking ? parseFloat(booking.paid_amount) : 0; // Using backend provided paid_amount if available
  const balance = booking ? parseFloat(booking.balance) : 0;

  // --- ACTIONS ---

  // Add Payment
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    
    setSubmitting(true);
    try {
        const res = await fetch(`${API_URL}/api/bookings/${id}/pay/`, { // Using specific pay endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                amount: parseFloat(payAmount), 
                method: payMode 
            })
        });
        
        if (res.ok) {
            alert("Payment Recorded");
            setPayAmount('');
            setPayMode('CASH');
            setShowPaymentModal(false);
            fetchData(); // Reload data
        } else {
            alert("Failed to record payment");
        }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  // Add Extra Charge
  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!newItem.description || !newItem.amount) return;

    setSubmitting(true);
    try {
        // Assuming there is an endpoint to add generic charges to a booking
        // If not, this might need to go through the POS endpoint logic or specific charge endpoint
        const res = await fetch(`${API_URL}/api/bookings/${id}/charges/`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                description: newItem.description, 
                amount: parseFloat(newItem.amount) 
            })
        });

        if (res.ok) {
            setNewItem({ description: '', amount: '' });
            fetchData(); // Reload data
        } else {
            alert("Failed to add charge");
        }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  // Checkout Guest
  const handleCheckout = async () => {
    if (balance > 0) {
        if(!window.confirm(`⚠️ Pending Balance: ₹${balance.toLocaleString()}. Force checkout?`)) return;
    } else {
        if (!window.confirm("Confirm Checkout & Close Folio?")) return;
    }

    setSubmitting(true);
    try {
        const res = await fetch(`${API_URL}/api/bookings/${id}/checkout/`, {
            method: 'POST', // Usually POST for an action
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Guest Checked Out Successfully! 👋");
            navigate('/front-desk'); // Redirect to Front Desk
        } else {
            alert("Checkout Failed.");
        }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  // Print Handler
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice_${booking?.booking_id || id}`,
  });

  if (loading || !booking) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
            <ArrowLeft size={20}/> Back
        </button>
        <div className="flex gap-3">
            {/* Share Link (Future Feature) */}
            <button disabled className="bg-white border border-slate-200 text-slate-400 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest cursor-not-allowed flex items-center gap-2">
                <Send size={16}/> Share Link
            </button>
            <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 shadow-lg transition-all">
                <Printer size={16}/> Print Invoice
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📄 INVOICE PREVIEW (LEFT - Printable Area) */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[30px] shadow-sm border border-slate-200" ref={printRef}>
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">INVOICE</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">#{booking.booking_id} • {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800">ATITHI HOTEL</h2>
                    <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed mt-1">
                        123 Hospitality Lane, Cloud City<br/>
                        GST: 27AABC1234D1Z5
                    </p>
                </div>
            </div>

            {/* Guest & Room Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billed To</p>
                    <h3 className="text-lg font-black text-slate-800">{booking.guest_name}</h3>
                    <p className="text-sm text-slate-500">{booking.guest_phone}</p>
                    <p className="text-sm text-slate-500">{booking.guest_email}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stay Details</p>
                    <h3 className="text-lg font-black text-slate-800">Room {booking.room_number}</h3>
                    <p className="text-sm text-slate-500">{booking.room_type}</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {booking.check_in} <span className="mx-1">➜</span> {booking.check_out}
                    </p>
                </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left mb-8 text-sm">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {/* Room Rent Row */}
                    <tr>
                        <td className="py-4 font-bold text-slate-700">
                            Room Rent ({booking.nights} Nights)
                            <span className="text-xs text-slate-400 font-normal ml-2">(@ ₹{booking.room_price}/night)</span>
                        </td>
                        <td className="py-4 font-bold text-slate-700 text-right">
                            ₹{(booking.nights * booking.room_price).toLocaleString()}
                        </td>
                    </tr>
                    
                    {/* Extra Charges Rows */}
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-4 text-sm text-slate-600">
                                {item.description}
                                {item.quantity > 1 && <span className="text-xs text-slate-400 ml-1">(x{item.quantity})</span>}
                            </td>
                            <td className="py-4 text-sm text-slate-600 text-right">₹{parseFloat(item.amount).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end border-t-2 border-slate-100 pt-6">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                        <span>Subtotal</span>
                        <span>₹{parseFloat(booking.subtotal || grandTotal).toLocaleString()}</span>
                    </div>
                    {/* Tax Logic can be added here if separated from backend */}
                    {booking.tax > 0 && (
                        <div className="flex justify-between text-sm font-bold text-slate-500">
                            <span>Tax</span>
                            <span>₹{parseFloat(booking.tax).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="w-full h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between text-xl font-black text-slate-900">
                        <span>Grand Total</span>
                        <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-green-600">
                        <span>Paid</span>
                        <span>- ₹{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className={`p-4 rounded-xl flex justify-between items-center ${balance > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        <span className="font-black uppercase text-xs tracking-widest">Balance Due</span>
                        <span className="font-black text-lg">₹{balance.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thank you for staying with us!</p>
                <p className="text-[10px] text-slate-300 mt-1">For support: help@atithihotels.com | +91 98765 43210</p>
            </div>
        </div>

        {/* 🎮 CONTROLS (RIGHT - Non-Printable) */}
        <div className="space-y-6 print:hidden">
            
            {/* 1. Add Payment */}
            {booking.status !== 'CHECKED_OUT' && (
                <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4 text-green-600">
                        <CreditCard size={20}/>
                        <h3 className="font-black uppercase tracking-widest text-sm">Add Payment</h3>
                    </div>
                    <form onSubmit={handleAddPayment} className="space-y-3">
                        <input 
                            type="number" 
                            placeholder="Amount (₹)" 
                            className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            required
                        />
                        <select 
                            className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                            value={payMode}
                            onChange={e => setPayMode(e.target.value)}
                        >
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI / QR</option>
                            <option value="CARD">Credit/Debit Card</option>
                            <option value="TRANSFER">Bank Transfer</option>
                        </select>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-100 flex justify-center items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16}/> : "Receive Payment"}
                        </button>
                    </form>
                </div>
            )}

            {/* 2. Add Extra Charge */}
            {booking.status !== 'CHECKED_OUT' && (
                <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4 text-orange-500">
                        <Plus size={20}/>
                        <h3 className="font-black uppercase tracking-widest text-sm">Add Charge</h3>
                    </div>
                    <form onSubmit={handleAddCharge} className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Item (e.g. Laundry, Taxi)" 
                            className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            value={newItem.description}
                            onChange={e => setNewItem({...newItem, description: e.target.value})}
                            required
                        />
                        <input 
                            type="number" 
                            placeholder="Cost (₹)" 
                            className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            value={newItem.amount}
                            onChange={e => setNewItem({...newItem, amount: e.target.value})}
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-3 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-100 flex justify-center items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16}/> : "Add to Bill"}
                        </button>
                    </form>
                </div>
            )}

            {/* 3. Checkout Button */}
            <button 
                onClick={handleCheckout}
                disabled={submitting || booking.status === 'CHECKED_OUT'}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-xl transition-all flex justify-center items-center gap-2 ${
                    balance <= 0 && booking.status !== 'CHECKED_OUT'
                    ? 'bg-slate-900 text-white hover:bg-black' 
                    : booking.status === 'CHECKED_OUT' 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                }`}
            >
                {submitting ? (
                    <Loader2 className="animate-spin" size={20}/> 
                ) : booking.status === 'CHECKED_OUT' ? (
                    <>
                        <CheckCircle size={20}/> Guest Checked Out
                    </>
                ) : balance > 0 ? (
                    <>
                        <LogOut size={20}/> Checkout (Due: ₹{balance.toLocaleString()})
                    </>
                ) : (
                    <>
                        <LogOut size={20}/> Complete Checkout
                    </>
                )}
            </button>

        </div>
      </div>
    </div>
  );
};

export default Folio;