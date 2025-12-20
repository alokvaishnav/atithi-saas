import { useEffect, useState } from 'react';
import { 
  Plus, X, Calendar, Printer, ShoppingCart, 
  CheckCircle, User, CreditCard, ChevronRight, ChevronLeft,
  MapPin, FileText, Landmark, Mail // 👈 Added Mail icon
} from 'lucide-react'; 
import { API_URL } from '../config'; 

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [services, setServices] = useState([]);
  
  // Modal States
  const [showWizard, setShowWizard] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(null); 
  const [currentStep, setCurrentStep] = useState(1); 

  const token = localStorage.getItem('access_token');

  // New Booking Wizard Data (MERGED: Old fields + New legal/finance fields)
  const [bookingData, setBookingData] = useState({
    room: '', 
    guest: '', 
    check_in_date: '', 
    check_out_date: '', 
    status: 'CONFIRMED',
    advance_paid: 0,
    purpose_of_visit: 'Tourism',
    coming_from: '',
    going_to: ''
  });

  // Charge Data (POS)
  const [chargeData, setChargeData] = useState({ service: '', quantity: 1 });

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

    } catch (err) { console.error("Error fetching data:", err); }
  };

  useEffect(() => { fetchAllData(); }, []);

  // 📧 TRIGGER EMAIL NOTIFICATION (Manual Resend)
  const handleSendEmail = async (bookingId) => {
    try {
      // Note: We use the existing update logic to trigger the save() method on the backend
      // which sends the email, or a dedicated endpoint if you've created one.
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'CONFIRMED' }) // Triggering a save to resend mail
      });
      if (response.ok) {
        alert("Confirmation Email Resent Successfully! 📧");
      }
    } catch (error) { console.error("Email Error:", error); }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!showChargeForm) return;

    try {
      const response = await fetch(API_URL + '/api/charges/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          booking: showChargeForm,
          service: chargeData.service,
          quantity: chargeData.quantity
        })
      });

      if (response.ok) {
        alert("Item Added with Tax! 🛒");
        setShowChargeForm(null); 
        setChargeData({ service: '', quantity: 1 });
        fetchAllData(); 
      }
    } catch (error) { console.error(error); }
  };

  // 🖨️ LEGAL GRC PRINTING TRIGGER
  const handlePrintGRC = (bookingId) => {
    window.open(`/print-grc/${bookingId}`, '_blank');
  };

  // 🖨️ PROFESSIONAL TAX INVOICE PRINTING (Full Logic)
  const handlePrintInvoice = (booking) => {
    const printWindow = window.open('', '', 'width=900,height=800');
    
    // Summary Calculations
    const roomSub = parseFloat(booking.subtotal_amount || 0);
    const roomTax = parseFloat(booking.tax_amount || 0);
    const serviceSub = booking.charges?.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0) || 0;
    const serviceTax = booking.charges?.reduce((s, c) => s + parseFloat(c.tax_amount || 0), 0) || 0;
    const finalTotal = roomSub + roomTax + serviceSub + serviceTax;
    const advance = parseFloat(booking.advance_paid || 0);
    const totalPaid = parseFloat(booking.amount_paid || 0);

    const html = `
      <html>
        <head>
          <title>Tax Invoice - ${booking.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header-flex { display: flex; justify-content: space-between; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .brand h1 { margin: 0; color: #2563eb; letter-spacing: -1px; }
            .meta { text-align: right; font-size: 13px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .box { padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
            .box h4 { margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; background: #0f172a; color: white; padding: 12px; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .total-section { width: 350px; margin-left: auto; background: #f8fafc; padding: 20px; border-radius: 12px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { border-top: 2px solid #e2e8f0; margin-top: 10px; padding-top: 10px; font-weight: 900; font-size: 20px; color: #2563eb; }
            .balance-row { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-flex">
            <div class="brand">
              <h1>ATITHI HOTEL</h1>
              <p>GSTIN: 27AABCA1234A1Z5<br>Contact: +91 98765 43210</p>
            </div>
            <div class="meta">
              <h2 style="margin:0">TAX INVOICE</h2>
              <p>Invoice #: INV-00${booking.id}<br>Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="box">
              <h4>Guest Details</h4>
              <strong>${booking.guest_details?.full_name}</strong><br>
              ID: ${booking.guest_details?.id_proof_number || 'N/A'}<br>
              ${booking.guest_details?.phone}
            </div>
            <div class="box">
              <h4>Stay Info</h4>
              Room: <strong>${booking.room_details?.room_number}</strong> (${booking.room_details?.room_type})<br>
              Check-In: ${new Date(booking.check_in_date).toLocaleString()}<br>
              Check-Out: ${new Date(booking.check_out_date).toLocaleString()}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty/Nights</th>
                <th>Base Price</th>
                <th>GST %</th>
                <th>Tax Amount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Stay Charges</td>
                <td>Stay</td>
                <td>₹${roomSub.toLocaleString()}</td>
                <td>12%</td>
                <td>₹${roomTax.toLocaleString()}</td>
                <td>₹${(roomSub + roomTax).toLocaleString()}</td>
              </tr>
              ${booking.charges?.map(c => `
                <tr>
                  <td>${c.service_name}</td>
                  <td>${c.quantity}</td>
                  <td>₹${parseFloat(c.subtotal).toLocaleString()}</td>
                  <td>${c.service_category === 'FOOD' ? '5%' : '18%'}</td>
                  <td>₹${parseFloat(c.tax_amount).toLocaleString()}</td>
                  <td>₹${parseFloat(c.total_cost).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row"><span>Net Subtotal:</span><span>₹${(roomSub + serviceSub).toLocaleString()}</span></div>
            <div class="total-row"><span>Total Tax (GST):</span><span>₹${(roomTax + serviceTax).toLocaleString()}</span></div>
            <div class="total-row grand-total"><span>Grand Total:</span><span>₹${finalTotal.toLocaleString()}</span></div>
            <div class="total-row" style="margin-top:10px; opacity:0.7"><span>Advance Paid:</span><span>₹${advance.toLocaleString()}</span></div>
            <div class="total-row balance-row"><span>Balance Due:</span><span>₹${(finalTotal - totalPaid).toLocaleString()}</span></div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Atithi Hotel. This is a computer-generated Tax Invoice.</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const calculatePreview = () => {
    if (bookingData.room && bookingData.check_in_date && bookingData.check_out_date) {
      const room = rooms.find(r => r.id === parseInt(bookingData.room));
      const start = new Date(bookingData.check_in_date);
      const end = new Date(bookingData.check_out_date);
      const days = Math.max(Math.ceil((end - start) / (1000 * 3600 * 24)), 1);
      if (room) {
        const sub = room.price_per_night * days;
        const tax = sub * 0.12;
        return { sub, tax, total: sub + tax };
      }
    }
    return { sub: 0, tax: 0, total: 0 };
  };

  const handleBookingSubmit = async () => {
    try {
      const response = await fetch(API_URL + '/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bookingData)
      });
      if (response.ok) { 
        alert("Booking Confirmed & Email Sent! 🎉"); 
        setShowWizard(false); 
        fetchAllData(); 
        setBookingData({ 
            room: '', guest: '', check_in_date: '', check_out_date: '', 
            status: 'CONFIRMED', advance_paid: 0, purpose_of_visit: 'Tourism', coming_from: '', going_to: ''
        });
        setCurrentStep(1);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Reservations</h2>
          <p className="text-slate-500 font-medium">Manage legal compliance and financial billing</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-2 shadow-lg transition-all active:scale-95 font-bold">
          <Plus size={20}/> New Reservation
        </button>
      </div>

      {/* RESERVATION WIZARD MODAL (FULL STEPS) */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-[650px] shadow-2xl overflow-hidden animate-fade-in-up border border-white/20">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                 <h3 className="font-black text-slate-700 uppercase tracking-tighter text-sm">Reservation Wizard</h3>
               </div>
               <button onClick={() => setShowWizard(false)}><X size={24} className="text-slate-400 hover:text-red-500"/></button>
            </div>

            <div className="p-8">
              {/* Step 1: Dates & Room Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><Calendar className="text-blue-500" size={20}/> Stay Duration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Check-In</label>
                      <input type="datetime-local" className="w-full border-none bg-slate-100 p-4 rounded-2xl font-bold text-slate-700" 
                        value={bookingData.check_in_date} onChange={(e) => setBookingData({...bookingData, check_in_date: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Check-Out</label>
                      <input type="datetime-local" className="w-full border-none bg-slate-100 p-4 rounded-2xl font-bold text-slate-700" 
                        value={bookingData.check_out_date} onChange={(e) => setBookingData({...bookingData, check_out_date: e.target.value})}/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Select Available Unit</label>
                    <select className="w-full border-none bg-slate-100 p-4 rounded-2xl font-black text-slate-700" value={bookingData.room} onChange={(e) => setBookingData({...bookingData, room: e.target.value})} disabled={!bookingData.check_in_date}>
                      <option value="">-- Choose Free Room --</option>
                      {rooms.filter(room => {
                        const hasConflict = bookings.some(b => b.room === room.id && b.status !== 'CANCELLED' && (new Date(bookingData.check_in_date) < new Date(b.check_out_date) && new Date(bookingData.check_out_date) > new Date(b.check_in_date)));
                        return !hasConflict && room.status === 'AVAILABLE';
                      }).map(r => <option key={r.id} value={r.id}>Room {r.room_number} ({r.room_type}) - ₹{r.price_per_night}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Guest & Legal GRC Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><MapPin className="text-blue-500" size={20}/> GRC Legal Details</h4>
                  <select className="w-full border-none bg-slate-100 p-4 rounded-2xl font-black text-slate-700" value={bookingData.guest} onChange={(e) => setBookingData({...bookingData, guest: e.target.value})}>
                    <option value="">-- Select Registered Guest --</option>
                    {guests.map(g => <option key={g.id} value={g.id}>{g.full_name} ({g.phone})</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Coming From" className="w-full border-none bg-slate-100 p-4 rounded-2xl font-medium" value={bookingData.coming_from} onChange={e => setBookingData({...bookingData, coming_from: e.target.value})} />
                    <input type="text" placeholder="Going To" className="w-full border-none bg-slate-100 p-4 rounded-2xl font-medium" value={bookingData.going_to} onChange={e => setBookingData({...bookingData, going_to: e.target.value})} />
                  </div>
                  <select className="w-full border-none bg-slate-100 p-4 rounded-2xl font-bold" value={bookingData.purpose_of_visit} onChange={e => setBookingData({...bookingData, purpose_of_visit: e.target.value})}>
                    <option value="Tourism">Purpose: Tourism</option>
                    <option value="Business">Purpose: Business</option>
                    <option value="Medical">Purpose: Medical</option>
                    <option value="Personal">Purpose: Personal</option>
                  </select>
                </div>
              )}

              {/* Step 3: Advance & Billing Preview */}
              {currentStep === 3 && (
                <div className="space-y-6">
                   <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><CreditCard className="text-blue-500" size={20}/> Payment & Review</h4>
                   <div className="bg-slate-900 text-white p-6 rounded-[24px] space-y-3 shadow-xl">
                      <div className="flex justify-between opacity-60 text-xs font-black uppercase tracking-widest"><span>Est. Room Total</span> <span>₹{calculatePreview().total}</span></div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="font-bold">Advance Deposit Received</span>
                        <input type="number" className="bg-white/10 border-none w-32 p-2 rounded-xl text-right font-black" value={bookingData.advance_paid} onChange={e => setBookingData({...bookingData, advance_paid: e.target.value})} />
                      </div>
                      <div className="flex justify-between text-xl font-black text-blue-400 border-t border-white/10 pt-4">
                        <span>Balance at Check-in</span> 
                        <span>₹{calculatePreview().total - bookingData.advance_paid}</span>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* WIZARD FOOTER NAVIGATION */}
            <div className="bg-slate-50 p-6 flex justify-between">
              {currentStep > 1 && <button onClick={() => setCurrentStep(currentStep - 1)} className="text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-800 transition">Back</button>}
              <div className="ml-auto flex gap-3">
                {currentStep < 3 ? (
                  <button disabled={!bookingData.room} onClick={() => setCurrentStep(currentStep + 1)} className="bg-slate-800 text-white font-black px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-slate-200 uppercase text-xs tracking-widest disabled:opacity-30 transition-all">Next <ChevronRight size={16}/></button>
                ) : (
                  <button onClick={handleBookingSubmit} className="bg-blue-600 text-white font-black px-10 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-200 uppercase text-xs tracking-widest transition-all hover:scale-105">Confirm & Save <CheckCircle size={16}/></button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS CHARGE MODAL */}
      {showChargeForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[32px] w-96 shadow-2xl animate-fade-in-up">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter"><ShoppingCart className="text-orange-500"/> Post POS Charge</h3>
            <form onSubmit={handleAddCharge} className="flex flex-col gap-5">
              <select className="bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-700" required value={chargeData.service} onChange={(e) => setChargeData({...chargeData, service: e.target.value})}>
                <option value="">-- Select Item --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>)}
              </select>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Quantity</label>
                <input type="number" min="1" className="bg-slate-50 border-none p-4 rounded-2xl w-full font-bold" required value={chargeData.quantity} onChange={(e) => setChargeData({...chargeData, quantity: e.target.value})}/>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowChargeForm(null)} className="flex-1 text-slate-400 font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100">Post Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN DATA TABLE */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
            <tr><th className="p-6">Guest / Contact</th><th className="p-6">Room Details</th><th className="p-6">Stay Period</th><th className="p-6">Finance</th><th className="p-6 text-center">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bookings.length > 0 ? bookings.map(b => (
              <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-6">
                    <p className="font-black text-slate-800">{b.guest_details?.full_name}</p>
                    <p className="text-xs text-slate-400 font-bold">{b.guest_details?.phone}</p>
                </td>
                <td className="p-6">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-xs uppercase">Room {b.room_details?.room_number}</span>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">{b.room_details?.room_type}</p>
                </td>
                <td className="p-6">
                    <p className="text-xs font-black text-slate-700">{new Date(b.check_in_date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">To {new Date(b.check_out_date).toLocaleDateString()}</p>
                </td>
                <td className="p-6">
                    <p className="font-black text-slate-800">₹{parseFloat(b.total_amount).toLocaleString()}</p>
                    {parseFloat(b.advance_paid) > 0 && <p className="text-[10px] text-green-500 font-black uppercase">Adv Paid: ₹{b.advance_paid}</p>}
                </td>
                <td className="p-6">
                   <div className="flex justify-center items-center gap-2">
                      <button onClick={() => setShowChargeForm(b.id)} className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Add POS"><ShoppingCart size={18}/></button>
                      <button onClick={() => handlePrintGRC(b.id)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Legal GRC Form"><FileText size={18}/></button>
                      <button onClick={() => handlePrintInvoice(b)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all" title="Tax Invoice"><Printer size={18}/></button>
                      <button onClick={() => handleSendEmail(b.id)} className="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Resend Notification"><Mail size={18}/></button>
                   </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-medium">No bookings found in the system.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;