import { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';

// --- STYLES ---
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { 
  Loader2, ChevronLeft, ChevronRight, Calendar as CalIcon, 
  Save, AlertCircle, RefreshCcw 
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Setup the localizer for moment
const localizer = momentLocalizer(moment);

// Wrap Calendar with Drag and Drop capabilities
const DnDCalendar = withDragAndDrop(Calendar);

const CalendarView = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error state

  // --- FETCH DATA ---
  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resBookings, resRooms] = await Promise.all([
          fetch(`${API_URL}/api/bookings/`, { headers }),
          fetch(`${API_URL}/api/rooms/`, { headers })
      ]);

      // Auth Check
      if (resBookings.status === 401 || resRooms.status === 401) {
          navigate('/login');
          return;
      }

      if (resBookings.ok && resRooms.ok) {
        const bookingsDataRaw = await resBookings.json();
        const roomsDataRaw = await resRooms.json();
        
        // 🟢 SAFETY FIX: Handle Pagination vs Array
        const bookingsData = Array.isArray(bookingsDataRaw) ? bookingsDataRaw : (bookingsDataRaw.results || []);
        const roomsData = Array.isArray(roomsDataRaw) ? roomsDataRaw : (roomsDataRaw.results || []);

        // Map Room IDs to Numbers for display
        const roomMap = {};
        roomsData.forEach(r => roomMap[r.id] = r.room_number);

        // Transform bookings to Calendar Events
        const formattedEvents = bookingsData
          .filter(b => b.status !== 'CANCELLED')
          .map(b => {
              // Handle various API response structures for room details
              const roomId = b.room?.id || b.room || b.room_details?.id;
              const roomNum = roomMap[roomId] || b.room_details?.room_number || 'Unassigned';

              return {
                  id: b.id,
                  title: `RM ${roomNum} - ${b.guest_details?.full_name?.split(' ')[0] || 'Guest'}`,
                  start: new Date(b.check_in_date),
                  end: new Date(b.check_out_date),
                  resource: b, // Keep full booking data accessible
                  allDay: true,
                  status: b.status
              };
          });
        setEvents(formattedEvents);
      } else {
          setError("Failed to sync calendar data.");
      }
    } catch (err) { 
        console.error(err); 
        setError("Network connection failed.");
    } finally { 
        setLoading(false); 
    }
  }, [token, navigate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // --- CUSTOM TOOLBAR ---
  const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToCurrent = () => toolbar.onNavigate('TODAY');

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">
          {date.format('MMMM')} <span className="text-blue-600">{date.format('YYYY')}</span>
        </span>
      );
    };

    return (
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-4">
            {label()}
        </div>
        <div className="flex items-center gap-2">
            <button onClick={fetchBookings} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-blue-600" title="Refresh">
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""}/>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={goToBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={goToCurrent} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2">
                <CalIcon size={14}/> Today
            </button>
            <button onClick={goToNext} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><ChevronRight size={20}/></button>
        </div>
      </div>
    );
  };

  // --- DRAG AND DROP HANDLER ---
  const onEventDrop = async ({ event, start, end }) => {
    // 1. Optimistic UI Update
    const originalEvents = [...events];
    const updatedEvents = events.map(existingEvent => {
      return existingEvent.id === event.id
        ? { ...existingEvent, start, end }
        : existingEvent;
    });
    setEvents(updatedEvents);

    // 2. Formatting dates for API (YYYY-MM-DD)
    const formatDate = (d) => moment(d).format('YYYY-MM-DD');

    // 3. Backend Update
    try {
        const res = await fetch(`${API_URL}/api/bookings/${event.id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                check_in_date: formatDate(start),
                check_out_date: formatDate(end)
            })
        });

        if (!res.ok) {
            throw new Error("Update failed");
        }
    } catch (error) {
        console.error("Move failed", error);
        alert("Failed to move booking. Reverting changes.");
        setEvents(originalEvents); // Revert on failure
    }
  };

  // --- EVENT STYLING ---
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6'; // Blue
    let borderLeft = '4px solid #1d4ed8';

    if (event.status === 'CHECKED_IN') {
        backgroundColor = '#10b981'; // Green
        borderLeft = '4px solid #047857';
    } else if (event.status === 'CHECKED_OUT') {
        backgroundColor = '#64748b'; // Slate
        borderLeft = '4px solid #334155';
    } else if (event.status === 'CONFIRMED') {
        backgroundColor = '#f59e0b'; // Orange
        borderLeft = '4px solid #b45309';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        borderLeft: borderLeft,
        fontSize: '10px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        padding: '2px 4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };
  };

  if (loading && events.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Timeline...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans flex flex-col">
      
      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20}/> {error}
            <button onClick={fetchBookings} className="underline ml-auto hover:text-red-800">Retry</button>
        </div>
      )}

      <div className="flex-1 bg-white p-6 rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Helper Note */}
        <div className="mb-2 flex justify-end">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Save size={12}/> Changes save automatically
            </p>
        </div>

        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          
          // Layout & Behavior
          style={{ height: 'calc(100vh - 220px)', fontFamily: 'inherit' }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView='month'
          popup={true}
          selectable={true}
          resizable={true}

          // Custom Components & Styles
          components={{ toolbar: CustomToolbar }}
          eventPropGetter={eventStyleGetter}

          // Interactions
          onSelectEvent={(event) => navigate(`/folio/${event.id}`)}
          onEventDrop={onEventDrop}       // Handles Drag & Drop
          onEventResize={onEventDrop}     // Handles Resizing (extending stay)
        />
      </div>
    </div>
  );
};

export default CalendarView;