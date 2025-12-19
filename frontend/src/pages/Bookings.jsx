import { useEffect, useState } from 'react';
// 👇 Added ShoppingCart for the "Add to Bill" button
import { Plus, X, Calendar, Printer, ShoppingCart } from 'lucide-react'; 
import { API_URL } from '../config'; 

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [services, setServices] = useState([]); // 👈 Store Menu Items
  
  // Modals
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(null); // Stores Booking ID when open

  const token = localStorage.getItem('access_token');

  // New Booking Data
  const [bookingData, setBookingData] = useState({
    room: '', guest: '', check_in_date: '', check_out_date: '', total_amount: '', status: 'CONFIRMED'
  });

  // Charge Data (POS)
  const [chargeData, setChargeData] = useState({
    service: '', quantity: 1
  });

  // 1. Fetch ALL Data
  const fetchAllData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resBookings, resRooms, resGuests, resServices] = await Promise.all([
        fetch(API_URL + '/api/bookings/', { headers }),
        fetch(API_URL + '/api/rooms/', { headers }),
        fetch(API_URL + '/api/guests/', { headers }),
        fetch(API_URL + '/api/services/', { headers }) // 👈 Fetch Menu
      ]);
      
      if (resBookings.ok) setBookings(await resBookings.json());
      if (resRooms.ok) setRooms(await resRooms.json());
      if (resGuests.ok) setGuests(await resGuests.json());
      if (resServices.ok) setServices(await resServices.json());

    } catch (err) { console.error("Error fetching data:", err); }
  };

  useEffect(() => { fetchAllData(); }, []);

  // ---------------------------------------------------------
  // 🛒 POS LOGIC: Add Charge to Booking
  // ---------------------------------------------------------
  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!showChargeForm) return;

    // Find price of selected service
    const selectedService = services.find(s => s.id === parseInt(chargeData.service));
    const totalCost = selectedService ? selectedService.price * chargeData.quantity : 0;

    const payload = {
      booking: showChargeForm, // The ID of the booking we are charging
      service: chargeData.service,
      quantity: chargeData.quantity,
      total_cost: totalCost
    };

    try {
      const response = await fetch(API_URL + '/api/charges/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Item Added to Bill! 🛒");
        setShowChargeForm(null); // Close modal
        setChargeData({ service: '', quantity: 1 });
        fetchAllData(); // Refresh to see updated total
      } else {
        alert("Failed to add charge. (Did you update the Backend?)");
      }
    } catch (error) { console.error(error); }
  };

  // ---------------------------------------------------------
  // 🖨️ PRINT INVOICE LOGIC (Updated to include POS Items)
  // ---------------------------------------------------------
  const handlePrintInvoice = (booking) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    
    // Calculate Extras Total
    const extrasTotal = booking.charges ? booking.charges.reduce((sum, item) => sum + parseFloat(item.total_cost), 0) : 0;
    const grandTotal = parseFloat(booking.total_amount) + extrasTotal;

    // Generate Rows for Extra Charges
    const extrasRows = booking.charges?.map(charge => `
      <tr>
        <td>${charge.service_name || 'Service'} (x${charge.quantity})</td>
        <td>-</td>
        <td>₹${charge.total_cost}</td>
      </tr>
    `).join('') || '';

    const invoiceContent = `
      <html>
        <head>
          <title>Invoice #${booking.id}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .h-title { font-size: 24px; font-weight: bold; color: #2563eb; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { text-align: left; background: #e2e8f0; padding: 10px; }
            .table td { border-bottom: 1px solid #eee; padding: 10px; }
            .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 30px; color: #16a34a; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px;}
          </style>
        </head>
        <body>
          <div class="header">
            <div class="h-title">Atithi Hotel</div>
            <p>123 Hotel Street, City Center, India</p>
          </div>

          <div class="info-grid">
            <div class="box">
              <strong>Billed To:</strong><br>${booking.guest_details?.full_name}<br>Phone: ${booking.guest_details?.phone}
            </div>
            <div class="box">
              <strong>Invoice:</strong><br>#INV-${booking.id}<br>Date: ${new Date().toLocaleDateString()}
            </div>
          </div>

          <table class="table">
            <thead><tr><th>Description</th><th>Dates</th><th>Amount</th></tr></thead>
            <tbody>
              <tr>
                <td>Room Charge (${booking.room_details?.room_number})</td>
                <td>${booking.check_in_date} to ${booking.check_out_date}</td>
                <td>₹${booking.total_amount}</td>
              </tr>
              ${extrasRows} 
            </tbody>
          </table>

          <div class="total">Grand Total: ₹${grandTotal}</div>
          <div class="footer">Thank you for staying with us!</div>
        </body>
      </html>
    `;
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  // Form Handlers
  const handleBookingChange = (e) => setBookingData({ ...bookingData, [e.target.name]: e.target.value });

  // Auto-Calculate Room Price
  useEffect(() => {
    if (bookingData.room && bookingData.check_in_date && bookingData.check_out_date) {
      const selectedRoom = rooms.find(r => r.id === parseInt(bookingData.room));
      const start = new Date(bookingData.check_in_date);
      const end = new Date(bookingData.check_out_date);
      const daysDiff = Math.ceil((end - start) / (1000 * 3600 * 24)); 
      if (selectedRoom && daysDiff > 0) {
        setBookingData(prev => ({ ...prev, total_amount: daysDiff * selectedRoom.price_per_night }));
      }
    }
  }, [bookingData.room, bookingData.check_in_date, bookingData.check_out_date, rooms]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL + '/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(bookingData)
      });
      if (response.ok) { alert("Booking Created!"); setShowBookingForm(false); fetchAllData(); }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Booking Management</h2>
        <button onClick={() => setShowBookingForm(!showBookingForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          {showBookingForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> New Booking</>}
        </button>
      </div>

      {/* NEW BOOKING FORM */}
      {showBookingForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 mb-8 animate-pulse-once">
          <h3 className="text-lg font-bold mb-4">Create Reservation</h3>
          <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select name="guest" className="border p-2 rounded" required value={bookingData.guest} onChange={handleBookingChange}>
              <option value="">-- Select Guest --</option>
              {guests.map(g => <option key={g.id} value={g.id}>{g.full_name}</option>)}
            </select>
            <select name="room" className="border p-2 rounded" required value={bookingData.room} onChange={handleBookingChange}>
              <option value="">-- Select Room --</option>
              {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} (₹{r.price_per_night})</option>)}
            </select>
            <input type="date" name="check_in_date" className="border p-2 rounded" required value={bookingData.check_in_date} onChange={handleBookingChange} />
            <input type="date" name="check_out_date" className="border p-2 rounded" required value={bookingData.check_out_date} onChange={handleBookingChange} />
            <input type="number" className="border p-2 rounded bg-slate-100" readOnly value={bookingData.total_amount} placeholder="Total Amount" />
            <button type="submit" className="md:col-span-2 bg-green-600 text-white py-2 rounded font-bold">Confirm Booking</button>
          </form>
        </div>
      )}

      {/* CHARGE MODAL (POPUP) */}
      {showChargeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Item to Bill</h3>
              <button onClick={() => setShowChargeForm(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddCharge} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Select Item</label>
                <select className="w-full border p-2 rounded" required 
                  value={chargeData.service} 
                  onChange={(e) => setChargeData({...chargeData, service: e.target.value})}>
                  <option value="">-- Choose Menu Item --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Quantity</label>
                <input type="number" min="1" className="w-full border p-2 rounded" required 
                  value={chargeData.quantity} 
                  onChange={(e) => setChargeData({...chargeData, quantity: e.target.value})}/>
              </div>
              <button type="submit" className="bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Add Charge</button>
            </form>
          </div>
        </div>
      )}

      {/* BOOKINGS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr><th className="p-4">Guest</th><th className="p-4">Room</th><th className="p-4">Dates</th><th className="p-4">Total</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? bookings.map(b => {
              // Calculate Live Total (Room + Extras)
              const extras = b.charges ? b.charges.reduce((sum, i) => sum + parseFloat(i.total_cost), 0) : 0;
              const grandTotal = parseFloat(b.total_amount) + extras;

              return (
                <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-4 font-bold">{b.guest_details?.full_name}</td>
                  <td className="p-4">{b.room_details?.room_number}</td>
                  <td className="p-4 text-sm text-slate-500">{b.check_in_date} <br/>to {b.check_out_date}</td>
                  <td className="p-4">
                    <div className="font-bold text-green-600">₹{grandTotal}</div>
                    {extras > 0 && <div className="text-xs text-slate-400">(Includes ₹{extras} extras)</div>}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {/* ADD CHARGE BUTTON (Shopping Cart) */}
                    <button 
                      onClick={() => setShowChargeForm(b.id)}
                      className="bg-orange-100 text-orange-700 p-2 rounded hover:bg-orange-200 transition" 
                      title="Add Food/Service"
                    >
                      <ShoppingCart size={16} />
                    </button>
                    {/* PRINT BUTTON */}
                    <button 
                      onClick={() => handlePrintInvoice(b)}
                      className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200 transition" 
                      title="Print Invoice"
                    >
                      <Printer size={16} />
                    </button>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan="5" className="p-8 text-center text-slate-400">No bookings found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;