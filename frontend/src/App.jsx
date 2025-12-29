import { useEffect, useState } from 'react';
import api from './api';
import Login from './Login';
import AddRoomModal from './AddRoomModal'; 
import CheckInModal from './CheckInModal'; 
import { Building2, BedDouble, Wifi, LogOut, Plus } from 'lucide-react'; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  
  // State for Modals
  const [showModal, setShowModal] = useState(false); // Add Room Modal
  const [selectedRoom, setSelectedRoom] = useState(null); // Check-In Modal

  // Check if we are already logged in when the app starts
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
        setIsAuthenticated(true);
        fetchRooms();
    }
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms/');
      setRooms(response.data);
    } catch (err) {
      console.error("API Error:", err);
      if (err.response && err.response.status === 401) {
          handleLogout();
      } else {
          setError("Could not load rooms.");
      }
    }
  };

  const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      fetchRooms(); 
  };

  const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
      setRooms([]);
  };

  // 🏨 NEW: Checkout Logic
  const handleCheckout = async (room) => {
    if (!window.confirm(`Check out guest from Room ${room.room_number}?`)) return;

    try {
      // 1. Mark the room as AVAILABLE again
      await api.patch(`/rooms/${room.id}/`, {
        status: 'AVAILABLE'
      });
      
      // 2. Refresh the list (Room turns Green)
      fetchRooms();
      alert(`Room ${room.room_number} is now clean and available!`);
    } catch (error) {
      console.error(error);
      alert("Checkout failed.");
    }
  };

  // 🔒 If not logged in, show Login Screen
  if (!isAuthenticated) {
      return <Login onLogin={handleLoginSuccess} />;
  }

  // 🔓 If logged in, show Dashboard
  return (
    <div className="min-h-screen p-10 bg-slate-50">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
                <Building2 size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Atithi SaaS <span className="text-blue-600">Cloud</span></h1>
                <p className="text-slate-500 font-medium">Enterprise Hotel Management</p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
            <button 
                onClick={() => setShowModal(true)} 
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
                <Plus size={20} /> Add Room
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-bold">
          🚨 {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                    <BedDouble size={24} />
                </div>
                {/* Dynamic Status Badge */}
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    room.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {room.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Room {room.room_number}</h2>
              <div className="flex gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{room.room_type}</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1"><Wifi size={10}/> WiFi</span>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-end">
                <div>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">₹{room.price}</span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-widest ml-1">/ NIGHT</span>
                </div>
                
                {/* 🟢 SMART ACTION BUTTON 🟢 */}
                {room.status === 'OCCUPIED' ? (
                    <button 
                        onClick={() => handleCheckout(room)}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-200 transition-colors border border-red-200"
                    >
                        Check Out
                    </button>
                ) : (
                    <button 
                        onClick={() => setSelectedRoom(room)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                    >
                        Book Now
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Add Room Modal */}
      {showModal && (
        <AddRoomModal 
            onClose={() => setShowModal(false)} 
            onRoomAdded={fetchRooms} 
        />
      )}

      {/* 2. Check-In Modal */}
      {selectedRoom && (
        <CheckInModal 
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onBookingSuccess={() => {
                setSelectedRoom(null);
                fetchRooms(); 
            }}
        />
      )}
    </div>
  );
}

export default App;