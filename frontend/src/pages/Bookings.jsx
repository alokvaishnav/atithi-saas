import { useEffect, useState } from 'react';
import { Plus, X, Calendar, Printer } from 'lucide-react'; // 👈 Added Printer Icon
import { API_URL } from '../config'; 

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // 🔐 Get the Token
  const token = localStorage.getItem('access_token');

  // Form Data
  const [formData, setFormData] = useState({
    room: '',
    guest: '',
    check_in_date: '',
    check_out_date: '',
    total_amount: '',
    status: 'CONFIRMED'
  });

  // 1. Fetch ALL Data
  const fetchAllData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [resBookings, resRooms, resGuests] = await Promise.all([
        fetch(API_URL + '/api/bookings/', { headers }),
        fetch(API_URL + '/api/rooms/', { headers }),
        fetch(API_URL + '/api/guests/', { headers })
      ]);
      
      if (resBookings.ok && resRooms.ok && resGuests.ok) {
        setBookings(await resBookings.json());
        setRooms(await resRooms.json());
        setGuests(await resGuests.json());
      } else {
        console.error("Failed to fetch data. Check if you are logged in.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 👇 2. NEW: PRINT INVOICE FUNCTION
  const handlePrintInvoice = (booking) => {
    // Create a new invisible window
    const printWindow = window.open('', '', 'width=800,height=600');
    
    // HTML Content for the Invoice
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
            <p>Phone: +91 98765 43210</p>
          </div>

          <div class="info-grid">
            <div class="box">
              <strong>Billed To:</strong><br>
              ${booking.guest_details?.full_name}<br>
              Phone: ${booking.guest_details?.phone}
            </div>
            <div class="box">
              <strong>Invoice Details:</strong><br>
              Invoice #: INV-${booking.id}<br>
              Date: ${new Date().toLocaleDateString()}<br>
              Status: <span style="color: green">PAID</span>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Dates</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Room Charge (Room ${booking.room_details?.room_number})</td>
                <td>${booking.check_in_date} to ${booking.check_out_date}</td>
                <td>₹${booking.total_amount}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Paid: ₹${booking.total_amount}
          </div>

          <div class="footer">
            Thank you for staying with us! <br>
            This is a computer-generated invoice.
          </div>
        </body>
      </html>
    `;

    // Write content to the new window and print
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Auto-Calculate Price
  useEffect(() => {
    if (formData.room && formData.check_in_date && formData.check_out_date) {
      const selectedRoom = rooms.find(r => r.id === parseInt(formData.room));
      const start = new Date(formData.check_in_date);
      const end = new Date(formData.check_out_date);
      const timeDiff = end - start;
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

      if (selectedRoom && daysDiff > 0) {
        const total = daysDiff * selectedRoom.price_per_night;
        setFormData(prev => ({ ...prev, total_amount: total }));
      }
    }
  }, [formData.room, formData.check_in_date, formData.check_out_date, rooms]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL + '/api/bookings/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Booking Created Successfully! 📅");
        setShowForm(false);
        setFormData({ room: '', guest: '', check_in_date: '', check_out_date: '', total_amount: '', status: 'CONFIRMED' });
        fetchAllData();
      } else {
        const errorData = await response.json();
        alert("Error: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Booking Management</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> New Booking</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 mb-8 animate-pulse-once">
          <h3 className="text-lg font-bold mb-4">Create New Reservation</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="text-xs text-slate-500 font-bold">Select Guest</label>
              <select name="guest" className="w-full border p-2 rounded bg-slate-50" required 
                value={formData.guest} onChange={handleChange}>
                <option value="">-- Choose a Guest --</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-bold">Select Room</label>
              <select name="room" className="w-full border p-2 rounded bg-slate-50" required
                value={formData.room} onChange={handleChange}>
                <option value="">-- Choose a Room --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} - ₹{r.price_per_night}/night
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">Check-In</label>
                <input type="date" name="check_in_date" className="w-full border p-2 rounded" required
                  value={formData.check_in_date} onChange={handleChange} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Check-Out</label>
                <input type="date" name="check_out_date" className="w-full border p-2 rounded" required
                  value={formData.check_out_date} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-bold text-blue-600">Total Amount (₹)</label>
              <input type="number" name="total_amount" className="w-full border p-2 rounded bg-slate-100 font-bold text-slate-700"
                readOnly
                value={formData.total_amount} onChange={handleChange} />
            </div>

            <div className="md:col-span-2 mt-2">
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">ID</th>
              <th className="p-4 font-semibold text-slate-600">Guest</th>
              <th className="p-4 font-semibold text-slate-600">Room</th>
              <th className="p-4 font-semibold text-slate-600">Dates</th>
              <th className="p-4 font-semibold text-slate-600">Amount</th>
              <th className="p-4 font-semibold text-slate-600">Invoice</th> {/* 👈 New Column */}
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map(booking => (
                <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-4 text-slate-400">#{booking.id}</td>
                  <td className="p-4 font-bold text-slate-800">
                    {booking.guest_details ? booking.guest_details.full_name : 'Unknown'}
                  </td>
                  <td className="p-4 text-slate-600">
                    Room {booking.room_details ? booking.room_details.room_number : 'N/A'}
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar size={14}/> {booking.check_in_date}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-green-600">₹{booking.total_amount}</td>
                  <td className="p-4">
                    {/* 👇 NEW: PRINT BUTTON */}
                    <button 
                      onClick={() => handlePrintInvoice(booking)}
                      className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-3 py-1 rounded-full text-sm font-medium"
                      title="Print Invoice"
                    >
                      <Printer size={16} /> Print
                    </button>
                  </td>
                </tr>
              ))
            ) : (
               <tr>
                 <td colSpan="6" className="p-8 text-center text-slate-400">
                   No bookings found.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;