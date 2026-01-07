import { useEffect, useState, useCallback } from 'react';
import { 
  CheckCircle, LogIn, LogOut, User, 
  Briefcase, AlertTriangle, Clock, ShieldAlert,
  ConciergeBell, FileText, Calculator, ChevronRight, Zap,
  Loader2, BedDouble, Search, RefreshCcw, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; 
import { useAuth } from '../context/AuthContext'; 

const FrontDesk = () => {
  const { token } = useAuth(); 
  const navigate = useNavigate();
  
  // --- CORE STATES ---
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [activeTab, setActiveTab] = useState('MATRIX'); 
  const [searchTerm, setSearchTerm] = useState('');

  // --- MISSION CONTROL STATES ---
  const [gstBase, setGstBase] = useState('');
  
  // Local Date Helper
  const getLocalDate = () => {
      const d = new Date();
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };
  const todayStr = getLocalDate();

  // --- MASTER FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [roomRes, bookingRes] = await Promise.all([
          fetch(`${API_URL}/api/rooms/`, { headers }),
          fetch(`${API_URL}/api/bookings/`, { headers })
      ]);
      
      // Auth Check
      if (roomRes.status === 401 || bookingRes.status === 401) {
          navigate('/login');
          return;
      }

      if (roomRes.ok && bookingRes.ok) {
          const roomsData = await roomRes.json();
          const bookingsData = await bookingRes.json();
          
          // 🟢 CRITICAL FIX: Check if data is Array before sorting to prevent crash
          const safeRooms = Array.isArray(roomsData) ? roomsData : [];
          const safeBookings = Array.isArray(bookingsData) ? bookingsData : [];

          // Sort rooms safely
          setRooms(safeRooms.sort((a,b) => (parseInt(a.room_number) || 0) - (parseInt(b.room_number) || 0)));
          setBookings(safeBookings);
      } else {
          setError("Failed to sync data with server.");
      }
      
    } catch (err) { 
        console.error("Reception Sync Error:", err); 
        setError("Network connection failed.");
        // Prevent crash on render by ensuring arrays exist
        setRooms([]);
        setBookings([]);
    } finally { 
        setLoading(false); 
    }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ACTIONS ---
  const updateBookingStatus = async (id, newStatus) => {
    const actionLabel = newStatus === 'CHECKED_IN' ? 'Check In' : 'Check Out';
    if(!window.confirm(`Confirm ${actionLabel} for this guest?`)) return;
    
    try {
        const res = await fetch(`${API_URL}/api/bookings/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if(res.ok) {
            fetchData();
        } else {
            alert("Action failed. Please try again.");
        }
    } catch (err) { console.error(err); }
  };

  const markRoomClean = async (id) => {
    if(!window.confirm("Mark room as clean and ready?")) return;
    try {
        await fetch(`${API_URL}/api/rooms/${id}/mark-clean/`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'AVAILABLE' })
        });
        fetchData();
    } catch (err) { console.error(err); }
  };

  // --- PDF GENERATOR ---
  const generateNightAudit = () => {
    if (!token) {
        alert("Session invalid. Please login again.");
        return;
    }
    const pdfUrl = `${API_URL}/api/reports/daily-pdf/?token=${token}`;
    window.open(pdfUrl, '_blank');
  };

  // --- DERIVED DATA & LOGIC ---
  const activeBookingsMap = {};
  // Safe filter check
  (Array.isArray(bookings) ? bookings : []).filter(b => b.status === 'CHECKED_IN').forEach(b => {
      const roomId = b.room_details?.id || b.room; 
      if(roomId) activeBookingsMap[roomId] = b;
  });

  // Safe Sort Helper
  const sortList = (list) => {
      if (!Array.isArray(list)) return [];
      return list.sort((a, b) => {
          const rA = a.room_details?.room_number || 0;
          const rB = b.room_details?.room_number || 0;
          return rA - rB;
      });
  };

  // Safe lists
  const safeBookingsList = Array.isArray(bookings) ? bookings : [];
  const arrivals = sortList(safeBookingsList.filter(b => b.check_in_date === todayStr && b.status === 'CONFIRMED'));
  const departures = sortList(safeBookingsList.filter(b => b.check_out_date === todayStr && b.status === 'CHECKED_IN'));
  const inHouse = sortList(safeBookingsList.filter(b => b.status === 'CHECKED_IN'));

  const getFilteredList = (list) => {
      if (!Array.isArray(list)) return [];
      return list.filter(b => 
          b.guest_details?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.room_details?.room_number?.toString().includes(searchTerm) ||
          b.booking_id?.toString().includes(searchTerm)
      );
  };

  // --- LOADING STATE ---
  if (loading && rooms.length === 0) return (
    <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6">
        <Loader2 className="animate-spin text-blue-600" size={60}/> 
        <span className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs animate-pulse">Initializing Mission Control...</span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* 1. MANAGEMENT HEADER & STATS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center gap-4">
            <ConciergeBell className="text-blue-600" size={40}/> Front Desk
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
            <Clock size={12}/> Live Status: {new Date().toLocaleTimeString()} • Operations Core
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto items-center">
             {/* Refresh Button */}
            <button 
                onClick={fetchData} 
                className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                title="Refresh Data"
            >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""}/>
            </button>

            <div className="bg-white p-4 px-6 rounded-2xl border border-slate-200 text-xs font-black text-slate-600 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                <LogIn size={18} className="text-blue-500"/> Arrivals: {arrivals.length}
            </div>
            <div className="bg-white p-4 px-6 rounded-2xl border border-slate-200 text-xs font-black text-slate-600 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                <LogOut size={18} className="text-red-500"/> Departures: {departures.length}
            </div>
            <div className="bg-slate-900 p-4 px-8 rounded-2xl text-xs font-black text-white flex items-center gap-3 shadow-xl">
                <BedDouble size={18} className="text-blue-400"/> {Math.round((inHouse.length / (rooms.length || 1)) * 100) || 0}% Cap.
            </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20}/> {error}
            <button onClick={fetchData} className="underline ml-auto">Retry</button>
        </div>
      )}

      {/* 2. MISSION CONTROL PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Quick GST Calculator (12%) */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-blue-500 transition-all duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest italic flex items-center gap-2">
                    <Calculator size={18} className="text-blue-600"/> Quick Folio Calculator
                </h3>
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">Standard 12% GST</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full">
                    <input 
                      type="number" 
                      placeholder="Enter Base Amount..." 
                      className="w-full p-5 bg-slate-50 rounded-2xl font-black text-slate-900 outline-none border-2 border-transparent focus:border-blue-500 transition-all shadow-inner"
                      value={gstBase}
                      onChange={(e) => setGstBase(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <div className="bg-blue-600 p-5 rounded-2xl text-center flex-1 sm:min-w-[140px] shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
                        <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest mb-1">Final Bill</p>
                        <p className="text-xl font-black text-white tracking-tighter italic">
                             ₹{gstBase ? (Number(gstBase) * 1.12).toFixed(2) : "0.00"}
                        </p>
                    </div>
                </div>
            </div>
          </div>

          {/* Night Audit PDF Actions */}
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
             <div className="relative z-10 text-center sm:text-left">
                <h3 className="font-black text-white uppercase text-xs tracking-widest italic flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <FileText size={18} className="text-blue-400"/> Daily Night Audit
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Generate government compliant <br/> Financial audit reports for today ({todayStr}).
                </p>
             </div>
             <button 
                onClick={generateNightAudit}
                className="relative z-10 bg-blue-600 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl shadow-blue-900/40 group-hover:px-10"
             >
                <Zap size={16}/> Build PDF Report
             </button>
             <FileText className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-5 group-hover:scale-110 transition-transform duration-1000" />
          </div>
      </div>

      {/* 3. TABS & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex gap-2 bg-white p-2 rounded-[25px] border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto">
            {['MATRIX', 'ARRIVALS', 'DEPARTURES', 'IN_HOUSE'].map(t => (
                <button 
                    key={t} 
                    onClick={() => setActiveTab(t)} 
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                        activeTab === t ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:bg-slate-50'
                    }`}
                >
                    {t.replace('_', ' ')}
                </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Guest, Room, ID..." 
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 bg-white outline-none font-bold text-sm shadow-sm transition-all" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
          </div>
      </div>

      {/* 4. VIEW: ROOM MATRIX */}
      {activeTab === 'MATRIX' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {rooms.map(room => {
                const activeBooking = activeBookingsMap[room.id];
                let color = "bg-white border-slate-200 hover:border-blue-400";
                let icon = <CheckCircle size={20} className="text-green-500"/>;
                let statusLabel = "READY";
                let subColor = "text-green-600 bg-green-50";

                if (room.status === 'OCCUPIED') { 
                    color = "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700"; 
                    icon = <User size={20} className="text-white"/>; 
                    statusLabel = "BOOKED";
                    subColor = "text-white bg-white/20";
                } else if (room.status === 'DIRTY') { 
                    color = "bg-orange-50 border-orange-200 hover:border-orange-500 shadow-sm"; 
                    icon = <AlertTriangle size={20} className="text-orange-500"/>; 
                    statusLabel = "DIRTY";
                    subColor = "text-orange-600 bg-orange-100";
                } else if (room.status === 'MAINTENANCE') {
                    color = "bg-rose-50 border-rose-200";
                    icon = <ShieldAlert size={20} className="text-rose-500"/>;
                    statusLabel = "DOWN";
                    subColor = "text-rose-600 bg-rose-100";
                }

                return (
                    <div 
                        key={room.id} 
                        className={`p-6 rounded-[35px] border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between h-48 relative overflow-hidden ${color}`}
                        onClick={() => {
                            if(room.status === 'OCCUPIED' && activeBooking) navigate(`/folio/${activeBooking.id}`);
                            if(room.status === 'DIRTY') markRoomClean(room.id);
                        }}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-3xl font-black tracking-tighter italic">{room.room_number}</span>
                            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">{icon}</div>
                        </div>
                        
                        <div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl block w-fit mb-3 ${subColor}`}>
                                {statusLabel}
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 truncate">{room.room_type}</p>
                            
                            {activeBooking ? (
                                <p className="text-xs font-black truncate border-t border-white/20 pt-3 flex items-center gap-2">
                                    <Zap size={10}/> {activeBooking.guest_details?.full_name || 'Guest'}
                                </p>
                            ) : (
                                <p className="text-[9px] font-black opacity-50 border-t border-current pt-3">CLEAN & VACANT</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* 5. VIEW: LIST TABLES */}
      {activeTab !== 'MATRIX' && (
        <div className="bg-white rounded-[50px] border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-bottom-6 duration-700">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
              <tr>
                  <th className="p-8">Guest Identity</th>
                  <th className="p-8">Unit Allocation</th>
                  <th className="p-8">Operational Dates</th>
                  <th className="p-8 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {getFilteredList(activeTab === 'ARRIVALS' ? arrivals : activeTab === 'DEPARTURES' ? departures : inHouse).map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {b.guest_details?.full_name?.charAt(0) || 'G'}
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-base italic uppercase">{b.guest_details?.full_name || 'Unknown Guest'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: BK-00{b.id}</p>
                        </div>
                      </div>
                  </td>
                  <td className="p-8">
                      <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100">
                          Unit {b.room_details?.room_number || "TBA"}
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-widest uppercase">{b.room_details?.room_type || b.room_type}</p>
                  </td>
                  <td className="p-8">
                      <div className="space-y-2">
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-tighter">
                            <LogIn size={14} className="text-green-500"/> {new Date(b.check_in_date).toLocaleDateString('en-GB')}
                          </span>
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-tighter">
                            <LogOut size={14} className="text-red-500"/> {new Date(b.check_out_date).toLocaleDateString('en-GB')}
                          </span>
                      </div>
                  </td>
                  <td className="p-8 text-right">
                    {activeTab === 'ARRIVALS' && (
                        <button onClick={() => updateBookingStatus(b.id, 'CHECKED_IN')} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2 ml-auto">
                            Check In <ChevronRight size={16}/>
                        </button>
                    )}
                    {activeTab === 'DEPARTURES' && (
                        <button onClick={() => updateBookingStatus(b.id, 'CHECKED_OUT')} className="bg-rose-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-100 transition-all flex items-center gap-2 ml-auto">
                            Check Out <LogOut size={16}/>
                        </button>
                    )}
                    {activeTab === 'IN_HOUSE' && (
                        <button onClick={() => navigate(`/folio/${b.id}`)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-2 ml-auto">
                            Manage Folio <Zap size={16}/>
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {getFilteredList(activeTab === 'ARRIVALS' ? arrivals : activeTab === 'DEPARTURES' ? departures : inHouse).length === 0 && (
              <div className="p-20 text-center">
                  <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Zero results matching your parameters</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FrontDesk;