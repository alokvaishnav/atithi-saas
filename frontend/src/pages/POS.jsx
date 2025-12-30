import { useEffect, useState } from 'react';
import { 
  ShoppingBag, Search, Plus, Trash2, 
  Coffee, Utensils, Send, CheckCircle 
} from 'lucide-react';
import { API_URL } from '../config';

const POS = () => {
  const [services, setServices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [filter, setFilter] = useState('ALL');
  
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const init = async () => {
        try {
            const [resS, resR] = await Promise.all([
                fetch(`${API_URL}/api/services/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/rooms/`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (resS.ok) setServices(await resS.json());
            if (resR.ok) setRooms(await resR.json());
        } catch (error) {
            console.error("Failed to load POS data:", error);
        }
    };
    init();
  }, [token]);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);

  const handleChargeRoom = async () => {
    if (!selectedRoom || cart.length === 0) return alert("Select a Room and Items first!");
    
    // SECURITY FIX: Send Service IDs, not prices.
    // The backend will look up the real price to prevent tampering.
    const payload = {
        room_id: selectedRoom,
        items: cart.map(i => ({ 
            service_id: i.id,
            description: i.name 
        }))
    };

    try {
        const res = await fetch(`${API_URL}/api/pos/charge/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();

        if (res.ok) {
            alert(`Charged ₹${data.total} to Room Successfully! 🍽️`);
            setCart([]);
            setSelectedRoom('');
        } else {
            alert(data.error || "Failed to charge room. Ensure guest is checked in.");
        }
    } catch (err) { 
        console.error(err); 
        alert("Network Error: Could not connect to server.");
    }
  };

  const filteredServices = services.filter(s => filter === 'ALL' || s.category === filter);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans flex gap-8">
      
      {/* LEFT: MENU */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">POS Terminal</h2>
            <div className="flex gap-2">
                {['ALL', 'FOOD', 'BEVERAGE', 'SERVICE'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${filter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}>{f}</button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map(item => (
                <div key={item.id} onClick={() => addToCart(item)} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500 transition-colors">
                            {item.category === 'FOOD' ? <Utensils size={20}/> : <Coffee size={20}/>}
                        </div>
                        <span className="font-black text-slate-800">₹{item.price}</span>
                    </div>
                    <h3 className="font-bold text-slate-700">{item.name}</h3>
                </div>
            ))}
        </div>
      </div>

      {/* RIGHT: BILL */}
      <div className="w-96 bg-white p-6 rounded-[30px] shadow-xl border border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-8">
        <h3 className="text-xl font-black text-slate-800 uppercase italic mb-6 flex items-center gap-2">
            <ShoppingBag size={20}/> Current Order
        </h3>

        <div className="mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Room</label>
            <select 
                className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none"
                value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
            >
                <option value="">-- Choose Occupied Room --</option>
                {rooms.filter(r => r.status === 'OCCUPIED').map(r => (
                    <option key={r.id} value={r.id}>Room {r.room_number}</option>
                ))}
            </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
            {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-800">₹{item.price}</span>
                        <button onClick={() => removeFromCart(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                </div>
            ))}
            {cart.length === 0 && <p className="text-center text-slate-300 text-xs font-bold italic mt-10">Cart is empty</p>}
        </div>

        <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between text-lg font-black text-slate-800 mb-4">
                <span>Total</span>
                <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <button 
                onClick={handleChargeRoom}
                disabled={cart.length === 0 || !selectedRoom}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
                Charge to Room
            </button>
        </div>
      </div>

    </div>
  );
};

export default POS;