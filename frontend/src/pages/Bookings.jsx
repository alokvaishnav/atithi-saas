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
  const [currentStep, setCurrentStep] = useState(1); // 1=Dates/Time, 2=Guest, 3=Confirm

  const token = localStorage.getItem('access_token');

  // New Booking Wizard Data
  const [bookingData, setBookingData] = useState({
    room: '', 
    guest: '', 
    check_in_date: '', 
    check_out_date: '', 
    total_amount: 0, 
    status: 'CONFIRMED'
  });

  // Charge Data (POS)
  const [chargeData, setChargeData] = useState({ service: '', quantity: 1 });

  // 1. Fetch ALL Data
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

  // 🛒 POS LOGIC
  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!showChargeForm) return;

    const selectedService = services.find(s => s.id === parseInt(chargeData.service));
    const totalCost = selectedService ? selectedService.price * chargeData.quantity : 0;

    try {
      const response = await fetch(API_URL + '/api/charges/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          booking: showChargeForm,
          service: chargeData.service,
          quantity: chargeData.quantity,
          total_cost: totalCost
        })
      });

      if (response.ok) {
        alert("Item Added! 🛒");
        setShowChargeForm(null); 
        setChargeData({ service: '', quantity: 1 });
        fetchAllData(); 
      }
    } catch (error) { console.error(error); }
  };

  // 🖨️ PRINT INVOICE
  const handlePrintInvoice = (booking) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const extrasTotal = booking.charges ? booking.charges.reduce((sum, item) => sum + parseFloat(item.total_cost), 0) : 0;
    const grandTotal = parseFloat(booking.total_amount) + extrasTotal;

    const extrasRows = booking.charges?.map(charge => `
      <tr><td>${charge.service_name || 'Service'} (x${charge.quantity})</td><td>-</td><td>₹${charge.total_cost}</td></tr>
    `).join('') || '';

    const html = `
      <html><head><title>Invoice #${booking.id}</title>
      <style>body{font-family:sans-serif;padding:40px;color:#333}.header{text-align:center;border-bottom:2px solid #eee;padding-bottom:20px;margin-bottom:30px}.box{background:#f8fafc;padding:15px;border:1px solid #eee;border-radius:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{text-align:left;background:#e2e8f0;padding:10px}td{border-bottom:1px solid #eee;padding:10px}.total{text-align:right;font-size:20px;color:#16a34a;font-weight:bold;margin-top:30px}</style>
      </head><body>
      <div class="header"><h1>Atithi Hotel</h1><p>Invoice #${booking.id}</p></div>
      <div class="grid">
        <div class="box"><strong>Billed To:</strong><br>${booking.guest_details?.full_name}</div>
        <div class="box"><strong>Details:</strong><br>Date: ${new Date().toLocaleDateString()}</div>
      </div>
      <table><thead><tr><th>Item</th><th>Dates</th><th>Amount</th></tr></thead><tbody>
        <tr><td>Room Charge (${booking.room_details?.room_number})</td><td>${new Date(booking.check_in_date).toLocaleString()} to ${new Date(booking.check_out_date).toLocaleString()}</td><td>₹${booking.total_amount}</td></tr>
        ${extrasRows}
      </tbody></table>
      <div class="total">Total: ₹${grandTotal}</div>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // 🧙‍♂️ WIZARD LOGIC
  const calculateTotal = () => {
    if (bookingData.room && bookingData.check_in_date && bookingData.check_out_date) {
      const room = rooms.find(r => r.id === parseInt(bookingData.room));
      const start = new Date(bookingData.check_in_date);
      const end = new Date(bookingData.check_out_date);
      // Calculate hours to handle morning/evening bookings
      const hours = Math.abs(end - start) / 36e5;
      const days = Math.ceil(hours / 24); 
      if (room && days > 0) return days * room.price_per_night;
    }
    return 0;
  };

  const handleBookingSubmit = async () => {
    const finalAmount = calculateTotal();
    try {
      const response = await fetch(API_URL + '/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...bookingData, total_amount: finalAmount })
      });
      if (response.ok) { 
        alert("Booking Confirmed! 🎉"); 
        setShowWizard(false); 
        fetchAllData(); 
        setBookingData({ room: '', guest: '', check_in_date: '', check_out_date: '', total_amount: 0, status: 'CONFIRMED' });
        setCurrentStep(1);
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.detail || "Could not confirm booking. Check for conflicts."}`);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Reservations</h2>
          <p className="text-slate-500">Manage bookings and invoices</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg">
          <Plus size={20}/> New Reservation
        </button>
      </div>

      {/* 🧙‍♂️ RESERVATION WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[600px] shadow-2xl overflow-hidden animate-fade-in-up">
            
            {/* Header Steps */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
               <h3 className="font-bold text-slate-700">New Booking Wizard</h3>
               <button onClick={() => setShowWizard(false)}><X size={20} className="text-slate-400 hover:text-red-500"/></button>
            </div>

            {/* Steps Indicator */}
            <div className="flex justify-center gap-4 py-4 border-b border-slate-50">
               <div className={`flex items-center gap-2 text-sm font-bold ${currentStep >= 1 ? 'text-blue-600' : 'text-slate-300'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${currentStep >= 1 ? 'bg-blue-100 border-blue-600' : 'border-slate-300'}`}>1</div> Timing
               </div>
               <div className="w-8 h-px bg-slate-200 mt-3"></div>
               <div className={`flex items-center gap-2 text-sm font-bold ${currentStep >= 2 ? 'text-blue-600' : 'text-slate-300'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${currentStep >= 2 ? 'bg-blue-100 border-blue-600' : 'border-slate-300'}`}>2</div> Guest
               </div>
               <div className="w-8 h-px bg-slate-200 mt-3"></div>
               <div className={`flex items-center gap-2 text-sm font-bold ${currentStep >= 3 ? 'text-blue-600' : 'text-slate-300'}`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${currentStep >= 3 ? 'bg-blue-100 border-blue-600' : 'border-slate-300'}`}>3</div> Pay
               </div>
            </div>

            {/* Wizard Content */}
            <div className="p-8">
              
              {/* STEP 1: SMART ROOM & TIME SELECTION */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="text-blue-500"/> Select Stay Timing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Check-In Arrival</label>
                      <input type="datetime-local" className="w-full border p-3 rounded-lg bg-slate-50" 
                        value={bookingData.check_in_date} onChange={(e) => setBookingData({...bookingData, check_in_date: e.target.value})}/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Check-Out Departure</label>
                      <input type="datetime-local" className="w-full border p-3 rounded-lg bg-slate-50" 
                        value={bookingData.check_out_date} onChange={(e) => setBookingData({...bookingData, check_out_date: e.target.value})}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Rooms for this Time</label>
                    <select 
                      className="w-full border p-3 rounded-lg" 
                      value={bookingData.room} 
                      onChange={(e) => setBookingData({...bookingData, room: e.target.value})}
                      disabled={!bookingData.check_in_date || !bookingData.check_out_date}
                    >
                      <option value="">-- Choose Free Room --</option>
                      {rooms.filter(room => {
                        if (room.status === 'MAINTENANCE') return false;
                        
                        // Smart Conflict Check for specific time window
                        const hasConflict = bookings.some(b => {
                          if (b.room !== room.id) return false;
                          if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false;

                          const newStart = new Date(bookingData.check_in_date);
                          const newEnd = new Date(bookingData.check_out_date);
                          const existStart = new Date(b.check_in_date);
                          const existEnd = new Date(b.check_out_date);

                          return (newStart < existEnd && newEnd > existStart);
                        });

                        return !hasConflict;
                      }).map(r => (
                        <option key={r.id} value={r.id}>Room {r.room_number} ({r.room_type}) - ₹{r.price_per_night}/night</option>
                      ))}
                    </select>
                    {!bookingData.check_in_date && (
                      <p className="text-[10px] text-orange-500 mt-1">* Please select arrival/departure time first to check room availability</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: GUEST */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><User className="text-blue-500"/> Guest Details</h4>
                  <select className="w-full border p-3 rounded-lg bg-slate-50" value={bookingData.guest} onChange={(e) => setBookingData({...bookingData, guest: e.target.value})}>
                    <option value="">-- Select Existing Guest --</option>
                    {guests.map(g => <option key={g.id} value={g.id}>{g.full_name} ({g.phone})</option>)}
                  </select>
                  <div className="text-center text-xs text-slate-400 my-2">- OR -</div>
                  <button onClick={() => window.location.href='/guests'} className="w-full border-2 border-dashed border-slate-300 text-slate-500 p-3 rounded-lg hover:border-blue-500 hover:text-blue-500">
                    + Register New Guest Profile
                  </button>
                </div>
              )}

              {/* STEP 3: CONFIRM */}
              {currentStep === 3 && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600"/>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Confirm Reservation</h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-left text-sm space-y-2 border border-slate-100">
                    <div className="flex justify-between"><span>Room:</span> <strong>{rooms.find(r => r.id === parseInt(bookingData.room))?.room_number}</strong></div>
                    <div className="flex justify-between"><span>Arrival:</span> <strong>{new Date(bookingData.check_in_date).toLocaleString()}</strong></div>
                    <div className="flex justify-between"><span>Departure:</span> <strong>{new Date(bookingData.check_out_date).toLocaleString()}</strong></div>
                    <div className="flex justify-between text-lg font-bold text-blue-600 border-t border-slate-200 pt-2 mt-2">
                      <span>Grand Total:</span> <span>₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 p-4 flex justify-between">
              {currentStep > 1 ? (
                <button onClick={() => setCurrentStep(currentStep - 1)} className="text-slate-500 font-bold px-4 py-2 hover:bg-slate-200 rounded-lg">Back</button>
              ) : <div></div>}
              
              {currentStep < 3 ? (
                <button 
                  disabled={!bookingData.room || !bookingData.check_in_date}
                  onClick={() => setCurrentStep(currentStep + 1)} 
                  className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  Next Step <ChevronRight size={16}/>
                </button>
              ) : (
                <button onClick={handleBookingSubmit} className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                  Confirm Booking <CheckCircle size={16}/>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* POS CHARGE MODAL */}
      {showChargeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Add Service Charge</h3>
            <form onSubmit={handleAddCharge} className="flex flex-col gap-4">
              <select className="border p-2 rounded" required value={chargeData.service} onChange={(e) => setChargeData({...chargeData, service: e.target.value})}>
                <option value="">-- Select Item --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>)}
              </select>
              <input type="number" min="1" className="border p-2 rounded" required value={chargeData.quantity} onChange={(e) => setChargeData({...chargeData, quantity: e.target.value})}/>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowChargeForm(null)} className="flex-1 bg-slate-200 py-2 rounded">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKINGS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
            <tr><th className="p-4">Guest</th><th className="p-4">Room</th><th className="p-4">Stay Timing</th><th className="p-4">Total</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-700">{b.guest_details?.full_name}</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{b.room_details?.room_number}</span></td>
                <td className="p-4 text-slate-500 text-xs">
                  {new Date(b.check_in_date).toLocaleString()} <br/> 
                  <span className="text-slate-300">to</span> <br/>
                  {new Date(b.check_out_date).toLocaleString()}
                </td>
                <td className="p-4 font-bold text-green-600">₹{parseFloat(b.total_amount) + (b.charges?.reduce((s, i) => s + parseFloat(i.total_cost), 0) || 0)}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => setShowChargeForm(b.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded" title="POS"><ShoppingCart size={18}/></button>
                  <button onClick={() => handlePrintInvoice(b)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Invoice"><Printer size={18}/></button>
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