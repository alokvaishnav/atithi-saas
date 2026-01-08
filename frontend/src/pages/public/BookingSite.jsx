import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import { 
  Hotel, MapPin, Calendar, Users, ArrowRight, 
  Loader2, CheckCircle, AlertCircle, Phone, Mail,
  Utensils, ShoppingCart, Upload, Image as ImageIcon,
  CreditCard, Plus, Minus, Trash2, X
} from 'lucide-react';

const BookingSite = () => {
  const { username } = useParams();
  
  // --- STATE MANAGEMENT ---
  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Booking Logic
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('ROOMS'); // ROOMS | DINING
  
  // --- FORM STATE (Room Booking) ---
  const [form, setForm] = useState({
    guest_name: '', 
    guest_email: '', 
    guest_phone: '',
    check_in: '', 
    check_out: '', 
    adults: 1, 
    children: 0,
    room_type: '',
    id_proof_type: 'AADHAR',
    id_proof_number: '',
    id_proof_image: null 
  });

  // --- POS / DINING STATE ---
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({}); // Structure: { itemId: quantity }
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', room_number: '', notes: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Helper: Get today's date
  const today = new Date().toISOString().split('T')[0];

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchHotelData = async () => {
        try {
            // A. Fetch Hotel Profile & Rooms
            const res = await fetch(`${API_URL}/api/public/hotel/${username}/`);
            if (res.ok) {
                const data = await res.json();
                setHotelData(data);
                // Auto-select first room
                if (data.rooms && data.rooms.length > 0) {
                    setForm(prev => ({ ...prev, room_type: data.rooms[0].room_type }));
                }
            } else {
                setError("Hotel not found or currently offline.");
            }

            // B. Fetch Menu Items (For Dining Tab)
            const menuRes = await fetch(`${API_URL}/api/public/menu/${username}/`);
            if(menuRes.ok) {
                setMenu(await menuRes.json());
            }

        } catch(err) { 
            console.error("Fetch Error:", err);
            setError("Unable to connect to server.");
        } finally { 
            setLoading(false); 
        }
    };
    fetchHotelData();
  }, [username]);

  // --- HANDLERS: BOOKING ---
  const handleFileChange = (e) => {
      if(e.target.files[0]) {
          setForm({ ...form, id_proof_image: e.target.files[0] });
      }
  };

  const handleBookingSubmit = async (e) => {
      e.preventDefault();
      if (!form.room_type) return alert("Please select a room type.");
      
      setSubmitting(true);
      try {
          const formData = new FormData();
          Object.keys(form).forEach(key => {
              if (key !== 'id_proof_image') formData.append(key, form[key]);
          });
          if (form.id_proof_image) formData.append('id_proof_image', form.id_proof_image);
          formData.append('hotel_username', username);

          const res = await fetch(`${API_URL}/api/public/book/`, {
              method: 'POST',
              body: formData 
          });
          
          if (res.ok) {
              const result = await res.json();
              setConfirmedBooking(result);
              setBookingSuccess(true);
              // Pre-fill order form with booking details for convenience
              setOrderForm(prev => ({
                  ...prev, 
                  name: result.guest_name, 
                  room_number: result.room_number || 'Pending Assignment' 
              }));
              window.scrollTo(0, 0); 
          } else {
              const err = await res.json();
              alert("Error: " + (err.error || "Booking Failed."));
          }
      } catch (err) { 
          alert("Network Error."); 
      } finally {
          setSubmitting(false);
      }
  };

  // --- HANDLERS: DINING (POS) ---
  const updateCart = (itemId, change) => {
      setCart(prev => {
          const currentQty = prev[itemId] || 0;
          const newQty = Math.max(0, currentQty + change);
          if (newQty === 0) {
              const { [itemId]: _, ...rest } = prev;
              return rest;
          }
          return { ...prev, [itemId]: newQty };
      });
  };

  const cartTotal = useMemo(() => {
      return Object.entries(cart).reduce((total, [id, qty]) => {
          const item = menu.find(i => i.id === parseInt(id));
          return total + (item ? item.price * qty : 0);
      }, 0);
  }, [cart, menu]);

  const handleOrderSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      const orderItems = Object.entries(cart).map(([id, qty]) => {
          const item = menu.find(i => i.id === parseInt(id));
          return { item_id: id, name: item.name, price: item.price, quantity: qty };
      });

      try {
          const res = await fetch(`${API_URL}/api/public/order/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  hotel_username: username,
                  items: orderItems,
                  total_amount: cartTotal,
                  ...orderForm
              })
          });

          if (res.ok) {
              setOrderSuccess(true);
              setCart({});
              setIsCartOpen(false);
          } else {
              alert("Failed to place order. Please try again.");
          }
      } catch (err) {
          alert("Network Error");
      } finally {
          setSubmitting(false);
      }
  };

  // --- RENDER HELPERS ---
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12"/>
    </div>
  );

  if (error || !hotelData) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <div className="bg-red-50 p-6 rounded-full mb-4 animate-bounce">
            <AlertCircle size={48} className="text-red-500"/>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Unavailable</h1>
        <p className="text-slate-500">{error || "Hotel not found."}</p>
    </div>
  );

  // --- SUCCESS VIEW (BOOKING) ---
  if (bookingSuccess && confirmedBooking) return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-lg w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6"/>
            <h1 className="text-3xl font-black text-slate-800 mb-2">Booking Confirmed!</h1>
            <p className="text-slate-500 text-sm mb-8">Welcome to {hotelData.hotel.hotel_name}</p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-4 border border-slate-200">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase">Guest ID</span>
                    <span className="font-mono font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">{confirmedBooking.guest_id}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Room Assigned</span>
                    <span className="font-bold text-slate-800">{confirmedBooking.room_number || "Check-in Desk"}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setActiveTab('DINING'); setBookingSuccess(false); }} className="py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Utensils size={18}/> Order Food
                </button>
                <button onClick={() => window.location.reload()} className="py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg">
                    Book Another
                </button>
            </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-blue-100">
      
      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white py-16 px-4 text-center rounded-b-[50px] shadow-2xl relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-3xl mx-auto">
              {hotelData.hotel.logo ? (
                  <img src={hotelData.hotel.logo} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover border-4 border-white/20 shadow-lg bg-white"/>
              ) : (
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md"><Hotel size={40}/></div>
              )}
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">{hotelData.hotel.hotel_name}</h1>
              <p className="flex items-center justify-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-widest">
                  <MapPin size={12}/> {hotelData.hotel.address}
              </p>
          </div>
      </div>

      {/* TABS */}
      <div className="flex justify-center -mt-12 relative z-30 mb-8">
          <div className="bg-white p-1.5 rounded-full shadow-xl flex gap-2 border border-slate-100">
              <button onClick={() => setActiveTab('ROOMS')} className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ROOMS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  Book Room
              </button>
              <button onClick={() => setActiveTab('DINING')} className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'DINING' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  Order Food
              </button>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-20">
          
          {/* === TAB: ROOM BOOKING === */}
          {activeTab === 'ROOMS' && (
            <form onSubmit={handleBookingSubmit} className="bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-8">
                
                {/* 1. DATES & GUESTS */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                        <Calendar size={14}/> Trip Details
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Check In</p>
                            <input required type="date" min={today} className="w-full bg-white p-3 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setForm({...form, check_in: e.target.value})} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Check Out</p>
                            <input required type="date" min={form.check_in || today} className="w-full bg-white p-3 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setForm({...form, check_out: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Adults</p>
                            <input required type="number" min="1" defaultValue="1" className="w-full bg-white p-3 rounded-xl font-bold text-slate-700 outline-none" onChange={e => setForm({...form, adults: parseInt(e.target.value)})} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-400 mb-1 ml-1">Children</p>
                            <input type="number" min="0" defaultValue="0" className="w-full bg-white p-3 rounded-xl font-bold text-slate-700 outline-none" onChange={e => setForm({...form, children: parseInt(e.target.value)})} />
                        </div>
                    </div>
                </div>

                {/* 2. ROOM SELECTION */}
                <div className="mb-12">
                    <h3 className="text-lg font-black text-slate-800 mb-4 ml-1">Select Room</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...new Set(hotelData.rooms.map(r => r.room_type))].map(type => {
                            const room = hotelData.rooms.find(r => r.room_type === type);
                            const isSelected = form.room_type === type;
                            return (
                                <label key={type} className={`block p-4 rounded-3xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 hover:border-blue-200'}`}>
                                    <input type="radio" name="room" value={type} className="hidden" checked={isSelected} onChange={() => setForm({...form, room_type: type})} />
                                    
                                    {/* Gallery Preview */}
                                    <div className="h-40 bg-slate-200 rounded-2xl mb-4 overflow-hidden relative group">
                                        {room.images && room.images.length > 0 ? (
                                            <img src={room.images[0].image} alt="Room" className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon/></div>
                                        )}
                                        {room.images && room.images.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">+{room.images.length - 1} Photos</div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-slate-800 uppercase">{type.replace(/_/g, ' ')}</span>
                                        <span className="text-blue-600 font-bold">₹{room.price_per_night}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{room.description || "Includes free Wi-Fi & Breakfast"}</p>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* 3. GUEST INFO & ID */}
                <div className="space-y-6 mb-8">
                    <h3 className="text-lg font-black text-slate-800 ml-1">Guest Details</h3>
                    <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500" onChange={e => setForm({...form, guest_name: e.target.value})} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required type="tel" placeholder="Phone Number" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500" onChange={e => setForm({...form, guest_phone: e.target.value})} />
                        <input required type="email" placeholder="Email Address" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500" onChange={e => setForm({...form, guest_email: e.target.value})} />
                    </div>
                    
                    {/* ID Upload */}
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                        <input type="file" required accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Upload size={20}/></div>
                            <span className="font-bold text-slate-600 text-sm">{form.id_proof_image ? form.id_proof_image.name : "Upload Government ID (Required)"}</span>
                            <span className="text-xs text-slate-400">Aadhar, Passport, or Driving License</span>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={submitting || !form.room_type} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin"/> : "Confirm Booking"}
                </button>
            </form>
          )}

          {/* === TAB: DINING / POS === */}
          {activeTab === 'DINING' && (
              <div className="animate-in slide-in-from-bottom-8">
                  {/* Order Success Message */}
                  {orderSuccess && (
                      <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-2xl mb-6 flex items-center gap-2">
                          <CheckCircle size={20}/> Order Placed! Kitchen is preparing your food.
                      </div>
                  )}

                  {/* Menu Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
                      {menu.length === 0 ? (
                          <div className="col-span-full text-center py-20 text-slate-400 font-bold">Menu currently unavailable.</div>
                      ) : (
                          menu.map(item => (
                              <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                                  <div>
                                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{item.category}</p>
                                      <p className="text-orange-500 font-black mt-1">₹{item.price}</p>
                                  </div>
                                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl">
                                      <button onClick={() => updateCart(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-400 hover:text-red-500"><Minus size={16}/></button>
                                      <span className="font-bold text-slate-800 w-4 text-center">{cart[item.id] || 0}</span>
                                      <button onClick={() => updateCart(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg shadow-sm hover:bg-orange-500"><Plus size={16}/></button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  {/* Floating Cart Bar */}
                  {Object.keys(cart).length > 0 && (
                      <div className="fixed bottom-6 left-4 right-4 max-w-5xl mx-auto z-50">
                          <button 
                            onClick={() => setIsCartOpen(true)}
                            className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center hover:scale-[1.02] transition-transform"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="bg-orange-500 w-10 h-10 rounded-xl flex items-center justify-center font-bold">{Object.values(cart).reduce((a,b)=>a+b, 0)}</div>
                                  <div className="text-left">
                                      <p className="text-xs text-slate-400 font-bold uppercase">Total</p>
                                      <p className="font-bold text-lg">₹{cartTotal}</p>
                                  </div>
                              </div>
                              <span className="font-bold uppercase text-xs tracking-widest flex items-center gap-2">View Cart <ArrowRight size={16}/></span>
                          </button>
                      </div>
                  )}

                  {/* Checkout Modal */}
                  {isCartOpen && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
                          <div className="bg-white w-full max-w-md rounded-[30px] p-6 shadow-2xl animate-in slide-in-from-bottom-20">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart className="text-orange-500"/> Your Order</h3>
                                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
                              </div>
                              
                              <div className="max-h-60 overflow-y-auto mb-6 space-y-3">
                                  {Object.entries(cart).map(([id, qty]) => {
                                      const item = menu.find(i => i.id === parseInt(id));
                                      return (
                                          <div key={id} className="flex justify-between items-center text-sm font-bold text-slate-700">
                                              <span>{qty}x {item?.name}</span>
                                              <span>₹{item?.price * qty}</span>
                                          </div>
                                      );
                                  })}
                                  <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-lg text-slate-900">
                                      <span>Total</span>
                                      <span>₹{cartTotal}</span>
                                  </div>
                              </div>

                              <form onSubmit={handleOrderSubmit} className="space-y-4">
                                  <input required placeholder="Your Name" className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 outline-none" value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value})} />
                                  <input required placeholder="Room Number / Guest ID" className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 outline-none" value={orderForm.room_number} onChange={e => setOrderForm({...orderForm, room_number: e.target.value})} />
                                  <textarea placeholder="Special Instructions (Optional)" className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 outline-none h-20 resize-none" value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})} />
                                  
                                  <button disabled={submitting} type="submit" className="w-full py-4 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                                      {submitting ? <Loader2 className="animate-spin mx-auto"/> : "Confirm Order"}
                                  </button>
                              </form>
                          </div>
                      </div>
                  )}
              </div>
          )}

      </div>
    </div>
  );
};

export default BookingSite;