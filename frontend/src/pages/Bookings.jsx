import { useEffect, useState } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { API_URL } from '../config'; // <--- Importing the Cloud URL

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [showForm, setShowForm] = useState(false);

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
      const [resBookings, resRooms, resGuests] = await Promise.all([
        fetch(API_URL + '/api/bookings/'),
        fetch(API_URL + '/api/rooms/'),
        fetch(API_URL + '/api/guests/')
      ]);
      
      setBookings(await resBookings.json());
      setRooms(await resRooms.json());
      setGuests(await resGuests.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ---------------------------------------------------------
  // 🧠 THE BRAIN: Auto-Calculate Price
  // ---------------------------------------------------------
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
  // ---------------------------------------------------------

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL + '/api/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
              <th className="p-4 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
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
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                    {booking.status}
                  </span>
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