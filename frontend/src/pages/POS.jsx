import { useEffect, useState } from 'react';
import { 
  Utensils, 
  Search, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  Home, 
  Printer, 
  ShoppingBag // 👈 THIS MUST BE HERE
} from 'lucide-react';
import { API_URL } from '../config';

const POS = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // Updated for search logic
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('access_token');

  // 1. Fetch In-House Guests and Menu Services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [resS, resB] = await Promise.all([
          fetch(API_URL + '/api/services/', { headers }),
          fetch(API_URL + '/api/bookings/', { headers })
        ]);
        
        const sData = await resS.json();
        const bData = await resB.json();
        
        setServices(Array.isArray(sData) ? sData : []);
        // Only show guests who are currently Checked In
        setBookings(Array.isArray(bData) ? bData.filter(b => b.status === 'CHECKED_IN') : []);
        setLoading(false);
      } catch (err) {
        console.error("POS Fetch Error:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // 🛒 Cart Logic: Add Item
  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  // 🛒 Cart Logic: Remove Item
  const removeFromCart = (id) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // 🚀 Finalize: Post Charges to Room Folio
  const handleChargeToRoom = async () => {
    if (!selectedBooking) return alert("Please select a Room/Guest first!");
    if (cart.length === 0) return alert("Cart is empty!");

    try {
      // Loop through cart and post each item as a charge
      for (const item of cart) {
        await fetch(API_URL + '/api/charges/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            booking: selectedBooking.id,
            service: item.id,
            quantity: item.qty,
            total_cost: item.price * item.qty
          })
        });
      }
      alert(`Success! ₹${total} posted to Room ${selectedBooking.room_details.room_number}`);
      setCart([]);
      setSelectedBooking(null);
    } catch (err) { 
      console.error("Posting Error:", err);
      alert("Failed to post charges. Please try again.");
    }
  };

  // 🔍 Filtered Menu Logic
  const filteredServices = services.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading POS Terminal...</div>;

  return (
    <div className="flex h-[calc(100vh-72px)] bg-slate-100 overflow-hidden">
      
      {/* 🍔 LEFT: MENU SELECTION GRID */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">F&B Outlets</h2>
            <p className="text-xs text-slate-500">Select items to add to the order</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Search menu..." 
              className="w-full pl-10 p-2 rounded-lg border-none shadow-sm focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredServices.map(item => (
            <button 
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition text-left group border-2 border-transparent hover:border-blue-500"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                <Utensils size={20}/>
              </div>
              <div className="font-bold text-slate-800 line-clamp-1">{item.name}</div>
              <div className="text-blue-600 font-bold text-sm">₹{item.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 🧾 RIGHT: BILLING & CHECKOUT PANEL */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <ShoppingBag size={18} className="text-blue-600"/> Current Order
          </h3>
        </div>

        {/* In-House Guest Selector */}
        <div className="p-4 border-b border-slate-50 bg-blue-50/30">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Post to Room Folio</label>
           <select 
              className="w-full p-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
              value={selectedBooking?.id || ''}
              onChange={(e) => setSelectedBooking(bookings.find(b => b.id === parseInt(e.target.value)))}
           >
              <option value="">-- Select In-House Guest --</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>
                  Room {b.room_details?.room_number} - {b.guest_details?.full_name}
                </option>
              ))}
           </select>
        </div>

        {/* Digital Tray / Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
               <ShoppingBag size={48} className="mb-2 opacity-20"/>
               <span className="text-sm">Your tray is empty</span>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex justify-between items-center group animate-fade-in">
              <div>
                <div className="text-sm font-bold text-slate-700">{item.name}</div>
                <div className="text-xs text-slate-400">₹{item.price} x {item.qty}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-bold text-slate-800 text-sm">₹{item.price * item.qty}</div>
                <button 
                  onClick={() => removeFromCart(item.id)} 
                  className="text-red-300 hover:text-red-500 transition-colors"
                >
                  <X size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <div className="flex justify-between mb-4">
              <span className="font-bold text-slate-500 uppercase text-xs">Total Bill</span>
              <span className="font-bold text-slate-900 text-xl">₹{total}</span>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setCart([])} 
                className="p-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-200 transition text-sm"
              >
                Clear Tray
              </button>
              <button 
                onClick={handleChargeToRoom}
                className="p-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-sm transition-transform active:scale-95"
              >
                <Home size={18}/> Post to Room
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default POS;