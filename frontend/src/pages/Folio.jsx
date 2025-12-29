import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, CreditCard, Send, CheckCircle, 
  ArrowLeft, FileText, Download, Plus, Trash2 
} from 'lucide-react';
import { API_URL } from '../config';
import { useReactToPrint } from 'react-to-print';

const Folio = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [items, setItems] = useState([]); // Extra charges (Food, Laundry)
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('CASH');

  // New Charge Form
  const [newItem, setNewItem] = useState({ description: '', amount: '' });

  const token = localStorage.getItem('access_token');
  const printRef = useRef();

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
        // Ensure arrays exist to prevent crashes
        setItems(data.charges || []); 
        setPayments(data.payments || []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [bookingId]);

  // --- CALCULATIONS ---
  const roomTotal = booking ? parseFloat(booking.total_amount) : 0;
  const extrasTotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const grandTotal = roomTotal + extrasTotal;
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const balance = grandTotal - totalPaid;

  // --- ACTIONS ---
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    try {
        const res = await fetch(`${API_URL}/api/bookings/${bookingId}/add_payment/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount: payAmount, mode: payMode })
        });
        if (res.ok) {
            setPayAmount('');
            fetchData();
        }
    } catch (err) { console.error(err); }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!newItem.description || !newItem.amount) return;

    try {
        const res = await fetch(`${API_URL}/api/bookings/${bookingId}/add_charge/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newItem)
        });
        if (res.ok) {
            setNewItem({ description: '', amount: '' });
            fetchData();
        }
    } catch (err) { console.error(err); }
  };

  const handleCheckout = async () => {
    if (balance > 0) {
        alert(`❌ Cannot Checkout! Pending Balance: ₹${balance}`);
        return;
    }
    if (!window.confirm("Confirm Checkout & Close Folio?")) return;

    try {
        await fetch(`${API_URL}/api/bookings/${bookingId}/checkout/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Guest Checked Out Successfully! 👋");
        navigate('/front-desk');
    } catch (err) { console.error(err); }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Invoice_${bookingId}`,
  });

  if (loading || !booking) return <div className="p-20 text-center">Loading Folio...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold">
            <ArrowLeft size={20}/> Back
        </button>
        <div className="flex gap-3">
            <button onClick={() => window.open(`/folio-live/${bookingId}`, '_blank')} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2">
                <Send size={16}/> Share Link
            </button>
            <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 shadow-lg">
                <Printer size={16}/> Print Invoice
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📄 INVOICE PREVIEW (LEFT) */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[30px] shadow-sm border border-slate-200" ref={printRef}>
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">INVOICE</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">#{booking.id} • {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800">{booking.hotel_name || "ATITHI HOTEL"}</h2>
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
                    <h3 className="text-lg font-black text-slate-800">{booking.guest_details?.full_name}</h3>
                    <p className="text-sm text-slate-500">{booking.guest_details?.address}</p>
                    <p className="text-sm text-slate-500">{booking.guest_details?.phone}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stay Details</p>
                    <h3 className="text-lg font-black text-slate-800">Room {booking.room_details?.room_number}</h3>
                    <p className="text-sm text-slate-500">{booking.room_type_name}</p>
                    <p className="text-sm text-slate-500">
                        {booking.check_in_date} ➜ {booking.check_out_date}
                    </p>
                </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left mb-8">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                        <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    <tr>
                        <td className="py-4 font-bold text-slate-700">Room Charges ({booking.days_stayed || 1} Nights)</td>
                        <td className="py-4 font-bold text-slate-700 text-right">₹{roomTotal.toLocaleString()}</td>
                    </tr>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-4 text-sm text-slate-600">{item.description}</td>
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
                        <span>₹{grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-green-600">
                        <span>Paid</span>
                        <span>- ₹{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-slate-900 border-t border-slate-200 pt-3 mt-2">
                        <span>Balance Due</span>
                        <span>₹{balance.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thank you for staying with us!</p>
            </div>
        </div>

        {/* 🎮 CONTROLS (RIGHT) */}
        <div className="space-y-6">
            
            {/* 1. Add Payment */}
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4 text-green-600">
                    <CreditCard size={20}/>
                    <h3 className="font-black uppercase tracking-widest text-sm">Add Payment</h3>
                </div>
                <form onSubmit={handleAddPayment} className="space-y-3">
                    <input 
                        type="number" 
                        placeholder="Amount (₹)" 
                        className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-500"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                    />
                    <select 
                        className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none"
                        value={payMode}
                        onChange={e => setPayMode(e.target.value)}
                    >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / QR</option>
                        <option value="CARD">Credit/Debit Card</option>
                        <option value="TRANSFER">Bank Transfer</option>
                    </select>
                    <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-100">
                        Receive Payment
                    </button>
                </form>
            </div>

            {/* 2. Add Extra Charge */}
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4 text-orange-500">
                    <Plus size={20}/>
                    <h3 className="font-black uppercase tracking-widest text-sm">Add Charge</h3>
                </div>
                <form onSubmit={handleAddCharge} className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="Item (e.g. Laundry, Taxi)" 
                        className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                    />
                    <input 
                        type="number" 
                        placeholder="Cost (₹)" 
                        className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                        value={newItem.amount}
                        onChange={e => setNewItem({...newItem, amount: e.target.value})}
                    />
                    <button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-100">
                        Add to Bill
                    </button>
                </form>
            </div>

            {/* 3. Checkout Button */}
            <button 
                onClick={handleCheckout}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-xl transition-all ${
                    balance <= 0 
                    ? 'bg-slate-900 text-white hover:bg-black' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                disabled={balance > 0}
            >
                {balance > 0 ? `Due: ₹${balance}` : 'Complete Checkout'}
            </button>

        </div>
      </div>
    </div>
  );
};

export default Folio;
