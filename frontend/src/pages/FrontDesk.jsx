import { useEffect, useState } from 'react';
import { 
  CheckCircle, LogIn, LogOut, User, 
  Briefcase, ArrowRight, Bell 
} from 'lucide-react';
import { API_URL } from '../config'; 

const FrontDesk = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ARRIVALS');

  const token = localStorage.getItem('access_token');
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL + '/api/bookings/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBookings(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  // 🔄 ACTIONS
  const updateStatus = async (id, newStatus) => {
    if(!window.confirm(`Are you sure you want to ${newStatus} this guest?`)) return;
    
    try {
      await fetch(API_URL + `/api/bookings/${id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchBookings(); // Refresh list
      alert("Success! Status Updated.");
    } catch (err) { console.error(err); }
  };

  // 📂 FILTER LISTS
  const arrivals = bookings.filter(b => b.check_in_date === todayStr && b.status === 'CONFIRMED');
  const departures = bookings.filter(b => b.check_out_date === todayStr && b.status === 'CHECKED_IN');
  const inHouse = bookings.filter(b => b.status === 'CHECKED_IN');

  const renderTable = (list, type) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="p-4">Guest Name</th>
            <th className="p-4">Room</th>
            <th className="p-4">Stay Dates</th>
            <th className="p-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {list.length > 0 ? list.map(b => (
            <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td className="p-4 font-bold text-slate-700 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  {b.guest_details?.full_name.charAt(0)}
                </div>
                {b.guest_details?.full_name}
              </td>
              <td className="p-4">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono font-bold">
                  {b.room_details?.room_number || "Unassigned"}
                </span>
              </td>
              <td className="p-4 text-slate-500">{b.check_in_date} ➔ {b.check_out_date}</td>
              <td className="p-4 text-right">
                {type === 'ARRIVALS' && (
                  <button 
                    onClick={() => updateStatus(b.id, 'CHECKED_IN')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 ml-auto"
                  >
                    <LogIn size={16}/> Check In
                  </button>
                )}
                {type === 'DEPARTURES' && (
                  <button 
                    onClick={() => updateStatus(b.id, 'CHECKED_OUT')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2 ml-auto"
                  >
                    <LogOut size={16}/> Check Out
                  </button>
                )}
                {type === 'IN_HOUSE' && (
                  <span className="text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1 rounded-full">
                    Currently Staying
                  </span>
                )}
              </td>
            </tr>
          )) : (
            <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">No records found for today.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Front Desk Reception</h1>
          <p className="text-slate-500">Manage today's arrivals and departures</p>
        </div>
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-sm font-bold text-slate-600 flex items-center gap-2">
          <Bell size={16} className="text-orange-500"/> {todayStr}
        </div>
      </div>

      {/* 🔹 TABS */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('ARRIVALS')}
          className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
            activeTab === 'ARRIVALS' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-white bg-white text-slate-400 hover:border-blue-200'
          }`}
        >
          <LogIn size={24}/> 
          <div className="text-left">
            <div className="text-xs font-bold uppercase">Expected Arrival</div>
            <div className="text-2xl font-bold">{arrivals.length}</div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('DEPARTURES')}
          className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
            activeTab === 'DEPARTURES' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-white bg-white text-slate-400 hover:border-red-200'
          }`}
        >
          <LogOut size={24}/> 
          <div className="text-left">
            <div className="text-xs font-bold uppercase">Expected Departure</div>
            <div className="text-2xl font-bold">{departures.length}</div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('IN_HOUSE')}
          className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
            activeTab === 'IN_HOUSE' ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' : 'border-white bg-white text-slate-400 hover:border-purple-200'
          }`}
        >
          <Briefcase size={24}/> 
          <div className="text-left">
            <div className="text-xs font-bold uppercase">In-House Guests</div>
            <div className="text-2xl font-bold">{inHouse.length}</div>
          </div>
        </button>
      </div>

      {/* 📋 LIST CONTENT */}
      {activeTab === 'ARRIVALS' && renderTable(arrivals, 'ARRIVALS')}
      {activeTab === 'DEPARTURES' && renderTable(departures, 'DEPARTURES')}
      {activeTab === 'IN_HOUSE' && renderTable(inHouse, 'IN_HOUSE')}

    </div>
  );
};

export default FrontDesk;