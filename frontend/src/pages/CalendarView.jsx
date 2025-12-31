import { useEffect, useState } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, 
  Loader2, User
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; // 🟢 Import Context

const CalendarView = () => {
  const { token } = useAuth(); // 🟢 Use Global Auth
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!token) return; // Safety check
    try {
      setLoading(true);
      const [resB, resR] = await Promise.all([
        fetch(`${API_URL}/api/bookings/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/rooms/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (resB.ok) {
          const bData = await resB.json();
          setBookings(bData);
      }
      if (resR.ok) {
          const rData = await resR.json();
          // Sort rooms by number (numeric sort)
          const sortedRooms = rData.sort((a, b) => 
            a.room_number.toString().localeCompare(b.room_number.toString(), undefined, { numeric: true })
          );
          setRooms(sortedRooms);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

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

  // Helper to find if a room is booked on a specific date
  const getBookingForRoomAndDate = (roomId, dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    
    return bookings.find(b => {
        // Basic Status Check
        if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false;
        
        // Handle API difference: some APIs return 'room' ID, others nested 'room_details'
        const bookingRoomId = b.room || b.room_details?.id; 
        if (bookingRoomId !== roomId) return false;

        // Date Range Check (Inclusive Start, Exclusive End)
        return dateStr >= b.check_in_date && dateStr < b.check_out_date;
    });
  };

  const shiftDate = (daysToAdd) => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + daysToAdd);
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
            <button onClick={() => shiftDate(-7)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
            <div className="px-4 font-black text-slate-700 uppercase tracking-widest text-xs flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-500"/>
                {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <button onClick={() => shiftDate(7)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Checked In</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Confirmed</span>
          </div>
      </div>

      {/* TIMELINE GRID */}
      <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-x-auto pb-4 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
                <tr>
                    <th className="p-4 w-32 bg-slate-50 border-b border-r border-slate-200 sticky left-0 z-20 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Room No
                    </th>
                    {days.map((d, i) => {
                        const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                        return (
                            <th key={i} className={`p-4 min-w-[80px] border-b border-slate-100 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg font-black ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                                    {d.getDate()}
                                </div>
                            </th>
                        );
                    })}
                </tr>
            </thead>
            <tbody>
                {rooms.map(room => (
                    <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 bg-white border-r border-slate-100 sticky left-0 z-10 font-black text-slate-700 text-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            RM {room.room_number} <span className="text-[9px] text-slate-400 block font-normal mt-0.5">{room.room_type}</span>
                        </td>
                        {days.map((d, i) => {
                            const dateStr = d.toISOString().split('T')[0];
                            const booking = getBookingForRoomAndDate(room.id, d);
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            
                            let cellContent = null;
                            
                            if (booking) {
                                const isStart = booking.check_in_date === dateStr;
                                // Check if the booking ends on the NEXT day (meaning this day is the last full block or partial end)
                                // Standard hotel logic: Check-out date is the day they leave, so the bar stops BEFORE that day's column usually,
                                // or fills it partially. Here we treat check-out date as exclusive for the bar rendering loop above.
                                // However, to visualize the "End", we can check if tomorrow is the check-out date.
                                const tomorrow = new Date(d);
                                tomorrow.setDate(d.getDate() + 1);
                                const isEnd = booking.check_out_date === tomorrow.toISOString().split('T')[0];
                                
                                const barColor = booking.status === 'CHECKED_IN' ? 'bg-blue-600' : 'bg-green-500';
                                
                                const roundedClass = `${isStart ? 'rounded-l-lg ml-1' : '-ml-1'} ${isEnd ? 'rounded-r-lg mr-1' : '-mr-1'}`;
                                
                                cellContent = (
                                    <div 
                                        className={`absolute inset-y-3 left-0 right-0 ${barColor} ${roundedClass} flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-0 hover:brightness-110 transition-all cursor-pointer`}
                                        title={`${booking.guest_details?.full_name || 'Guest'} (${booking.status})`}
                                    >
                                        {isStart && (
                                            <div className="flex items-center gap-1 px-2 truncate w-full">
                                                <User size={12} className="opacity-70"/> 
                                                <span className="truncate">{booking.guest_details?.full_name?.split(' ')[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <td key={i} className={`p-0 border border-slate-50 relative h-16 align-middle ${isToday ? 'bg-blue-50/20' : ''}`}>
                                    {cellContent}
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