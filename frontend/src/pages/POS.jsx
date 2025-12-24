import { useEffect, useState } from 'react';
import { 
  Utensils, Search, Plus, Minus, X, CreditCard, 
  Home, Printer, ShoppingBag, Loader2, Coffee, 
  Shirt, Car, Sparkles 
} from 'lucide-react';
import { API_URL } from '../config';

const POS = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // 👈 NEW: Transaction Lock
  const [category, setCategory] = useState('ALL');

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

  // 🛒 Cart Logic: Update Qty
  const updateQty = (id, delta) => {
      setCart(cart.map(i => {
          if (i.id === id) {
              const newQty = Math.max(1, i.qty + delta);
              return { ...i, qty: newQty };
          }
          return i;
      }));
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

    if(!window.confirm(`Charge ₹${total} to Room ${selectedBooking.room_details?.room_number}?`)) return;

    setIsProcessing(true); // 🔒 Lock Interface

    try {
      // Loop through cart and post each item as a charge
      for (const item of cart) {
        const res = await fetch(API_URL + '/api/charges/', {
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

        // 🛑 INVENTORY CHECK: Handle Backend Errors (Low Stock)
        if (!res.ok) {
            const errData = await res.json();
            // Backend returns array like ["Not enough stock!"] or object
            const errMsg = Array.isArray(errData) ? errData[0] : (errData.detail || "Transaction Failed");
            throw new Error(`Failed to add ${item.name}: ${errMsg}`);
        }
      }

      alert(`✅ Success! ₹${total} posted to Room ${selectedBooking.room_details?.room_number}`);
      setCart([]);
      setSelectedBooking(null);

    } catch (err) { 
      console.error("Posting Error:", err);
      alert(`⚠️ ${err.message}`); // Show specific inventory error
    } finally {
      setIsProcessing(false); // 🔓 Unlock Interface
    }
  };

  // 🔍 Filtered Menu Logic
  const filteredServices = services.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = category === 'ALL' || item.category === category;
    return matchesSearch && matchesCat;
  });

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="flex h-[calc(100vh-72px)] bg-slate-100 overflow-hidden font-sans">
      
      {/* 🍔 LEFT: MENU SELECTION GRID */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {/* Header & Search */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">F&B Outlets</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Select items to add to order</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
              type="text" 
              placeholder="Search menu..." 
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold text-sm bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0">
            {['ALL', 'FOOD', 'BEVERAGE', 'LAUNDRY', 'SPA', 'TRANSPORT'].map(cat => (
                <button 
                    key={cat} onClick={() => setCategory(cat)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        category === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-white hover:border-slate-200'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-20">
          {filteredServices.map(item => (
            <button 
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group text-left flex flex-col items-start"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                 {item.category === 'FOOD' ? <Utensils size={18}/> : 
                  item.category === 'LAUNDRY' ? <Shirt size={18}/> : 
                  item.category === 'BEVERAGE' ? <Coffee size={18}/> : <ShoppingBag size={18}/>}
              </div>
              <div className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-1">{item.name}</div>
              <div className="font-black text-slate-900 text-lg">₹{item.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 🧾 RIGHT: BILLING & CHECKOUT PANEL */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-black text-slate-700 flex items-center gap-2 text-sm uppercase tracking-widest">
            <ShoppingBag size={18} className="text-blue-600"/> Current Order
          </h3>
        </div>

        {/* In-House Guest Selector */}
        <div className="p-4 border-b border-slate-50 bg-blue-50/30">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Post to Room Folio</label>
           <select 
              className="w-full p-3 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 outline-none focus:border-blue-500 transition-all text-sm"
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
               <ShoppingBag size={48} className="mb-2 opacity-20"/>
               <span className="text-sm font-bold">Your tray is empty</span>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="flex justify-between items-center group animate-fade-in">
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-700">{item.name}</div>
                <div className="text-xs font-bold text-slate-400">₹{item.price} x {item.qty}</div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm"><Minus size={12}/></button>
                  <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm"><Plus size={12}/></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="ml-3 text-slate-300 hover:text-red-500 transition-colors">
                <X size={16}/>
              </button>
            </div>
          ))}
        </div>

        {/* Checkout Footer */}
        <div className="p-6 bg-slate-900 text-white mt-auto">
           <div className="flex justify-between items-end mb-6">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Bill</span>
              <span className="text-3xl font-black tracking-tighter">₹{total.toLocaleString()}</span>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setCart([])} 
                disabled={isProcessing}
                className="p-3 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition text-xs uppercase tracking-widest disabled:opacity-50"
              >
                Clear Tray
              </button>
              <button 
                onClick={handleChargeToRoom}
                disabled={isProcessing}
                className="p-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Home size={16}/>}
                {isProcessing ? "Processing..." : "Post to Room"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default POS;