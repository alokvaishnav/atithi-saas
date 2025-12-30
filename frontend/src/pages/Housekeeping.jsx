import { useEffect, useState } from 'react';
import { 
  Brush, CheckCircle, Clock, User, Plus, 
  Loader2, Filter, AlertCircle, X, Wrench, Search 
} from 'lucide-react';
import { API_URL } from '../config';

const Housekeeping = () => {
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED, HIGH
  
  // New Task Form
  const [newTask, setNewTask] = useState({ 
    room: '', 
    assigned_to: '', 
    priority: 'NORMAL',
    task_type: 'CLEANING' // CLEANING, REPAIR, INSPECTION
  });

  const token = localStorage.getItem('access_token');

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resT, resR, resS] = await Promise.all([
        fetch(`${API_URL}/api/housekeeping/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/rooms/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/staff/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resT.ok) setTasks(await resT.json());
      if (resR.ok) setRooms(await resR.json());
      if (resS.ok) setStaff(await resS.json());
      
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---
  const handleComplete = async (id) => {
    if(!window.confirm("Mark this task as completed?")) return;
    
    // Optimistic Update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t));

    try {
        await fetch(`${API_URL}/api/housekeeping/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'COMPLETED' })
        });
        fetchData(); // Refresh to sync fully
    } catch(err) { console.error(err); }
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
            alert("Failed to assign task");
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

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Housekeeping</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Task Management & Room Status</p>
            </div>
            
            <div className="flex gap-3">
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1">
                    <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>All Pending</button>
                    <button onClick={() => setFilter('HIGH')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'HIGH' ? 'bg-red-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>High Priority</button>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 transition-all shadow-lg"
                >
                    <Plus size={16}/> Assign Task
                </button>
            </div>
        </div>

        {/* TASK GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
                <div key={task.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[180px] group hover:border-blue-200 transition-all relative overflow-hidden">
                    
                    {/* Priority Indicator */}
                    <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 ${task.priority === 'HIGH' ? 'bg-red-500' : 'bg-slate-100'}`}></div>

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
                        <p className="text-xs text-slate-500 mb-4">{task.description || "Routine cleaning and sanitization."}</p>
                        
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

            {filteredTasks.length === 0 && (
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
                                className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
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
                                    className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
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
                                    className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
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
                                className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
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