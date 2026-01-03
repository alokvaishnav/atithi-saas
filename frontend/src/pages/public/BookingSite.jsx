import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import { Hotel, MapPin, Calendar, Users, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

const BookingSite = () => {
  const { username } = useParams();
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    check_in: '', check_out: '', adults: 1, children: 0,
    room_type: ''
  });

  useEffect(() => {
    const fetchHotel = async () => {
        try {
            const res = await fetch(`${API_URL}/api/public/hotel/${username}/`);
            if (res.ok) setHotelData(await res.json());
        } catch(err) { console.error(err); } 
        finally { setLoading(false); }
    };
    fetchHotel();
  }, [username]);

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const res = await fetch(`${API_URL}/api/public/book/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...form, hotel_username: username })
          });
          if (res.ok) setBookingSuccess(true);
          else alert("Booking failed. Room might be unavailable.");
      } catch (err) { alert("Network Error"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!hotelData) return <div className="h-screen flex items-center justify-center text-slate-400 font-black uppercase">Hotel Not Found</div>;

  if (bookingSuccess) return (
      <div className="h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle size={64} className="text-green-600 mb-6 animate-bounce"/>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-500 max-w-md">Thank you for choosing {hotelData.hotel.hotel_name}. We have sent a confirmation to your email.</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Banner */}
      <div className="bg-slate-900 text-white py-16 px-8 text-center rounded-b-[50px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
              <Hotel size={48} className="mx-auto mb-4 text-blue-500"/>
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">{hotelData.hotel.hotel_name}</h1>
              <p className="flex items-center justify-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                  <MapPin size={14}/> {hotelData.hotel.address || 'Location unavailable'}
              </p>
          </div>
      </div>

      <div className="max-w-4xl mx-auto -mt-10 px-4 pb-20">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
              
              {/* Date & Guest Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                          <Calendar size={14}/> Dates
                      </label>
                      <div className="flex gap-2">
                          <input required type="date" className="w-full bg-transparent font-bold outline-none" 
                              onChange={e => setForm({...form, check_in: e.target.value})} />
                          <span className="text-slate-300">to</span>
                          <input required type="date" className="w-full bg-transparent font-bold outline-none" 
                              onChange={e => setForm({...form, check_out: e.target.value})} />
                      </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                          <Users size={14}/> Guests
                      </label>
                      <div className="flex gap-4">
                          <input required type="number" min="1" placeholder="Adults" className="w-full bg-transparent font-bold outline-none" 
                              onChange={e => setForm({...form, adults: parseInt(e.target.value)})} />
                          <input type="number" min="0" placeholder="Children" className="w-full bg-transparent font-bold outline-none" 
                              onChange={e => setForm({...form, children: parseInt(e.target.value)})} />
                      </div>
                  </div>
              </div>

              {/* Room Selection */}
              <h3 className="text-xl font-black text-slate-800 mb-4">Select Room</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Deduping rooms by type for display */}
                  {[...new Set(hotelData.rooms.map(r => r.room_type))].map(type => {
                      const room = hotelData.rooms.find(r => r.room_type === type);
                      return (
                          <label key={type} className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all ${form.room_type === type ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                              <input type="radio" name="room" value={type} className="hidden" onChange={() => setForm({...form, room_type: type})} />
                              <div className="flex justify-between items-center">
                                  <div>
                                      <p className="font-black text-slate-800 uppercase tracking-wide">{type}</p>
                                      <p className="text-xs text-slate-500 font-bold">Max {room.capacity} Guests</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xl font-black text-blue-600">{hotelData.hotel.currency_symbol}{room.price_per_night}</p>
                                      <p className="text-[10px] uppercase font-bold text-slate-400">/ Night</p>
                                  </div>
                              </div>
                          </label>
                      );
                  })}
              </div>

              {/* Guest Details */}
              <h3 className="text-xl font-black text-slate-800 mb-4">Your Details</h3>
              <div className="space-y-4 mb-8">
                  <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                      onChange={e => setForm({...form, guest_name: e.target.value})} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                          onChange={e => setForm({...form, guest_email: e.target.value})} />
                      <input required type="tel" placeholder="Phone Number" className="w-full p-4 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                          onChange={e => setForm({...form, guest_phone: e.target.value})} />
                  </div>
              </div>

              <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3">
                  Confirm Booking <ArrowRight size={20}/>
              </button>

          </form>
      </div>
    </div>
  );
};

export default BookingSite;