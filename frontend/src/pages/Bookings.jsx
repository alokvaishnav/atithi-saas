import { useEffect, useState } from 'react';
import { 
  Plus, Search, Calendar, User, CheckCircle, 
  XCircle, Clock, Filter, Loader2, MoreVertical, 
  CreditCard, ArrowRight, X 
} from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // New: Handle form submission state
  const [filter, setFilter] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // New Booking Form Data
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    room_id: '',
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0
  });

  const [rooms, setRooms] = useState([]); // For dropdown
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resBookings, resRooms] = await Promise.all([
        fetch(`${API_URL}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/rooms/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resBookings.ok) setBookings(await resBookings.json());
      if (resRooms.ok) setRooms(await resRooms.json());

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- CREATE BOOKING ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic Validation
    if (new Date(formData.check_out) <= new Date(formData.check_in)) {
        alert("Check-out date must be after Check-in date.");
        return;
    }

    setSubmitting(true);

    // Prepare payload with correct data types
    const payload = {
        ...formData,
        room_id: parseInt(formData.room_id),
        adults: parseInt(formData.adults),
        children: parseInt(formData.children)
    };

    try {
        const res = await fetch(`${API_URL}/api/bookings/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            // alert("Booking Created Successfully! 🎉"); // Removed for smoother UX, can be uncommented
            setShowModal(false);
            setFormData({ guest_name: '', guest_phone: '', room_id: '', check_in: '', check_out: '', adults: 1, children: 0 });
            fetchData();
        } else {
            const err = await res.json();
            alert("Error: " + JSON.stringify(err));
        }
    } catch (err) { 
        console.error(err);
        alert("Something went wrong. Please try again.");
    } finally {
        setSubmitting(false);
    }
  };

  // --- FILTERING ---
  const filteredBookings = bookings.filter(b => {
    const guestName = b.guest_details?.full_name || ""; // Safe access
    const matchesSearch = guestName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.id.toString().includes(searchTerm);
    if (filter === 'ALL') return matchesSearch;
    return matchesSearch && b.status === filter;
  });

  const getStatusColor = (status) => {
      switch(status) {
          case 'CONFIRMED': return 'text-blue-600 bg-blue-50 border-blue-200';
          case 'CHECKED_IN': return 'text-green-600 bg-green-50 border-green-200';
          case 'CHECKED_OUT': return 'text-slate-500 bg-slate-100 border-slate-200';
          case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
          default: return 'text-slate-600 bg-white border-slate-200';
      }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Reservations</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Bookings: {bookings.length}</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Guest or ID..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus size={18} /> New Booking
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['ALL', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
              filter === f 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* BOOKING LIST */}
      <div className="space-y-4">
        {filteredBookings.map(booking => (
            <div key={booking.id} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:shadow-xl transition-all group flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Left: Info */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {booking.room_details?.room_number || "NA"}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800">{booking.guest_details?.full_name || "Unknown Guest"}</h3>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                            <Calendar size={12}/> {booking.check_in_date} <ArrowRight size={10}/> {booking.check_out_date}
                        </div>
                    </div>
                </div>

                {/* Middle: Status & Money */}
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
                    <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                    </span>
                    <div className="text-right">
                        <p className="text-lg font-black text-slate-800">₹{parseFloat(booking.total_amount || 0).toLocaleString()}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${booking.payment_status === 'PAID' ? 'text-green-500' : 'text-red-400'}`}>
                            {booking.payment_status}
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <button 
                    onClick={() => navigate(`/folio/${booking.id}`)}
                    className="w-full md:w-auto px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors"
                >
                    Manage Folio
                </button>
            </div>
        ))}

        {filteredBookings.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">No bookings found</p>
            </div>
        )}
      </div>

      {/* ADD BOOKING MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-[30px] shadow-2xl w-full max-w-lg animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">New Reservation</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Name</label>
                            <input required type="text" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                                value={formData.guest_name} onChange={e => setFormData({...formData, guest_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                            <input required type="tel" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                                value={formData.guest_phone} onChange={e => setFormData({...formData, guest_phone: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Room</label>
                        <select required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                            value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})}>
                            <option value="">-- Choose Available Room --</option>
                            {rooms.filter(r => r.status === 'AVAILABLE').map(r => (
                                <option key={r.id} value={r.id}>RM {r.room_number} ({r.room_type}) - ₹{r.price_per_night}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check In</label>
                            <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                                value={formData.check_in} onChange={e => setFormData({...formData, check_in: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check Out</label>
                            <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                                value={formData.check_out} onChange={e => setFormData({...formData, check_out: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adults</label>
                            <input required type="number" min="1" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                                value={formData.adults} onChange={e => setFormData({...formData, adults: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Children</label>
                            <input required type="number" min="0" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                                value={formData.children} onChange={e => setFormData({...formData, children: e.target.value})} />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : "Confirm Booking"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Bookings;