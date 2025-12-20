import { useEffect, useState } from 'react';
import { 
  UserPlus, Shield, Mail, Phone, Trash2, 
  UserCheck, X, Loader2, ShieldAlert, ShieldCheck 
} from 'lucide-react';
import { API_URL } from '../config';

const Staff = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'RECEPTIONIST', 
    phone: '' 
  });
  
  const token = localStorage.getItem('access_token');
  const currentUserRole = localStorage.getItem('user_role');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/users/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        setFormData({ username: '', email: '', password: '', role: 'RECEPTIONIST', phone: '' });
        alert("Staff account created successfully! 🔑");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to create account.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to revoke system access for this user? This cannot be undone.")) {
      try {
        const res = await fetch(`${API_URL}/api/users/${id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchUsers();
          alert("Staff member removed from system.");
        } else {
          const errorData = await res.json();
          alert(errorData.error || "Permission denied.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading && users.length === 0) return (
    <div className="p-20 text-center font-black animate-pulse text-blue-600 uppercase tracking-widest text-xs">
      <Loader2 className="animate-spin inline-block mr-2" /> Accessing Staff Database...
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Staff Directory</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Departmental Identity & Access Management
          </p>
        </div>
        {['OWNER', 'MANAGER'].includes(currentUserRole) && (
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            <UserPlus size={18}/> Onboard Personnel
          </button>
        )}
      </div>

      {/* STAFF GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(user => (
          <div key={user.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            {/* Role Watermark */}
            <Shield className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-800 font-black text-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight capitalize">{user.username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge role={user.role} />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 border-t border-slate-50 pt-6">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Mail size={14}/>
                </div>
                {user.email || 'no-email@atithi.com'}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Phone size={14}/>
                </div>
                {user.phone || '+91 ----------'}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">ID: PMS-00{user.id}</span>
              <button 
                onClick={() => handleDelete(user.id)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                title="Revoke Access"
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">New System Identity</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={28}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Login Username</label>
                  <input type="text" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold outline-none transition-all" onChange={e => setFormData({...formData, username: e.target.value})} required />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                  <input type="email" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold outline-none transition-all" onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Access Password</label>
                  <input type="password"  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold outline-none transition-all" onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Assign Departmental Role</label>
                  <select className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-slate-700 outline-none transition-all appearance-none" onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="RECEPTIONIST">Receptionist (Front Office)</option>
                    <option value="MANAGER">Property Manager</option>
                    <option value="HOUSEKEEPING">Housekeeping Lead</option>
                    <option value="ACCOUNTANT">Chartered Accountant</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-xs tracking-widest">Cancel</button>
                  <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">Generate Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ role }) => {
  const colors = {
    'OWNER': 'text-purple-600 bg-purple-50 border-purple-100',
    'MANAGER': 'text-blue-600 bg-blue-50 border-blue-100',
    'RECEPTIONIST': 'text-teal-600 bg-teal-50 border-teal-100',
    'HOUSEKEEPING': 'text-orange-600 bg-orange-50 border-orange-100',
    'ACCOUNTANT': 'text-emerald-600 bg-emerald-50 border-emerald-100'
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${colors[role] || 'text-slate-500 bg-slate-50 border-slate-100'}`}>
      {role}
    </span>
  );
};

export default Staff;