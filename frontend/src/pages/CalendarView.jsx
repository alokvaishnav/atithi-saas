import { useEffect, useState } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, 
  Loader2, User 
} from 'lucide-react';
import { API_URL } from '../config';

const CalendarView = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const token = localStorage.getItem('access_token');

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resB, resR] = await Promise.all([
        fetch(`${API_URL}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/rooms/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resB.ok) setBookings(await resB.json());
      if (resR.ok) setRooms(await resR.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- TIMELINE LOGIC ---
  const getDaysArray = () => {
    const days = [];
    // Show 14 days starting from selected date
    for (let i = 0; i < 14; i++) {
        const d = new Date(currentDate);
        d.setDate(currentDate.getDate() + i);
        days.push(d);
    }
    return days;
  };
  
  const days = getDaysArray();

  const getBookingForRoomAndDate = (roomId, dateStr) => {
    return bookings.find(b => 
        b.room === roomId && 
        b.check_in_date <= dateStr && 
        b.check_out_date > dateStr &&
        b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT'
    );
  };

  const shiftDate = (days) => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + days);
      setCurrentDate(newDate);
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Occupancy Timeline</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">14-Day Visualizer</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={() => shiftDate(-7)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></button>
            <div className="px-4 font-black text-slate-700 uppercase tracking-widest text-xs">
                {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <button onClick={() => shiftDate(7)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* TIMELINE GRID */}
      <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr>
                    <th className="p-4 w-32 bg-slate-50 border-b border-r border-slate-200 sticky left-0 z-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Room No
                    </th>
                    {days.map((d, i) => (
                        <th key={i} className={`p-4 min-w-[100px] border-b border-slate-100 text-center ${d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? 'bg-blue-50' : ''}`}>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="text-lg font-black text-slate-800">{d.getDate()}</div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rooms.map(room => (
                    <tr key={room.id} className="hover:bg-slate-50/50">
                        <td className="p-4 bg-white border-r border-slate-100 sticky left-0 z-10 font-black text-slate-700 text-sm">
                            RM {room.room_number} <span className="text-[9px] text-slate-400 block font-normal">{room.room_type}</span>
                        </td>
                        {days.map((d, i) => {
                            const dateStr = d.toISOString().split('T')[0];
                            const booking = getBookingForRoomAndDate(room.id, dateStr);
                            
                            // Check if this is the FIRST day of the booking to render the "Bar"
                            const isStart = booking && booking.check_in_date === dateStr;
                            
                            return (
                                <td key={i} className={`p-2 border border-slate-50 relative h-20 align-middle ${d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? 'bg-blue-50/30' : ''}`}>
                                    {booking ? (
                                        <div 
                                            className={`absolute inset-y-2 left-0 right-0 mx-1 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-md
                                                ${booking.status === 'CHECKED_IN' ? 'bg-blue-600' : 'bg-green-500'}
                                            `}
                                            title={booking.guest_details?.full_name}
                                        >
                                            {isStart ? (
                                                <div className="flex items-center gap-1 px-2 truncate">
                                                    <User size={10}/> {booking.guest_details?.full_name?.split(' ')[0]}
                                                </div>
                                            ) : ''}
                                        </div>
                                    ) : (
                                        // Empty slot
                                        <div className="w-full h-full"></div>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

    </div>
  );
};

export default CalendarView;