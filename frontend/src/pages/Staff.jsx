import { useEffect, useState } from 'react';
import { 
  User, Mail, Shield, Plus, Trash2, 
  Loader2, X, KeyRound, CheckCircle 
} from 'lucide-react';
import { API_URL } from '../config';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', 
    first_name: '', last_name: '', role: 'RECEPTIONIST'
  });

  const token = localStorage.getItem('access_token');

  // --- FETCH STAFF ---
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/staff/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStaff(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, []);

  // --- CREATE STAFF ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/staff/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        // Reset form
        setFormData({ 
            username: '', password: '', email: '', 
            first_name: '', last_name: '', role: 'RECEPTIONIST' 
        });
        fetchStaff();
      } else {
        const errorData = await res.json();
        alert(`Error: ${JSON.stringify(errorData)}`);
      }
    } catch (err) { 
        console.error(err); 
        alert("Failed to connect to server.");
    } finally {
        setSubmitting(false);
    }
  };

  // --- DELETE STAFF ---
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this staff account? Access will be revoked immediately.")) return;
    
    // Optimistic Update (Remove from UI immediately)
    setStaff(staff.filter(m => m.id !== id));

    try {
        await fetch(`${API_URL}/api/staff/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) {
        console.error(err);
        fetchStaff(); // Revert on error
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Team Directory</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Active Personnel: {staff.length}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 transition-all shadow-lg">
            <Plus size={16}/> Add Staff
        </button>
      </div>

      {/* STAFF GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-all">
                
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md ${
                        member.role === 'MANAGER' ? 'bg-purple-600' :
                        member.role === 'OWNER' ? 'bg-slate-900' : 'bg-blue-500'
                    }`}>
                        {member.first_name?.[0] || member.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg leading-none mb-1">
                            {member.first_name} {member.last_name}
                        </h3>
                        <span className="inline-block bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                            {member.role}
                        </span>
                    </div>
                </div>
                
                <div className="space-y-3 border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <Mail size={14} className="text-slate-300"/> {member.email || "No Email"}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <User size={14} className="text-slate-300"/> @{member.username}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <Shield size={14} className="text-slate-300"/> {member.is_superuser ? 'Admin Access' : 'Standard Access'}
                    </div>
                </div>

                <button onClick={() => handleDelete(member.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16}/>
                </button>
            </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">New Staff Member</h3>
                    <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                        value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input required type="email" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><KeyRound size={12}/> Password</label>
                    <input required type="password" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 ml-1">Role Permissions</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                        value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HOUSEKEEPING">Housekeeping</option>
                        <option value="ACCOUNTANT">Accountant</option>
                    </select>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                        {submitting ? <Loader2 className="animate-spin" size={20}/> : "Create Account"}
                    </button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default Staff;