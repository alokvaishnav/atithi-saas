import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// Adjusted import path to go up two levels from 'pages/public/'
import { API_URL } from '../../config'; 
import { 
  Hotel, MapPin, Calendar, Users, ArrowRight, 
  Loader2, CheckCircle, AlertCircle, Phone, Mail 
} from 'lucide-react';

const BookingSite = () => {
  const { username } = useParams();
  
  // --- STATE MANAGEMENT ---
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // --- FORM STATE ---
  const [form, setForm] = useState({
    guest_name: '', 
    guest_email: '', 
    guest_phone: '',
    check_in: '', 
    check_out: '', 
    adults: 1, 
    children: 0,
    room_type: ''
  });

  // Helper: Get today's date for date picker constraints (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // 1. FETCH HOTEL DATA
  useEffect(() => {
    const fetchHotel = async () => {
        try {
            // Public Endpoint: Fetch Hotel Details & Rooms by Username
            const res = await fetch(`${API_URL}/api/public/hotel/${username}/`);
            
            if (res.ok) {
                const data = await res.json();
                setHotelData(data);
                
                // UX Improvement: Auto-select the first room type if available
                if (data.rooms && data.rooms.length > 0) {
                    setForm(prev => ({ ...prev, room_type: data.rooms[0].room_type }));
                }
            } else {
                setError("Hotel not found or currently offline.");
            }
        } catch(err) { 
            console.error("Booking Page Error:", err);
            setError("Unable to connect to the booking server. Please try again later.");
        } finally { 
            setLoading(false); 
        }
    };
    fetchHotel();
  }, [username]);

  // 2. HANDLE BOOKING SUBMISSION
  const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!form.room_type) return alert("Please select a room type.");
      
      setSubmitting(true);
      try {
          const res = await fetch(`${API_URL}/api/public/book/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  ...form, 
                  hotel_username: username 
              })
          });
          
          if (res.ok) {
              setBookingSuccess(true);
              window.scrollTo(0, 0); // Scroll to top to show success message
          } else {
              const err = await res.json();
              // Handle specific Django validation errors or generic messages
              const errorMsg = err.error || 
                               (err.check_out ? err.check_out[0] : "Room might be unavailable for these dates.");
              alert("Booking Failed: " + errorMsg);
          }
      } catch (err) { 
          alert("Network Error. Please check your internet connection."); 
      } finally {
          setSubmitting(false);
      }
  };

  // --- RENDER: LOADING STATE ---
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12"/>
    </div>
  );

  // --- RENDER: ERROR STATE ---
  if (error || !hotelData) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <div className="bg-red-50 p-6 rounded-full mb-4 animate-bounce">
            <AlertCircle size={48} className="text-red-500"/>
        </div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Unavailable</h1>
        <p className="text-slate-500 max-w-md">{error || "This hotel page does not exist."}</p>
    </div>
  );

  // --- RENDER: SUCCESS STATE ---
  if (bookingSuccess) return (
      <div className="h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-6 rounded-full shadow-xl mb-6">
            <CheckCircle size={64} className="text-green-600 animate-bounce"/>
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Booking Confirmed!</h1>
          <p className="text-slate-600 max-w-md text-lg leading-relaxed mb-8">
            Thank you for choosing <strong>{hotelData.hotel.hotel_name}</strong>.<br/>
            Your reservation is secure. We look forward to hosting you!
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
          >
            Book Another Room
          </button>
      </div>
  );

  // --- RENDER: MAIN BOOKING INTERFACE ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 selection:bg-blue-100">
      
      {/* 1. HERO HEADER */}
      <div className="bg-slate-900 text-white py-20 px-8 text-center rounded-b-[60px] shadow-2xl relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] bg-purple-500 rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
              {/* Hotel Logo Logic */}
              {hotelData.hotel.logo ? (
                  <img src={hotelData.hotel.logo} alt="Logo" className="w-24 h-24 mx-auto mb-6 rounded-2xl object-cover border-4 border-white/20 shadow-lg bg-white"/>
              ) : (
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 backdrop-blur-md">
                    <Hotel size={40} className="text-blue-400"/>
                  </div>
              )}
              
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4 leading-tight">
                {hotelData.hotel.hotel_name}
              </h1>
              
              <p className="flex items-center justify-center gap-2 text-blue-200 text-sm md:text-base font-bold uppercase tracking-widest bg-white/5 inline-flex px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-sm">
                  <MapPin size={16}/> {hotelData.hotel.address || 'Location unavailable'}
              </p>
              
              {hotelData.hotel.description && (
                  <p className="mt-6 text-slate-400 max-w-xl mx-auto text-sm leading-relaxed hidden md:block">
                      {hotelData.hotel.description}
                  </p>
              )}
          </div>
      </div>

      {/* 2. BOOKING FORM CONTAINER */}
      <div className="max-w-5xl mx-auto -mt-16 px-4 relative z-20">
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-700">
              
              {/* SECTION A: DATES & GUEST COUNT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {/* Date Picker */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                          <Calendar size={14}/> Stay Dates
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex-1 w-full">
                              <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Check In</p>
                              <input 
                                required 
                                type="date" 
                                min={today}
                                className="w-full bg-white p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer" 
                                onChange={e => setForm({...form, check_in: e.target.value})} 
                              />
                          </div>
                          <span className="text-slate-300 mt-0 sm:mt-6 hidden sm:block">→</span>
                          <div className="flex-1 w-full">
                              <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Check Out</p>
                              <input 
                                required 
                                type="date" 
                                min={form.check_in || today}
                                className="w-full bg-white p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer" 
                                onChange={e => setForm({...form, check_out: e.target.value})} 
                              />
                          </div>
                      </div>
                  </div>

                  {/* Guest Count */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md">
                      <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                          <Users size={14}/> Guest Count
                      </label>
                      <div className="flex gap-4">
                          <div className="flex-1">
                              <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Adults (12+)</p>
                              <input 
                                required type="number" min="1" defaultValue="1" 
                                className="w-full bg-white p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                                onChange={e => setForm({...form, adults: parseInt(e.target.value)})} 
                              />
                          </div>
                          <div className="flex-1">
                              <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Children</p>
                              <input 
                                type="number" min="0" defaultValue="0" 
                                className="w-full bg-white p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                                onChange={e => setForm({...form, children: parseInt(e.target.value)})} 
                              />
                          </div>
                      </div>
                  </div>
              </div>

              {/* SECTION B: ROOM SELECTION */}
              <div className="mb-12">
                  <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm shadow-lg">2</span>
                    Select Your Room
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Logic to show message if no rooms exist */}
                      {hotelData.rooms.length === 0 ? (
                          <div className="col-span-full text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 font-bold">
                              No rooms available for online booking at the moment.
                          </div>
                      ) : (
                          // Unique Room Types Logic: Groups multiple rooms of same type
                          [...new Set(hotelData.rooms.map(r => r.room_type))].map(type => {
                              const room = hotelData.rooms.find(r => r.room_type === type);
                              const isSelected = form.room_type === type;
                              
                              return (
                                  <label key={type} className={`relative block p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 group ${isSelected ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100 scale-[1.02]' : 'border-slate-100 hover:border-blue-200 hover:shadow-md'}`}>
                                      <input 
                                        type="radio" name="room" value={type} className="hidden" 
                                        checked={isSelected}
                                        onChange={() => setForm({...form, room_type: type})} 
                                      />
                                      
                                      {isSelected && (
                                          <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-md animate-in zoom-in">
                                              <CheckCircle size={16}/>
                                          </div>
                                      )}

                                      <div className="flex justify-between items-start mb-4">
                                          <div>
                                              <p className="font-black text-slate-800 uppercase tracking-tight text-lg group-hover:text-blue-700 transition-colors">
                                                {type.replace(/_/g, ' ')}
                                              </p>
                                              <p className="text-xs text-slate-500 font-bold mt-1 bg-white inline-block px-2 py-1 rounded-md border border-slate-100">
                                                Max {room.capacity} Guests
                                              </p>
                                          </div>
                                      </div>
                                      
                                      <div className="mt-6 pt-6 border-t border-slate-200/60 flex justify-between items-end">
                                          <div>
                                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Price Per Night</p>
                                              <p className="text-2xl font-black text-slate-900 tracking-tight">
                                                <span className="text-sm align-top text-slate-400 mr-0.5">{hotelData.hotel.currency_symbol || '₹'}</span>
                                                {room.price_per_night}
                                              </p>
                                          </div>
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                                              <ArrowRight size={16}/>
                                          </div>
                                      </div>
                                  </label>
                              );
                          })
                      )}
                  </div>
              </div>

              {/* SECTION C: GUEST DETAILS */}
              <div className="mb-10">
                  <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm shadow-lg">3</span>
                    Guest Information
                  </h3>
                  
                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[30px] border border-slate-100">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Full Name</label>
                          <input 
                            required placeholder="e.g. John Doe" 
                            className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-200 focus:border-blue-500 outline-none transition-all focus:shadow-lg focus:shadow-blue-100/50 placeholder:font-normal placeholder:text-slate-300"
                            onChange={e => setForm({...form, guest_name: e.target.value})} 
                          />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Email Address</label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                <input 
                                    required type="email" placeholder="john@example.com" 
                                    className="w-full p-4 pl-12 bg-white rounded-2xl font-bold border border-slate-200 focus:border-blue-500 outline-none transition-all focus:shadow-lg focus:shadow-blue-100/50 placeholder:font-normal placeholder:text-slate-300"
                                    onChange={e => setForm({...form, guest_email: e.target.value})} 
                                />
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Phone Number</label>
                              <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                <input 
                                    required type="tel" placeholder="+91 98765 43210" 
                                    className="w-full p-4 pl-12 bg-white rounded-2xl font-bold border border-slate-200 focus:border-blue-500 outline-none transition-all focus:shadow-lg focus:shadow-blue-100/50 placeholder:font-normal placeholder:text-slate-300"
                                    onChange={e => setForm({...form, guest_phone: e.target.value})} 
                                />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button 
                  type="submit" 
                  disabled={submitting || !form.room_type} 
                  className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 active:bg-blue-700 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                  {submitting ? <Loader2 className="animate-spin"/> : (
                      <>
                        Confirm Booking <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                      </>
                  )}
              </button>
              
              <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-wider flex justify-center items-center gap-1">
                  <CheckCircle size={12} className="text-green-500"/> Secure Booking powered by Atithi SaaS
              </p>

          </form>
      </div>
    </div>
  );
};

export default BookingSite;