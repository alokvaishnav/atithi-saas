import { useEffect, useState, useCallback } from 'react';
import { 
  Brush, CheckCircle, Clock, User, Plus, 
  Loader2, Filter, AlertCircle, X, Wrench, Search,
  Trash, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 

const Housekeeping = () => {
  const { token, role, user } = useAuth(); 
  const navigate = useNavigate();

  // --- CORE STATE ---
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED, HIGH
  
  // 🛡️ SECURITY: Only Managers/Owners assign tasks. 
  // Housekeeping staff just view and complete them.
  const canAssign = ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role) || user?.is_superuser;

  // New Task Form
  const [newTask, setNewTask] = useState({ 
    room: '', 
    assigned_to: '', 
    priority: 'NORMAL',
    task_type: 'CLEANING' // CLEANING, REPAIR, INSPECTION
  });

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const requests = [
        fetch(`${API_URL}/api/housekeeping/`, { headers }),
        fetch(`${API_URL}/api/rooms/`, { headers })
      ];

      // Only Managers need the staff list to assign tasks
      if (canAssign) {
          requests.push(fetch(`${API_URL}/api/staff/`, { headers }));
      }

      const responses = await Promise.all(requests);
      
      // Check for Session Expiry
      if (responses.some(r => r.status === 401)) {
          navigate('/login');
          return;
      }

      if (responses[0].ok) setTasks(await responses[0].json());
      if (responses[1].ok) setRooms(await responses[1].json());
      if (canAssign && responses[2] && responses[2].ok) setStaff(await responses[2].json());
      
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Network connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, canAssign, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ACTIONS ---
  const handleComplete = async (id) => {
    if(!window.confirm("Mark this task as completed?")) return;
    
    // Optimistic Update
    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t));

    try {
        const res = await fetch(`${API_URL}/api/housekeeping/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'COMPLETED' })
        });
        if (!res.ok) throw new Error("Update failed");
        fetchData(); // Refresh to sync fully
    } catch(err) { 
        console.error(err);
        setTasks(originalTasks); // Revert on error
        alert("Failed to update status.");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
        const res = await fetch(`${API_URL}/api/housekeeping/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newTask)
        });
        
        if (res.ok) {
            setShowModal(false);
            setNewTask({ room: '', assigned_to: '', priority: 'NORMAL', task_type: 'CLEANING' });
            fetchData();
        } else {
            alert("Failed to assign task. Please check inputs.");
        }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  // Safe checks for arrays
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeStaff = Array.isArray(staff) ? staff : [];

  const pendingTasks = safeTasks.filter(t => t.status !== 'COMPLETED');

  // Filter Logic
  const filteredTasks = pendingTasks.filter(t => {
      if (filter === 'ALL') return true;
      if (filter === 'HIGH') return t.priority === 'HIGH';
      return true; // Expand logic if more filters needed
  });

  // --- LOADING STATE ---
  if (loading && tasks.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Loading Operations...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Housekeeping</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Task Management & Room Status</p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <button 
                    onClick={fetchData} 
                    className="bg-white p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    title="Refresh Tasks"
                >
                    <RefreshCcw size={18} className={loading ? "animate-spin" : ""}/>
                </button>

                <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1 shadow-sm">
                    <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>All Pending</button>
                    <button onClick={() => setFilter('HIGH')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'HIGH' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>High Priority</button>
                </div>
                
                {/* 🛡️ Assign Button: Hidden for basic housekeeping staff */}
                {canAssign && (
                    <button 
                        onClick={() => setShowModal(true)} 
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2 transition-all shadow-lg flex-1 md:flex-none"
                    >
                        <Plus size={16}/> Assign Task
                    </button>
                )}
            </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
            <div className="mb-8 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm animate-in slide-in-from-top-2">
                <AlertCircle size={20}/> {error}
                <button onClick={fetchData} className="underline ml-auto hover:text-red-800">Retry Sync</button>
            </div>
        )}

        {/* TASK GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
                <div key={task.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[180px] group hover:border-blue-200 transition-all relative overflow-hidden">
                    
                    {/* Priority Indicator */}
                    <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 transition-colors ${task.priority === 'HIGH' ? 'bg-red-500' : 'bg-slate-100 group-hover:bg-blue-50'}`}></div>

                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Brush size={12}/> Room {task.room_number || task.room || "N/A"}
                            </span>
                            {task.priority === 'HIGH' && <span className="text-white text-[9px] font-black uppercase tracking-widest relative z-10 pr-1 pt-1 rotate-45 translate-x-3 -translate-y-1">High</span>}
                        </div>
                        
                        <h3 className="font-bold text-slate-800 mb-1 text-lg flex items-center gap-2">
                            {task.task_type === 'REPAIR' && <Wrench size={16} className="text-orange-500"/>}
                            {task.task_type}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description || "Routine cleaning and sanitization."}</p>
                        
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wide">
                            <User size={14}/> {task.assigned_to_name || "Unassigned"}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleComplete(task.id)} 
                        className="w-full mt-4 py-3 bg-green-50 text-green-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={16}/> Mark Done
                    </button>
                </div>
            ))}

            {filteredTasks.length === 0 && !loading && !error && (
                <div className="col-span-full py-20 text-center bg-white rounded-[30px] border-2 border-dashed border-slate-200">
                    <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest">No pending tasks found.</p>
                    <p className="text-xs text-slate-300 mt-2">Rooms are sparkling clean or filtered out.</p>
                </div>
            )}
        </div>

        {/* MODAL: ASSIGN TASK */}
        {showModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in duration-200 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-slate-800 uppercase italic">Assign Cleaning</h3>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room</label>
                            <select 
                                required 
                                className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all text-sm" 
                                value={newTask.room} 
                                onChange={e => setNewTask({...newTask, room: e.target.value})}
                            >
                                <option value="">-- Select Room --</option>
                                {safeRooms.map(r => (
                                    <option key={r.id} value={r.id}>
                                        Room {r.room_number} {r.status === 'DIRTY' ? '(Dirty)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all text-sm" 
                                    value={newTask.task_type} 
                                    onChange={e => setNewTask({...newTask, task_type: e.target.value})}
                                >
                                    <option value="CLEANING">Cleaning</option>
                                    <option value="REPAIR">Repair</option>
                                    <option value="INSPECTION">Inspection</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all text-sm" 
                                    value={newTask.priority} 
                                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign To</label>
                            <select 
                                className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all text-sm" 
                                value={newTask.assigned_to} 
                                onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                            >
                                <option value="">-- Select Staff --</option>
                                {safeStaff.map(s => <option key={s.id} value={s.id}>{s.name || s.username} ({s.role})</option>)}
                            </select>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="w-full py-4 bg-slate-900 text-white font-black rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20}/> : "Assign Task"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Housekeeping;