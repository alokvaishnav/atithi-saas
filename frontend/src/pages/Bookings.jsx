import { useEffect, useState } from 'react';
import { 
  Plus, X, Calendar, Printer, ShoppingCart, 
  CheckCircle, User, CreditCard, ChevronRight, ChevronLeft 
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

  // New Booking Wizard Data
  const [bookingData, setBookingData] = useState({
    room: '', 
    guest: '', 
    check_in_date: '', 
    check_out_date: '', 
    status: 'CONFIRMED'
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

  // 🖨️ PROFESSIONAL TAX INVOICE PRINTING
  const handlePrintInvoice = (booking) => {
    const printWindow = window.open('', '', 'width=900,height=800');
    
    // Summary Calculations
    const roomSub = parseFloat(booking.subtotal_amount || 0);
    const roomTax = parseFloat(booking.tax_amount || 0);
    const serviceSub = booking.charges?.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0) || 0;
    const serviceTax = booking.charges?.reduce((s, c) => s + parseFloat(c.tax_amount || 0), 0) || 0;
    const finalTotal = roomSub + roomTax + serviceSub + serviceTax;

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
                <td>Room Charges</td>
                <td>1</td>
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
        alert("Booking Confirmed! 🎉"); 
        setShowWizard(false); 
        fetchAllData(); 
        setBookingData({ room: '', guest: '', check_in_date: '', check_out_date: '', status: 'CONFIRMED' });
        setCurrentStep(1);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Reservations</h2>
          <p className="text-slate-500">Manage Tax Invoices and Bookings</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg transition-all">
          <Plus size={20}/> New Reservation
        </button>
      </div>

      {showWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
               <h3 className="font-bold text-slate-700">Reservation Wizard</h3>
               <button onClick={() => setShowWizard(false)}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
            </div>

            <div className="p-8">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="text-blue-500"/> Stay Duration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Check-In</label>
                      <input type="datetime-local" className="w-full border p-3 rounded-lg bg-slate-50" 
                        value={bookingData.check_in_date} onChange={(e) => setBookingData({...bookingData, check_in_date: e.target.value})}/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Check-Out</label>
                      <input type="datetime-local" className="w-full border p-3 rounded-lg bg-slate-50" 
                        value={bookingData.check_out_date} onChange={(e) => setBookingData({...bookingData, check_out_date: e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Room Selection</label>
                    <select className="w-full border p-3 rounded-lg" value={bookingData.room} onChange={(e) => setBookingData({...bookingData, room: e.target.value})} disabled={!bookingData.check_in_date}>
                      <option value="">-- Choose Free Room --</option>
                      {rooms.filter(room => {
                        const hasConflict = bookings.some(b => b.room === room.id && b.status !== 'CANCELLED' && (new Date(bookingData.check_in_date) < new Date(b.check_out_date) && new Date(bookingData.check_out_date) > new Date(b.check_in_date)));
                        return !hasConflict && room.status === 'AVAILABLE';
                      }).map(r => <option key={r.id} value={r.id}>Room {r.room_number} ({r.room_type}) - ₹{r.price_per_night}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User className="text-blue-500"/> Assign Guest</h4>
                  <select className="w-full border p-3 rounded-lg bg-slate-50" value={bookingData.guest} onChange={(e) => setBookingData({...bookingData, guest: e.target.value})}>
                    <option value="">-- Select Existing Guest --</option>
                    {guests.map(g => <option key={g.id} value={g.id}>{g.full_name} ({g.phone})</option>)}
                  </select>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h4 className="text-blue-800 font-black uppercase text-xs mb-4">Billing Preview</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600"><span>Room Subtotal:</span> <span>₹{calculatePreview().sub.toLocaleString()}</span></div>
                        <div className="flex justify-between text-slate-600"><span>Room GST (12%):</span> <span>₹{calculatePreview().tax.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xl font-black text-slate-900 border-t pt-2 mt-2"><span>Grand Total:</span> <span>₹{calculatePreview().total.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 flex justify-between">
              {currentStep > 1 && <button onClick={() => setCurrentStep(currentStep - 1)} className="text-slate-500 font-bold px-4 py-2">Back</button>}
              <div className="ml-auto flex gap-2">
                {currentStep < 3 ? (
                  <button disabled={!bookingData.room} onClick={() => setCurrentStep(currentStep + 1)} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2">Next Step <ChevronRight size={16}/></button>
                ) : (
                  <button onClick={handleBookingSubmit} className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2">Confirm & Save <CheckCircle size={16}/></button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS CHARGE MODAL */}
      {showChargeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Post POS Charge (Inc. Tax)</h3>
            <form onSubmit={handleAddCharge} className="flex flex-col gap-4">
              <select className="border p-2 rounded" required value={chargeData.service} onChange={(e) => setChargeData({...chargeData, service: e.target.value})}>
                <option value="">-- Select Item --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>)}
              </select>
              <input type="number" min="1" className="border p-2 rounded" required value={chargeData.quantity} onChange={(e) => setChargeData({...chargeData, quantity: e.target.value})}/>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowChargeForm(null)} className="flex-1 bg-slate-200 py-2 rounded">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Post to Folio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
            <tr><th className="p-4">Guest</th><th className="p-4">Room</th><th className="p-4">Timing</th><th className="p-4">Total (Inc. Tax)</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700">{b.guest_details?.full_name}</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{b.room_details?.room_number}</span></td>
                <td className="p-4 text-slate-500 text-xs">{new Date(b.check_in_date).toLocaleString()}<br/><span className="text-slate-300">to</span><br/>{new Date(b.check_out_date).toLocaleString()}</td>
                <td className="p-4 font-black text-green-600">₹{parseFloat(b.total_amount).toLocaleString()}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => setShowChargeForm(b.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded" title="Add POS"><ShoppingCart size={18}/></button>
                  <button onClick={() => handlePrintInvoice(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Print Tax Invoice"><Printer size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;