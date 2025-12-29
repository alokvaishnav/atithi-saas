import { useState } from 'react';
import { X, User, Phone, Calendar } from 'lucide-react';
import api from './api';

export default function CheckInModal({ room, onClose, onBookingSuccess }) {
  const [guestData, setGuestData] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the Guest Profile first
      const guestResponse = await api.post('/guests/', guestData);
      const guestId = guestResponse.data.id;

      // 2. Create the Booking linked to that Guest and this Room
      await api.post('/bookings/', {
        room: room.id,
        guest: guestId,
        check_in_date: new Date().toISOString(), // Check in NOW
        total_amount: room.price // Simple pricing for now
      });

      // 3. Update Room Status to 'OCCUPIED'
      await api.patch(`/rooms/${room.id}/`, {
        status: 'OCCUPIED'
      });

      // 4. Done!
      onBookingSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      alert("Check-in failed! See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Check In Guest</h2>
                <p className="text-sm text-slate-500">Room {room.room_number} • {room.room_type}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Guest Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="John Doe"
                        value={guestData.full_name}
                        onChange={(e) => setGuestData({...guestData, full_name: e.target.value})}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="tel" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="+91 98765 43210"
                        value={guestData.phone}
                        onChange={(e) => setGuestData({...guestData, phone: e.target.value})}
                    />
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold text-blue-800">Total to Pay</span>
                <span className="text-xl font-black text-blue-600">₹{room.price}</span>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
            >
                {loading ? 'Processing...' : 'Confirm Check-In'}
            </button>
        </form>
      </div>
    </div>
  );
}