import { useEffect, useState } from 'react';
import { 
  Brush, CheckCircle, Clock, User, Plus 
} from 'lucide-react';
import { API_URL } from '../config';

const Housekeeping = () => {
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ room: '', assigned_to: '', priority: 'NORMAL' });
  const token = localStorage.getItem('access_token');

  const fetchData = async () => {
    const [resT, resR, resS] = await Promise.all([
        fetch(`${API_URL}/api/housekeeping/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/rooms/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/staff/`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    if (resT.ok) setTasks(await resT.json());
    if (resR.ok) setRooms(await resR.json());
    if (resS.ok) setStaff(await resS.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleComplete = async (id) => {
    await fetch(`${API_URL}/api/housekeeping/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'COMPLETED' })
    });
    fetchData();
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/housekeeping/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newTask)
    });
    setShowModal(false);
    fetchData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Housekeeping</h2>
            <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Plus size={16}/> Assign Task
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.filter(t => t.status !== 'COMPLETED').map(task => (
                <div key={task.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between h-48">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                                Room {task.room_number || "Gen"}
                            </span>
                            {task.priority === 'HIGH' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">High Priority</span>}
                        </div>
                        <p className="font-bold text-slate-700 mb-1">Room Cleaning & Sanitization</p>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                            <User size={12}/> {task.assigned_to_name || "Unassigned"}
                        </div>
                    </div>
                    <button onClick={() => handleComplete(task.id)} className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-black uppercase tracking-widest hover:bg-green-100 flex items-center justify-center gap-2">
                        <CheckCircle size={16}/> Mark Done
                    </button>
                </div>
            ))}
             {tasks.length === 0 && <p className="text-slate-400 font-bold uppercase tracking-widest">No pending cleaning tasks.</p>}
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <form onSubmit={handleAssign} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic mb-4">Assign Cleaning</h3>
                    <select required className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={newTask.room} onChange={e => setNewTask({...newTask, room: e.target.value})}>
                        <option value="">Select Room</option>
                        {rooms.filter(r => r.status === 'DIRTY').map(r => <option key={r.id} value={r.id}>Room {r.room_number} (Dirty)</option>)}
                    </select>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold" value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                        <option value="">Select Staff</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-500">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl uppercase tracking-widest">Assign</button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};

export default Housekeeping;