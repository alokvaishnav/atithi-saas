import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { API_URL } from '../config'; 

const CalendarView = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controls the "View Window" (Start Date)
  const [startDate, setStartDate] = useState(new Date());

  const token = localStorage.getItem('access_token');

  // Helper: Get array of next 14 dates
  const getDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = getDates();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRooms, resBookings] = await Promise.all([
        fetch(API_URL + '/api/rooms/', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(API_URL + '/api/bookings/', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      setRooms(await resRooms.json());
      setBookings(await resBookings.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Navigation (Next/Prev 7 Days)
  const shiftDate = (days) => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + days);
    setStartDate(newDate);
  };

  // Check if a room is booked on a specific date
  const getBookingForCell = (roomId, dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    
    // Find a booking that covers this date
    return bookings.find(b => 
      b.room === roomId && 
      b.status !== 'CANCELLED' && 
      b.status !== 'CHECKED_OUT' &&
      dateStr >= b.check_in_date && 
      dateStr < b.check_out_date
    );
  };

  if (loading) return <div className="p-8 flex items-center text-blue-600"><Loader2 className="animate-spin mr-2"/> Loading Timeline...</div>;

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Reservation Timeline</h2>
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <button onClick={() => shiftDate(-7)} className="p-2 hover:bg-slate-100 rounded"><ChevronLeft size={20}/></button>
          <span className="font-bold text-slate-600 w-32 text-center">
            {startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
          </span>
          <button onClick={() => shiftDate(7)} className="p-2 hover:bg-slate-100 rounded"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* THE TAPE CHART GRID */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto flex-1">
        <div className="min-w-[1000px]">
          
          {/* 1. Header Row (Dates) */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-32 p-4 font-bold text-slate-500 sticky left-0 bg-slate-50 border-r border-slate-200 z-10">
              Room
            </div>
            {dates.map((date, index) => (
              <div key={index} className={`flex-1 min-w-[80px] p-3 text-center border-r border-slate-100 ${
                date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'
              }`}>
                <div className="text-xs uppercase">{date.toLocaleDateString('default', { weekday: 'short' })}</div>
                <div className="text-lg font-bold">{date.getDate()}</div>
              </div>
            ))}
          </div>

          {/* 2. Room Rows */}
          {rooms.map(room => (
            <div key={room.id} className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors h-16">
              
              {/* Room Name Column */}
              <div className="w-32 p-4 font-bold text-slate-700 flex items-center sticky left-0 bg-white border-r border-slate-200 z-10 shadow-sm">
                Room {room.room_number}
              </div>

              {/* Date Cells */}
              {dates.map((date, index) => {
                const booking = getBookingForCell(room.id, date);
                const isStart = booking && booking.check_in_date === date.toISOString().split('T')[0];
                
                return (
                  <div key={index} className="flex-1 min-w-[80px] border-r border-slate-100 p-1 relative">
                    {booking && (
                      <div 
                        className={`h-full rounded-md text-xs flex items-center justify-center px-1 font-semibold text-white overflow-hidden whitespace-nowrap shadow-sm
                        ${booking.status === 'CHECKED_IN' ? 'bg-red-500' : 'bg-blue-500'}
                        ${isStart ? 'ml-1' : '-ml-2 rounded-l-none'} 
                        `}
                        title={`Guest: ${booking.guest_details?.full_name}`}
                      >
                         {/* Only show name on the first block of the booking to avoid repetition */}
                         {isStart && <span className="truncate">{booking.guest_details?.full_name}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
};

export default CalendarView;