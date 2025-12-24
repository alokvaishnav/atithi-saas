import { useEffect, useState } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Loader2, 
  Search, Filter, ZoomIn, ZoomOut 
} from 'lucide-react';
import { API_URL } from '../config';

const CalendarView = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date()); // Start date of view
  const [daysToShow, setDaysToShow] = useState(14); // Zoom level
  
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        const [resB, resR] = await Promise.all([
          fetch(`${API_URL}/api/bookings/`, { headers }),
          fetch(`${API_URL}/api/rooms/`, { headers })
        ]);
        
        if (resB.ok) setBookings(await resB.json());
        if (resR.ok) {
            const rData = await resR.json();
            // Sort rooms naturally
            setRooms(rData.sort((a,b) => a.room_number.localeCompare(b.room_number, undefined, {numeric: true})));
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  // --- HELPER FUNCTIONS ---
  
  // Generate dates for the header
  const getDates = () => {
    const dates = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(viewDate);
      d.setDate(viewDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dates = getDates();

  // Shift Timeline
  const shiftDate = (days) => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() + days);
    setViewDate(newDate);
  };

  // Check if a room is booked on a specific date
  const getBookingForRoomDate = (roomId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.find(b => {
      if (b.room !== roomId || b.status === 'CANCELLED') return false;
      const start = b.check_in_date.split('T')[0];
      const end = b.check_out_date.split('T')[0];
      return dateStr >= start && dateStr < end; // < end because checkout day is usually free by noon
    });
  };

  // Logic to determine if this is the FIRST day of a booking (to render the block start)
  const isBookingStart = (booking, date) => {
    if (!booking) return false;
    const dateStr = date.toISOString().split('T')[0];
    const start = booking.check_in_date.split('T')[0];
    return dateStr === start;
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans flex flex-col h-screen">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Reservation Timeline</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Occupancy Gantt Chart</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <button onClick={() => shiftDate(-7)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={20}/></button>
            <div className="flex items-center gap-2 px-4 font-bold text-slate-700 uppercase text-xs tracking-widest">
                <CalendarDays size={16} className="text-blue-500"/>
                {viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
            <button onClick={() => shiftDate(7)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight size={20}/></button>
            
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            
            <button onClick={() => setDaysToShow(Math.max(7, daysToShow - 7))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600" title="Zoom In"><ZoomIn size={20}/></button>
            <button onClick={() => setDaysToShow(Math.min(30, daysToShow + 7))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600" title="Zoom Out"><ZoomOut size={20}/></button>
        </div>
      </div>

      {/* TIMELINE GRID CONTAINER */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        
        {/* 1. Header Row (Dates) */}
        <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-32 p-4 shrink-0 font-black text-slate-400 uppercase text-[10px] tracking-widest border-r border-slate-200 flex items-center justify-center bg-white sticky left-0 z-20">
                Room No.
            </div>
            <div className="flex flex-1 overflow-hidden">
                {dates.map((date, i) => {
                    const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                    return (
                        <div key={i} className={`flex-1 min-w-[60px] p-2 text-center border-r border-slate-100 ${isToday ? 'bg-blue-50' : ''}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={`text-lg font-black leading-none ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                                {date.getDate()}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 2. Room Rows */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {rooms.map(room => (
                <div key={room.id} className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors h-16">
                    {/* Room Label */}
                    <div className="w-32 shrink-0 p-4 border-r border-slate-200 bg-white sticky left-0 z-10 flex flex-col justify-center">
                        <span className="font-black text-slate-800">RM {room.room_number}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{room.room_type}</span>
                    </div>

                    {/* Date Cells */}
                    <div className="flex flex-1 relative">
                        {dates.map((date, i) => {
                            const booking = getBookingForRoomDate(room.id, date);
                            const isStart = isBookingStart(booking, date);
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                            return (
                                <div key={i} className={`flex-1 min-w-[60px] border-r border-slate-100 relative ${isWeekend ? 'bg-slate-50/30' : ''}`}>
                                    {booking && (
                                        <div 
                                            className={`absolute top-2 bottom-2 left-0 right-0 z-0
                                                ${isStart ? 'left-1 rounded-l-xl' : ''} 
                                                ${booking.check_out_date.split('T')[0] === new Date(date.setDate(date.getDate() + 1)).toISOString().split('T')[0] ? 'right-1 rounded-r-xl' : ''}
                                                ${booking.status === 'CHECKED_IN' ? 'bg-blue-500' : 'bg-green-500'}
                                                opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-sm
                                            `}
                                            title={`${booking.guest_details?.full_name} (${booking.status})`}
                                        >
                                            {isStart && (
                                                <div className="px-2 py-3 text-[10px] font-black text-white uppercase tracking-widest truncate">
                                                    {booking.guest_details?.full_name.split(' ')[0]}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

      </div>
      
      {/* Legend Footer */}
      <div className="flex gap-6 mt-4 justify-end">
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> Confirmed
         </div>
         <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Checked In
         </div>
      </div>

    </div>
  );
};

export default CalendarView;