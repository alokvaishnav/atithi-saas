import { useEffect, useState } from 'react';
import { 
  Plus, X, Calendar, Printer, ShoppingCart, 
  CheckCircle, User, CreditCard, ChevronRight, ChevronLeft,
  MapPin, FileText, Landmark, Mail, LogOut, Search, Filter, 
  Trash2, ArrowUpRight, TrendingDown, ClipboardList, LogIn, XCircle
} from 'lucide-react'; 
import { API_URL } from '../config'; 

const Bookings = () => {
  // --- STATE MANAGEMENT ---
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Modal & Step States
  const [showWizard, setShowWizard] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(null); 
  const [currentStep, setCurrentStep] = useState(1); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('access_token');

  // New Booking Data Model
  const [bookingData, setBookingData] = useState({
    room: '', 
    guest: '', 
    check_in_date: '', 
    check_out_date: '', 
    status: 'CONFIRMED',
    advance_paid: 0,
    purpose_of_visit: 'Tourism',
    coming_from: '',
    going_to: '',
    nationality: 'Indian'
  });

  // POS Charge Model
  const [chargeData, setChargeData] = useState({ service: '', quantity: 1 });

  // --- DATA FETCHING ---
  const fetchAllData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resBookings, resRooms, resGuests, resServices] = await Promise.all([
        fetch(API_URL + '/api/bookings/', { headers }),
        fetch(API_URL + '/api/rooms/', { headers }),
        fetch(API_URL + '/api/guests/', { headers }),
        fetch(API_URL + '/api/services/', { headers }) 
      ]);
      
      if (resBookings.ok) setBookings(await resBookings.json());
      if (resRooms.ok) setRooms(await resRooms.json());
      if (resGuests.ok) setGuests(await resGuests.json());
      if (resServices.ok) setServices(await resServices.json());

    } catch (err) { console.error("Critical Fetch Error:", err); }
  };

  useEffect(() => { fetchAllData(); }, []);

  // --- AUTOMATION HANDLERS ---
  
  // 🚀 NEW: CHECK-IN LOGIC (Syncs Booking & Room Status)
  const handleCheckIn = async (bookingId, roomId) => {
    if (!window.confirm("Confirm Guest Arrival & Handover Key?")) return;

    try {
        // 1. Update Booking Status
        await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'CHECKED_IN' })
        });

        // 2. Update Room Status to OCCUPIED
        if (roomId) {
            await fetch(`${API_URL}/api/rooms/${roomId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'OCCUPIED' })
            });
        }

        alert("✅ Check-In Successful! Room marked OCCUPIED.");
        fetchAllData();

    } catch (err) { console.error("Check-In Error:", err); alert("Check-in failed."); }
  };

  // 🚀 NEW: CANCEL LOGIC
  const handleCancel = async (bookingId, roomId) => {
    if (!window.confirm("Are you sure you want to CANCEL this reservation?")) return;

    try {
        await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'CANCELLED' })
        });
        
        // Free up room if needed
        if (roomId) {
            await fetch(`${API_URL}/api/rooms/${roomId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'AVAILABLE' })
            });
        }
        
        fetchAllData();
    } catch (err) { console.error(err); }
  };

  const handleSendEmail = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/send-confirmation/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) alert("Confirmation Sent to Guest Email! 📧");
    } catch (err) { console.error("Email API Fail:", err); }
  };

  const handleCheckout = async (bookingId) => {
    if (!window.confirm("Perform checkout and mark room RM for cleaning?")) return;
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/checkout/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Guest Checked Out. Room moved to Dirty list. 🧹");
        fetchAllData();
      }
    } catch (err) { console.error("Checkout Fail:", err); }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL + '/api/charges/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ booking: showChargeForm, ...chargeData })
      });
      if (res.ok) {
        setShowChargeForm(null);
        setChargeData({ service: '', quantity: 1 });
        fetchAllData();
      }
    } catch (err) { console.error("POS API Fail:", err); }
  };

  // --- DOCUMENT PRINTING LOGIC ---
  const handlePrintGRC = (id) => {
    const b = bookings.find(x => x.id === id);
    const w = window.open('', '', 'width=800,height=900');
    const html = `
      <html><head><style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
        .h { text-align: center; border-bottom: 4px solid #0f172a; padding-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
        .sec { border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc; }
        .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .val { font-weight: 700; font-size: 16px; margin-top: 4px; }
        .sig { margin-top: 80px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; pt: 20px; }
      </style></head><body>
        <div class="h"><h1>ATITHI GUEST REGISTRATION</h1><p>Legal Form C Compliance Document</p></div>
        <div class="grid">
          <div class="sec">
            <div class="label">Guest Full Name</div><div class="val">${b.guest_details.full_name}</div><br>
            <div class="label">Passport / ID Number</div><div class="val">${b.guest_details.id_proof_number || 'REQUIRED'}</div><br>
            <div class="label">Nationality</div><div class="val">${b.guest_details.nationality || 'Indian'}</div>
          </div>
          <div class="sec">
            <div class="label">Room Number</div><div class="val">${b.room_details.room_number}</div><br>
            <div class="label">Arrival Date</div><div class="val">${new Date(b.check_in_date).toLocaleString()}</div><br>
            <div class="label">Estimated Departure</div><div class="val">${new Date(b.check_out_date).toLocaleString()}</div>
          </div>
        </div>
        <div class="sec" style="margin-top:20px">
          <div class="label">Arrival From</div><div class="val">${b.coming_from || 'N/A'}</div><br>
          <div class="label">Proceeding To</div><div class="val">${b.going_to || 'N/A'}</div>
        </div>
        <div class="sig"><div>Guest Signature</div><div>Front Office Manager</div></div>
      </body></html>
    `;
    w.document.write(html); w.document.close(); w.print();
  };

  const handlePrintInvoice = (b) => {
    const roomSub = parseFloat(b.subtotal_amount);
    const roomTax = parseFloat(b.tax_amount);
    const posSub = b.charges?.reduce((s, c) => s + parseFloat(c.subtotal), 0) || 0;
    const posTax = b.charges?.reduce((s, c) => s + parseFloat(c.tax_amount), 0) || 0;
    const total = roomSub + roomTax + posSub + posTax;
    const w = window.open('', '', 'width=900,height=800');
    const html = `
      <html><head><style>
        body { font-family: sans-serif; padding: 50px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
        th { background: #f8fafc; font-size: 12px; }
        .total-sec { float: right; width: 350px; margin-top: 40px; background: #f1f5f9; padding: 20px; border-radius: 12px; }
      </style></head><body>
        <div class="header"><div><h1>ATITHI HOTEL</h1><p>GSTIN: 27AABCA1234A1Z5</p></div><div><h2>TAX INVOICE</h2><p>INV-${b.id}</p></div></div>
        <p>Guest: ${b.guest_details.full_name}<br>Room: RM${b.room_details.room_number}</p>
        <table><thead><tr><th>Item</th><th>Qty</th><th>Net</th><th>Tax</th><th>Total</th></tr></thead><tbody>
          <tr><td>Room Stay</td><td>Stay</td><td>₹${roomSub}</td><td>₹${roomTax}</td><td>₹${roomSub+roomTax}</td></tr>
          ${b.charges?.map(c => `<tr><td>${c.service_name}</td><td>${c.quantity}</td><td>₹${c.subtotal}</td><td>₹${c.tax_amount}</td><td>₹${c.total_cost}</td></tr>`).join('')}
        </tbody></table>
        <div class="total-sec">
          <h3>Grand Total: ₹${total}</h3>
          <p>Paid: ₹${b.amount_paid}</p><hr>
          <h2 style="color:red">Final Balance: ₹${total - b.amount_paid}</h2>
        </div>
      </body></html>
    `;
    w.document.write(html); w.document.close(); w.print();
  };

  // --- WIZARD LOGIC ---
  const calculatePreview = () => {
    if (!bookingData.room || !bookingData.check_in_date || !bookingData.check_out_date) return { sub: 0, tax: 0, total: 0 };
    const room = rooms.find(r => r.id === parseInt(bookingData.room));
    const nights = Math.max(Math.ceil((new Date(bookingData.check_out_date) - new Date(bookingData.check_in_date)) / (1000 * 3600 * 24)), 1);
    const sub = (room?.price_per_night || 0) * nights;
    const tax = sub * 0.12;
    return { sub, tax, total: sub + tax };
  };

  const handleBookingSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(API_URL + '/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        alert("Booking Confirmed Successfully! 🎉");
        setShowWizard(false);
        fetchAllData();
        setCurrentStep(1);
        setBookingData({ room: '', guest: '', check_in_date: '', check_out_date: '', status: 'CONFIRMED', advance_paid: 0, purpose_of_visit: 'Tourism', coming_from: '', going_to: '', nationality: 'Indian' });
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  // --- FILTERING ---
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.guest_details?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.room_details?.room_number.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* 🔝 TOP HEADER BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Reservations</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-widest">
              <ClipboardList size={12}/> Live Guest Ledger
            </span>
            <span className="text-slate-400 font-bold text-xs">Total: {bookings.length} Bookings Found</span>
          </div>
        </div>

        <div className="flex w-full lg:w-auto gap-4">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text" placeholder="Search by name or room..." 
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[20px] font-bold text-slate-700 focus:border-blue-500 outline-none transition-all shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowWizard(true)} className="bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black hover:bg-blue-600 transition-all flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 uppercase tracking-widest text-xs">
            <Plus size={20}/> New Booking
          </button>
        </div>
      </div>

      {/* 🎛️ FILTER TABS */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {["ALL", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map(status => (
          <button 
            key={status} onClick={() => setStatusFilter(status)}
            className={`px-6 py-2 rounded-full font-black text-[10px] tracking-[0.2em] transition-all border-2 
              ${statusFilter === status ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* 🧙‍♂️ RESERVATION WIZARD */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[48px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-200">{currentStep}</div>
                 <div>
                   <h3 className="font-black text-slate-900 uppercase text-xl tracking-tighter">Reservation Wizard</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Phase {currentStep} of 3 • Property Unit Allocation</p>
                 </div>
               </div>
               <button onClick={() => setShowWizard(false)} className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-all"><X size={28}/></button>
            </div>

            <div className="p-12">
              {/* STEP 1: LOGISTICS */}
              {currentStep === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Arrival Date & Time</label>
                      <input type="datetime-local" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 p-5 rounded-[24px] font-black outline-none transition-all" value={bookingData.check_in_date} onChange={(e) => setBookingData({...bookingData, check_in_date: e.target.value})}/>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departure Date & Time</label>
                      <input type="datetime-local" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 p-5 rounded-[24px] font-black outline-none transition-all" value={bookingData.check_out_date} onChange={(e) => setBookingData({...bookingData, check_out_date: e.target.value})}/>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Available Inventory</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 p-6 rounded-[24px] font-black outline-none transition-all appearance-none text-slate-700" value={bookingData.room} onChange={(e) => setBookingData({...bookingData, room: e.target.value})}>
                        <option value="">-- Browse Vacant Ready Rooms --</option>
                        {rooms.filter(r => r.status === 'AVAILABLE').map(r => <option key={r.id} value={r.id}>RM {r.room_number} • {r.room_type} • ₹{r.price_per_night}/night</option>)}
                      </select>
                      <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-300 pointer-events-none" size={24}/>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: GUEST PROFILE */}
              {currentStep === 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guest Selection</label>
                    <select className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 p-6 rounded-[24px] font-black outline-none transition-all appearance-none" value={bookingData.guest} onChange={(e) => setBookingData({...bookingData, guest: e.target.value})}>
                      <option value="">-- Select Registered Profile --</option>
                      {guests.map(g => <option key={g.id} value={g.id}>{g.full_name} • {g.phone}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <input type="text" placeholder="Place of Arrival" className="bg-slate-50 p-6 rounded-[24px] font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all" value={bookingData.coming_from} onChange={e => setBookingData({...bookingData, coming_from: e.target.value})} />
                    <input type="text" placeholder="Place of Departure" className="bg-slate-50 p-6 rounded-[24px] font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all" value={bookingData.going_to} onChange={e => setBookingData({...bookingData, going_to: e.target.value})} />
                  </div>
                </div>
              )}

              {/* STEP 3: FINANCIAL SETTLEMENT */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-slate-900 text-white p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
                      <Landmark className="absolute -right-16 -bottom-16 w-64 h-64 opacity-5" />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">Quoted Folio Total</p>
                          <h2 className="text-6xl font-black italic tracking-tighter">₹{calculatePreview().total.toLocaleString()}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tax (12% GST)</p>
                          <p className="font-bold text-lg">₹{calculatePreview().tax.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-12 border-t border-white/10 pt-10">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Advance Deposit Paid by Guest</label>
                        <div className="relative mt-4">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black opacity-30">₹</span>
                          <input type="number" className="w-full bg-white/5 border-2 border-white/10 p-6 pl-12 rounded-[24px] text-3xl font-black outline-none focus:border-blue-500 transition-all" value={bookingData.advance_paid} onChange={e => setBookingData({...bookingData, advance_paid: e.target.value})} />
                        </div>
                      </div>
                    </div>
                </div>
              )}
            </div>

            {/* FOOTER NAVIGATION */}
            <div className="bg-slate-50 p-10 flex justify-between items-center">
              {currentStep > 1 ? (
                <button onClick={() => setCurrentStep(currentStep - 1)} className="flex items-center gap-3 font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-xs tracking-widest group">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center group-hover:bg-slate-100"><ChevronLeft size={20}/></div> Go Back
                </button>
              ) : <div></div>}
              <button 
                onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleBookingSubmit()} 
                disabled={isSubmitting || (currentStep === 1 && !bookingData.room)}
                className="bg-slate-900 text-white px-12 py-5 rounded-[24px] font-black flex items-center gap-4 shadow-xl hover:bg-blue-600 transition-all disabled:opacity-30 uppercase text-xs tracking-[0.2em]"
              >
                {isSubmitting ? 'Processing...' : currentStep === 3 ? 'Finalize Booking' : 'Next Step'} <ChevronRight size={20}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 POS CHARGE MODAL */}
      {showChargeForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[110]">
          <div className="bg-white p-12 rounded-[48px] w-[450px] shadow-2xl animate-in slide-in-from-bottom-10 duration-400">
            <div className="flex justify-between items-start mb-10">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none"><ShoppingCart className="text-orange-500 mb-2" size={32}/><br/>Post Charge</h3>
              <button onClick={() => setShowChargeForm(null)} className="text-slate-300 hover:text-slate-900"><X size={32}/></button>
            </div>
            <form onSubmit={handleAddCharge} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Product / Service</label>
                <select className="w-full bg-slate-50 p-6 rounded-[24px] font-black outline-none border-2 border-transparent focus:border-orange-500 transition-all" required value={chargeData.service} onChange={(e) => setChargeData({...chargeData, service: e.target.value})}>
                  <option value="">-- Browse Menu --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} • ₹{s.price}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Quantity</label>
                <input type="number" min="1" className="w-full bg-slate-50 p-6 rounded-[24px] font-black text-2xl outline-none border-2 border-transparent focus:border-orange-500 transition-all" required value={chargeData.quantity} onChange={(e) => setChargeData({...chargeData, quantity: e.target.value})}/>
              </div>
              <button type="submit" className="w-full bg-orange-500 text-white p-6 rounded-[24px] font-black shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-105 transition-all uppercase tracking-widest text-xs">Confirm Addition</button>
            </form>
          </div>
        </div>
      )}

      {/* 📊 DATA LEDGER TABLE */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="p-8">Guest Profile</th>
                <th className="p-8 text-center">Unit</th>
                <th className="p-8 text-center">Stay Duration</th>
                <th className="p-8 text-center">Ledger Balance</th>
                <th className="p-8 text-center">Status</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBookings.length > 0 ? filteredBookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500"><User size={24}/></div>
                        <div>
                          <p className="font-black text-slate-900 text-xl tracking-tighter">{b.guest_details?.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">{b.guest_details?.phone} • {b.guest_details?.nationality || 'IND'}</p>
                        </div>
                      </div>
                  </td>
                  <td className="p-8 text-center">
                      <span className="bg-blue-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">RM {b.room_details?.room_number}</span>
                      <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-tighter">{b.room_details?.room_type}</p>
                  </td>
                  <td className="p-8 text-center">
                      <div className="flex flex-col items-center">
                        <p className="text-xs font-black text-slate-700 tracking-tighter italic">{new Date(b.check_in_date).toLocaleDateString()}</p>
                        <ChevronRight className="text-slate-300 rotate-90 my-1" size={14}/>
                        <p className="text-xs font-black text-slate-700 tracking-tighter italic">{new Date(b.check_out_date).toLocaleDateString()}</p>
                      </div>
                  </td>
                  <td className="p-8 text-center">
                      <div className="inline-block text-left">
                        <p className="font-black text-slate-950 text-xl tracking-tighter">₹{parseFloat(b.total_amount).toLocaleString()}</p>
                        {parseFloat(b.advance_paid) > 0 && (
                          <div className="flex items-center gap-1 text-[9px] text-green-500 font-black uppercase tracking-tighter mt-1">
                            <ArrowUpRight size={10}/> Paid: ₹{b.advance_paid}
                          </div>
                        )}
                      </div>
                  </td>
                  <td className="p-8 text-center">
                      <span className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest 
                        ${b.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' : 
                          b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                          b.status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                        {b.status}
                      </span>
                  </td>
                  <td className="p-8">
                      <div className="flex justify-end items-center gap-3">
                        <button onClick={() => setShowChargeForm(b.id)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200 rounded-xl transition-all hover:scale-110 shadow-sm" title="Post Charge"><ShoppingCart size={20}/></button>
                        <button onClick={() => handlePrintGRC(b.id)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all hover:scale-110 shadow-sm" title="GRC"><FileText size={20}/></button>
                        <button onClick={() => handlePrintInvoice(b)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-xl transition-all hover:scale-110 shadow-sm" title="Tax Invoice"><Printer size={20}/></button>
                        <button onClick={() => handleSendEmail(b.id)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-green-600 hover:border-green-200 rounded-xl transition-all hover:scale-110 shadow-sm" title="Email Receipt"><Mail size={20}/></button>
                        
                        {/* 🚀 ACTION: CHECK-IN */}
                        {b.status === 'CONFIRMED' && (
                           <button onClick={() => handleCheckIn(b.id, b.room)} className="h-12 px-6 flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-green-200" title="Check In Guest">
                             <LogIn size={16}/> Check In
                           </button>
                        )}

                        {/* 🚀 ACTION: CHECK-OUT */}
                        {b.status === 'CHECKED_IN' && (
                          <button onClick={() => handleCheckout(b.id)} className="h-12 px-6 flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-red-200" title="Finalize Settlement">
                            <LogOut size={16}/> Checkout
                          </button>
                        )}
                        
                        {/* 🚀 ACTION: CANCEL */}
                        {(b.status === 'CONFIRMED') && (
                           <button onClick={() => handleCancel(b.id, b.room)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all hover:scale-110 shadow-sm" title="Cancel Booking">
                             <XCircle size={20}/>
                           </button>
                        )}
                      </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-40 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Search size={40}/></div>
                    <p className="text-slate-300 font-black uppercase tracking-[0.5em] italic">No Match Found in Ledger</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📈 SUMMARY STATS FOOTER */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 p-8 rounded-[40px] text-white">
          <div className="border-r border-white/10 px-4">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">In-House Guests</p>
            <p className="text-3xl font-black">{bookings.filter(x => x.status === 'CHECKED_IN').length}</p>
          </div>
          <div className="border-r border-white/10 px-4">
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Expected Today</p>
            <p className="text-3xl font-black">{bookings.filter(x => x.check_in_date.startsWith(new Date().toISOString().split('T')[0])).length}</p>
          </div>
          <div className="px-4">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pending Departures</p>
            <p className="text-3xl font-black">{bookings.filter(x => x.status === 'CHECKED_IN' && x.check_out_date.startsWith(new Date().toISOString().split('T')[0])).length}</p>
          </div>
      </div>

    </div>
  );
};

export default Bookings;