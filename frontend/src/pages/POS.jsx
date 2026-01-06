import { useEffect, useState, useCallback } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, 
  CreditCard, User, BedDouble, CheckCircle, Loader2,
  Coffee, Utensils, Car, Shirt, Sparkles, AlertCircle, RefreshCcw
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';

const POS = () => {
  const { token, user } = useAuth(); 
  const navigate = useNavigate();

  // --- STATE ---
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Checkout State
  const [guests, setGuests] = useState([]); // Active guests only
  const [selectedGuest, setSelectedGuest] = useState(''); // Booking ID
  const [paymentMode, setPaymentMode] = useState('ROOM'); // ROOM, CASH, UPI

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!token) return; 
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [srvRes, bookingRes] = await Promise.all([
          fetch(`${API_URL}/api/services/`, { headers }),
          fetch(`${API_URL}/api/bookings/`, { headers })
      ]);
      
      if (srvRes.status === 401 || bookingRes.status === 401) {
          navigate('/login');
          return;
      }

      if (srvRes.ok) setServices(await srvRes.json());
      else throw new Error("Failed to load services");
      
      if (bookingRes.ok) {
          const allBookings = await bookingRes.json();
          // Filter only for currently CHECKED_IN guests who can charge to room
          const activeGuests = allBookings.filter(b => b.status === 'CHECKED_IN').map(b => ({
              id: b.id,
              guest_name: b.guest_details?.full_name || 'Guest',
              room_number: b.room_details?.room_number || 'N/A'
          }));
          setGuests(activeGuests);
      }
    } catch (err) { 
        console.error(err); 
        setError("Network connection failed.");
    } finally { 
        setLoading(false); 
    }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- CART LOGIC ---
  const addToCart = (item) => {
      const existing = cart.find(i => i.id === item.id);
      if (existing) {
          setCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      } else {
          setCart([...cart, { ...item, qty: 1 }]);
      }
  };

  const removeFromCart = (id) => {
      setCart(cart.filter(i => i.id !== id));
  };

  const updateQty = (id, delta) => {
      setCart(cart.map(i => {
          if (i.id === id) {
              return { ...i, qty: Math.max(1, i.qty + delta) };
          }
          return i;
      }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);

  // --- CHECKOUT ---
  const handleCheckout = async () => {
      if (cart.length === 0) return alert("Cart is empty!");
      if (paymentMode === 'ROOM' && !selectedGuest) return alert("Select a guest to charge.");

      // Prepare payload for backend
      const payload = {
          booking_id: paymentMode === 'ROOM' ? parseInt(selectedGuest) : null,
          items: cart.map(i => ({ service_id: i.id, quantity: i.qty })),
          payment_method: paymentMode,
          total_amount: cartTotal 
      };

      try {
          // Attempt Primary POS Endpoint
          const res = await fetch(`${API_URL}/api/pos/charge/`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              alert("Order Processed Successfully! ✅");
              setCart([]);
              setSelectedGuest('');
          } else {
              // Fallback: If POS endpoint fails (e.g. 404), record as generic Expense/Income
              console.warn("POS endpoint failed, attempting fallback...");
              const fallbackRes = await fetch(`${API_URL}/api/expenses/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                      title: `POS Sale (${paymentMode})`,
                      amount: -cartTotal, // Negative expense = Income
                      category: 'Service Revenue', 
                      date: new Date().toISOString().split('T')[0],
                      notes: `Items: ${cart.map(i => `${i.qty}x ${i.name}`).join(', ')}`
                  })
              });

              if (fallbackRes.ok) {
                  alert("Order Recorded (Fallback Mode) ✅");
                  setCart([]);
              } else {
                  const data = await res.json();
                  alert(data.error || "Transaction Failed.");
              }
          }
      } catch (err) { 
          console.error(err);
          alert("Network Error: Could not connect to server.");
      }
  };

  // Helper for icons
  const getIcon = (cat) => {
    switch(cat) {
        case 'FOOD': return <Utensils size={32}/>;
        case 'BEVERAGE': return <Coffee size={32}/>;
        case 'TRANSPORT': return <Car size={32}/>;
        case 'LAUNDRY': return <Shirt size={32}/>;
        default: return <Sparkles size={32}/>;
    }
  };

  // Filter Logic
  const filteredServices = services.filter(s => 
      (category === 'ALL' || s.category === category) &&
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LOADING & ERROR STATES ---
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Loading Terminal...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans flex flex-col lg:flex-row gap-6 h-screen overflow-hidden">
      
      {/* LEFT: CATALOG */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">POS Terminal</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Service & Restaurant Billing</p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Search Item..." 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold text-sm text-slate-700 transition-all" 
                          value={searchTerm} 
                          onChange={(e) => setSearchTerm(e.target.value)} 
                      />
                  </div>
                  <button onClick={fetchData} className="bg-white p-3 rounded-xl border-2 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                      <RefreshCcw size={20}/>
                  </button>
              </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                <AlertCircle size={18}/> {error}
            </div>
          )}

          {/* Categories */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {['ALL', 'FOOD', 'BEVERAGE', 'LAUNDRY', 'TRANSPORT', 'SERVICE'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => setCategory(c)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        category === c ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                      {c}
                  </button>
              ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20 pr-2 custom-scrollbar content-start">
              {filteredServices.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group active:scale-95"
                  >
                      <div className="h-24 bg-slate-50 rounded-2xl mb-3 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                          {getIcon(item.category)}
                      </div>
                      <h4 className="font-black text-slate-800 text-sm leading-tight mb-1 truncate">{item.name}</h4>
                      <p className="text-lg font-black text-slate-900">₹{parseFloat(item.price).toLocaleString()}</p>
                  </div>
              ))}
              
              {filteredServices.length === 0 && !error && (
                  <div className="col-span-full py-20 text-center text-slate-300">
                      <ShoppingBag size={48} className="mx-auto mb-4 opacity-50"/>
                      <p className="font-bold uppercase tracking-widest text-xs">No items found</p>
                  </div>
              )}
          </div>
      </div>

      {/* RIGHT: CART */}
      <div className="w-full lg:w-96 bg-white rounded-[30px] border border-slate-200 shadow-xl flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 uppercase italic flex items-center gap-2">
                  Current Order <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full not-italic">{cart.reduce((a,b)=>a+b.qty,0)}</span>
              </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                      <ShoppingBag size={48} className="mb-4 opacity-50"/>
                      <p className="text-xs font-black uppercase tracking-widest">Cart Empty</p>
                  </div>
              ) : (
                  cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl animate-in slide-in-from-right-4 duration-300">
                          <div>
                              <p className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{item.name}</p>
                              <p className="text-xs font-black text-slate-500">₹{item.price}</p>
                          </div>
                          <div className="flex items-center gap-3">
                              <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-slate-200 transition-colors"><Minus size={12}/></button>
                              <span className="font-black text-sm w-4 text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-slate-200 transition-colors"><Plus size={12}/></button>
                              <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-1 transition-colors"><Trash2 size={16}/></button>
                          </div>
                      </div>
                  ))
              )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 safe-area-pb">
              <div className="space-y-4 mb-6">
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setPaymentMode('ROOM')} 
                        className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-1 ${
                            paymentMode === 'ROOM' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-white bg-white text-slate-400'
                        }`}
                      >
                          <BedDouble size={16}/> Bill to Room
                      </button>
                      <button 
                        onClick={() => setPaymentMode('CASH')} 
                        className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-1 ${
                            paymentMode === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-white bg-white text-slate-400'
                        }`}
                      >
                          <CreditCard size={16}/> Cash / UPI
                      </button>
                  </div>

                  {paymentMode === 'ROOM' && (
                      <div className="relative">
                          <select 
                            className="w-full p-3 rounded-xl font-bold text-slate-700 text-sm border-2 border-slate-200 outline-none focus:border-blue-500 appearance-none bg-white transition-all"
                            value={selectedGuest} onChange={e => setSelectedGuest(e.target.value)}
                          >
                              <option value="">-- Select Guest --</option>
                              {guests.map(g => (
                                  <option key={g.id} value={g.id}>RM {g.room_number} - {g.guest_name}</option>
                              ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                      </div>
                  )}
              </div>

              <div className="flex justify-between items-end mb-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-3xl font-black text-slate-900">₹{cartTotal.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || (paymentMode === 'ROOM' && !selectedGuest)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                  {paymentMode === 'ROOM' ? <BedDouble size={16}/> : <CheckCircle size={16}/>}
                  {paymentMode === 'ROOM' ? 'Charge to Room' : 'Complete Payment'}
              </button>
          </div>
      </div>

    </div>
  );
};

export default POS;