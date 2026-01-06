import { useEffect, useState } from 'react';
import { 
  Plus, Search, Calendar, User, CheckCircle, 
  XCircle, Clock, Filter, Loader2, MoreVertical, 
  CreditCard, ArrowRight, X, Trash2, ShieldAlert,
  LogOut, Eye, BedDouble, RefreshCcw, AlertCircle
} from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

const Bookings = () => {
  const { token, role, user } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); 
  const [error, setError] = useState(null); // New: Error state
  
  // Filters
  const [filter, setFilter] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  
  // 🛡️ SECURITY: Only Owners and Managers can Delete bookings
  const isAdmin = ['OWNER', 'MANAGER'].includes(role) || user?.is_superuser;

  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    room_id: '',
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [resBookings, resRooms] = await Promise.all([
        fetch(`${API_URL}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/rooms/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Check for session expiry
      if (resBookings.status === 401 || resRooms.status === 401) {
          navigate('/login');
          return;
      }

      if (resBookings.ok) {
          const data = await resBookings.json();
          // Smart Sort: Priority to Check-ins happening TODAY, then by creation date
          const today = new Date().toISOString().split('T')[0];
          const sortedData = data.sort((a, b) => {
              if (a.check_in_date === today && b.check_in_date !== today) return -1;
              if (b.check_in_date === today && a.check_in_date !== today) return 1;
              return new Date(b.created_at) - new Date(a.created_at);
          });
          setBookings(sortedData);
      } else {
          throw new Error("Failed to load bookings");
      }

      if (resRooms.ok) setRooms(await resRooms.json());

    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Network connection failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  // --- ACTIONS (AUTOMATION TRIGGERS) ---

  const handleCheckIn = async (id) => {
    if(!window.confirm("Confirm Guest Check-In? This will trigger the Welcome Message.")) return;
    try {
        const res = await fetch(`${API_URL}/api/bookings/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'CHECKED_IN' })
        });
        if(res.ok) {
            alert("Guest Checked In! ✅\nWhatsApp notification sent.");
            fetchData();
        }
    } catch(err) { console.error(err); }
  };

  const handleCheckOut = async (id) => {
    if(!window.confirm("Confirm Check-Out? This will mark the room as DIRTY.")) return;
    try {
        const res = await fetch(`${API_URL}/api/bookings/${id}/checkout/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) fetchData();
    } catch(err) { console.error(err); }
  };

  const handleCancel = async (id) => {
    if(!window.confirm("Are you sure you want to CANCEL this booking?")) return;
    try {
        const res = await fetch(`${API_URL}/api/bookings/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'CANCELLED' })
        });
        if(res.ok) fetchData();
    } catch(err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking history? This cannot be undone.")) return;
    try {
        const res = await fetch(`${API_URL}/api/bookings/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setBookings(bookings.filter(b => b.id !== id));
        } else {
            alert("Failed to delete booking.");
        }
    } catch (err) { console.error(err); }
  };

  // --- CREATE BOOKING ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic Validation
    if (new Date(formData.check_out) <= new Date(formData.check_in)) {
        alert("Check-out date must be after Check-in date.");
        return;
    }
    
    setSubmitting(true);

    // Payload Construction
    // IMPORTANT: Send null if room_id is empty string to allow "Assign Later"
    const payload = {
        ...formData,
        room_id: formData.room_id ? parseInt(formData.room_id) : null,
        adults: parseInt(formData.adults),
        children: parseInt(formData.children),
        // Ensure keys match backend expectations exactly
        check_in_date: formData.check_in, 
        check_out_date: formData.check_out 
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
            setShowModal(false);
            // Reset Form
            setFormData({ guest_name: '', guest_phone: '', room_id: '', check_in: '', check_out: '', adults: 1, children: 0 });
            fetchData();
        } else {
            const err = await res.json();
            // Show detailed backend error if available
            alert("Error: " + (err.detail || JSON.stringify(err)));
        }
    } catch (err) { 
        console.error(err);
        alert("Network Error: Could not connect to server.");
    } finally {
        setSubmitting(false);
    }
  };

  // --- FILTERING ---
  const filteredBookings = bookings.filter(b => {
    const guestName = b.guest_details?.full_name || ""; 
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
          case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200 line-through';
          default: return 'text-slate-600 bg-white border-slate-200';
      }
  };

  if (loading && bookings.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Loading Reservations...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Reservations</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Bookings: {bookings.length}</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* Refresh Button */}
          <button 
            onClick={fetchData} 
            className="bg-white p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            title="Refresh List"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""}/>
          </button>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Guest or ID..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm transition-all shadow-sm focus:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-300"
          >
            <Plus size={18} /> New Booking
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20}/> {error}
            <button onClick={fetchData} className="underline ml-auto hover:text-red-800">Retry</button>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {['ALL', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
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
            <div key={booking.id} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:shadow-xl transition-all group flex flex-col md:flex-row justify-between items-center gap-6 relative">
                
                {/* Left: Info */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                        {booking.room_details?.room_number || "NA"}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800">{booking.guest_details?.full_name || "Unknown Guest"}</h3>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                            <Calendar size={12}/> {new Date(booking.check_in_date).toLocaleDateString('en-GB')} <ArrowRight size={10}/> {new Date(booking.check_out_date).toLocaleDateString('en-GB')}
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
                            {booking.payment_status || 'PENDING'}
                        </p>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                    
                    {/* View Folio (Always visible) */}
                    <button onClick={() => navigate(`/folio/${booking.id}`)} title="View Folio" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                        <Eye size={18}/>
                    </button>

                    {/* Automation Buttons */}
                    {booking.status === 'CONFIRMED' && (
                        <>
                            <button onClick={() => handleCheckIn(booking.id)} title="Check In (Triggers WhatsApp)" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm">
                                <CheckCircle size={18}/>
                            </button>
                            <button onClick={() => handleCancel(booking.id)} title="Cancel Booking" className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors shadow-sm">
                                <XCircle size={18}/>
                            </button>
                        </>
                    )}
                    
                    {booking.status === 'CHECKED_IN' && (
                        <button onClick={() => handleCheckOut(booking.id)} title="Check Out" className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors shadow-sm">
                            <LogOut size={18}/>
                        </button>
                    )}

                    {/* Admin Delete (Only for Cancelled/Checked Out) */}
                    {isAdmin && ['CANCELLED', 'CHECKED_OUT'].includes(booking.status) && (
                        <button onClick={() => handleDelete(booking.id)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete History">
                            <Trash2 size={18}/>
                        </button>
                    )}
                </div>
            </div>
        ))}

        {filteredBookings.length === 0 && !loading && !error && (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">No bookings found</p>
                <p className="text-xs text-slate-300 mt-2">Adjust your filters or add a new reservation.</p>
            </div>
        )}
      </div>

      {/* ADD BOOKING MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-[30px] shadow-2xl w-full max-w-lg animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">New Reservation</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guest Name</label>
                            <input required type="text" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                value={formData.guest_name} onChange={e => setFormData({...formData, guest_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                            <input required type="tel" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                value={formData.guest_phone} onChange={e => setFormData({...formData, guest_phone: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Room (Optional)</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all text-sm"
                            value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})}>
                            <option value="">-- Assign Later --</option>
                            {rooms.filter(r => r.status === 'AVAILABLE').map(r => (
                                <option key={r.id} value={r.id}>RM {r.room_number} ({r.room_type}) - ₹{r.price_per_night}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Check In</label>
                            <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-600" 
                                value={formData.check_in} onChange={e => setFormData({...formData, check_in: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Check Out</label>
                            <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none text-slate-600" 
                                value={formData.check_out} onChange={e => setFormData({...formData, check_out: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adults</label>
                            <input required type="number" min="1" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                value={formData.adults} onChange={e => setFormData({...formData, adults: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Children</label>
                            <input required type="number" min="0" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
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