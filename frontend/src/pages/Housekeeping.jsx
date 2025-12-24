import { useEffect, useState } from 'react';
import { 
  Sparkles, Trash2, ShieldAlert, CheckCircle, 
  RefreshCcw, Hammer, Eraser, Filter, 
  Plus, User, Clock, Check, X, Brush 
} from 'lucide-react';
import { API_URL } from '../config';

const Housekeeping = () => {
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, DIRTY, MAINTENANCE
  const [viewMode, setViewMode] = useState('ROOMS'); // ROOMS or TASKS
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const token = localStorage.getItem('access_token');

  // Form State for Assigning Tasks
  const [taskForm, setTaskForm] = useState({
    room: '',
    assigned_to: '',
    notes: ''
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Rooms
      const roomRes = await fetch(`${API_URL}/api/rooms/`, { headers });
      const roomData = await roomRes.json();
      if(Array.isArray(roomData)) setRooms(roomData);

      // 2. Fetch Tasks
      const taskRes = await fetch(`${API_URL}/api/housekeeping/`, { headers });
      const taskData = await taskRes.json();
      if(Array.isArray(taskData)) setTasks(taskData);

      // 3. Fetch Staff (For dropdown)
      const staffRes = await fetch(`${API_URL}/api/staff/`, { headers });
      if (staffRes.ok) {
          const staffData = await staffRes.json();
          if(Array.isArray(staffData)) setStaffList(staffData);
      }

    } catch (err) {
      console.error("Housekeeping fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- ROOM STATUS UPDATES (Original Logic) ---
  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const endpoint = newStatus === 'AVAILABLE' 
        ? `${API_URL}/api/rooms/${roomId}/mark-clean/` 
        : `${API_URL}/api/rooms/${roomId}/`;
      
      const method = newStatus === 'AVAILABLE' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method: method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: newStatus === 'AVAILABLE' ? null : JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
        fetchData(); // Refresh tasks too
      }
    } catch (err) { console.error(err); }
  };

  // --- TASK MANAGEMENT (New Logic) ---
  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/housekeeping/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(taskForm)
      });

      if (res.ok) {
        alert("Task Assigned! 🧹");
        setShowAssignModal(false);
        setTaskForm({ room: '', assigned_to: '', notes: '' });
        fetchData();
      } else {
        alert("Failed to assign task.");
      }
    } catch (err) { console.error(err); }
  };

  const updateTaskStatus = async (id, status) => {
    try {
        await fetch(`${API_URL}/api/housekeeping/${id}/`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status })
        });
        fetchData(); // Refresh list
    } catch (err) { console.error(err); }
  };

  // Filter Logic
  const filteredRooms = rooms.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED');

  if (loading && rooms.length === 0) return (
    <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest">
      Loading Housekeeping...
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Housekeeping</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Property Health & Task Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* VIEW SWITCHER */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <button 
                onClick={() => setViewMode('ROOMS')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'ROOMS' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Room Grid
             </button>
             <button 
                onClick={() => setViewMode('TASKS')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'TASKS' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Staff Tasks
             </button>
          </div>

          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* --- VIEW 1: ROOM STATUS GRID (Maintenance View) --- */}
      {viewMode === 'ROOMS' && (
        <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['ALL', 'DIRTY', 'MAINTENANCE', 'AVAILABLE'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                    filter === f ? 'bg-white border-slate-800 text-slate-800' : 'bg-transparent border-transparent text-slate-400 hover:bg-white'
                    }`}
                >
                    {f}
                </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredRooms.length > 0 ? filteredRooms.map(room => (
                <div key={room.id} className={`group p-8 rounded-[32px] border-2 transition-all duration-300 ${
                    room.status === 'DIRTY' ? 'border-orange-100 bg-white shadow-orange-50' : 
                    room.status === 'MAINTENANCE' ? 'border-red-100 bg-white shadow-red-50' : 
                    'border-white bg-white shadow-sm opacity-90'
                }`}>
                    <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">RM {room.room_number}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{room.room_type}</p>
                    </div>
                    <StatusBadge status={room.status} />
                    </div>
                    
                    <div className="space-y-3 mt-10">
                    {room.status !== 'AVAILABLE' && (
                        <button 
                        onClick={() => updateRoomStatus(room.id, 'AVAILABLE')}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 rounded-2xl text-xs font-black text-white hover:bg-green-600 transition-all shadow-lg shadow-green-100 uppercase tracking-widest"
                        >
                        <Sparkles size={16}/> Ready for Guest
                        </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                        onClick={() => updateRoomStatus(room.id, 'DIRTY')}
                        className={`flex items-center justify-center gap-2 py-3 border-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            room.status === 'DIRTY' ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-orange-200 hover:text-orange-500'
                        }`}
                        >
                        <Eraser size={14}/> Dirty
                        </button>
                        <button 
                        onClick={() => updateRoomStatus(room.id, 'MAINTENANCE')}
                        className={`flex items-center justify-center gap-2 py-3 border-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            room.status === 'MAINTENANCE' ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-500'
                        }`}
                        >
                        <Hammer size={14}/> Repair
                        </button>
                    </div>
                    </div>

                    {room.status === 'OCCUPIED' && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black text-center uppercase tracking-widest">
                            Guest In-House
                        </div>
                    )}
                </div>
                )) : (
                    <div className="col-span-full py-40 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                        <CheckCircle size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-300 font-black uppercase tracking-[0.3em] italic">No Rooms match this filter</p>
                    </div>
                )}
            </div>
        </>
      )}

      {/* --- VIEW 2: TASK ASSIGNMENT (New Enterprise Feature) --- */}
      {viewMode === 'TASKS' && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex justify-between mb-6 items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                    <Clock size={18} className="text-orange-500"/> Pending Tasks ({pendingTasks.length})
                </h3>
                <button 
                    onClick={() => setShowAssignModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                    <Plus size={16}/> Assign New Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingTasks.map(task => (
                    <div key={task.id} className="bg-white p-6 rounded-[24px] shadow-sm border-l-4 border-orange-400 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-2xl font-black text-slate-800">Room {task.room_number}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Assigned to: <span className="text-blue-600">{task.assigned_to_name || "Unassigned"}</span></p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl text-slate-400"><Brush size={20}/></div>
                        </div>
                        
                        {task.notes && (
                            <div className="bg-slate-50 p-3 rounded-xl text-xs font-medium text-slate-500 italic mb-6">
                                "{task.notes}"
                            </div>
                        )}
                        
                        <div className="flex gap-2 mt-auto">
                            <button 
                                onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                            >
                                Start
                            </button>
                            <button 
                                onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                                className="flex-1 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors flex items-center justify-center gap-1 shadow-md shadow-green-100"
                            >
                                <Check size={14}/> Done
                            </button>
                        </div>
                    </div>
                ))}
                
                {pendingTasks.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[30px]">
                        <CheckCircle size={40} className="mx-auto text-green-200 mb-2"/>
                        <p className="text-slate-400 font-bold uppercase tracking-widest">All tasks completed!</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-[30px] shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">Assign Cleaning Task</h3>
                    <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleAssignTask} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Room</label>
                        <select required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                            value={taskForm.room} onChange={e => setTaskForm({...taskForm, room: e.target.value})}>
                            <option value="">-- Choose Room --</option>
                            {rooms.map(r => (
                                <option key={r.id} value={r.id}>Room {r.room_number} ({r.status})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Staff</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                            value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}>
                            <option value="">-- Unassigned --</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.username} ({s.role})</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructions</label>
                        <textarea rows="3" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none resize-none"
                            value={taskForm.notes} onChange={e => setTaskForm({...taskForm, notes: e.target.value})} placeholder="e.g. Change bedsheets, restock minibar..."/>
                    </div>
                    
                    <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 mt-2 transition-all">
                        Create Schedule
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

// Reusable Status Badge Component
const StatusBadge = ({ status }) => {
  const colors = {
    'AVAILABLE': 'text-green-600 bg-green-50 border-green-100',
    'DIRTY': 'text-orange-600 bg-orange-50 border-orange-100',
    'MAINTENANCE': 'text-red-600 bg-red-50 border-red-100',
    'OCCUPIED': 'text-blue-600 bg-blue-50 border-blue-100'
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[status] || 'text-slate-400 bg-slate-50'}`}>
      {status}
    </span>
  );
};

export default Housekeeping;