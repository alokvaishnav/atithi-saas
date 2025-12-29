import { useEffect, useState } from 'react';
import { 
  User, Mail, Phone, Shield, Plus, 
  Trash2, Loader2, CheckCircle 
} from 'lucide-react';
import { API_URL } from '../config';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', 
    first_name: '', last_name: '', role: 'RECEPTIONIST'
  });

  const token = localStorage.getItem('access_token');

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

  const handleCreate = async (e) => {
    e.preventDefault();
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
        alert("Staff Member Added! 👤");
        setShowModal(false);
        fetchStaff();
      } else {
        alert("Error creating staff account.");
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this staff account?")) return;
    await fetch(`${API_URL}/api/staff/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchStaff();
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600"/> Loading Team...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Team Directory</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Active Personnel: {staff.length}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2">
            <Plus size={16}/> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-xl uppercase">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800">{member.first_name} {member.last_name}</h3>
                        <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mt-1">
                            {member.role}
                        </span>
                    </div>
                </div>
                
                <div className="space-y-2 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2"><Mail size={14}/> {member.email}</div>
                    <div className="flex items-center gap-2"><User size={14}/> @{member.username}</div>
                </div>

                <button onClick={() => handleDelete(member.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16}/>
                </button>
            </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in">
                <h3 className="text-xl font-black text-slate-800 uppercase italic mb-4">New Staff Member</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="First Name" className="p-3 bg-slate-50 rounded-xl font-bold outline-none" onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    <input required placeholder="Last Name" className="p-3 bg-slate-50 rounded-xl font-bold outline-none" onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
                <input required placeholder="Username" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" onChange={e => setFormData({...formData, username: e.target.value})} />
                <input required type="email" placeholder="Email" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
                <input required type="password" placeholder="Password" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" onChange={e => setFormData({...formData, password: e.target.value})} />
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Role Permissions</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HOUSEKEEPING">Housekeeping</option>
                        <option value="ACCOUNTANT">Accountant</option>
                    </select>
                </div>

                <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-colors mt-4">
                    Create Account
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600">Cancel</button>
            </form>
        </div>
      )}
    </div>
  );
};

export default Staff;