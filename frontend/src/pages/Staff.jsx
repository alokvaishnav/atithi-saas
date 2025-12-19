import { useEffect, useState } from 'react';
import { UserPlus, Shield, Mail, Phone, Trash2, UserCheck } from 'lucide-react';
import { API_URL } from '../config';

const Staff = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'RECEPTIONIST', phone: '' });
  const token = localStorage.getItem('access_token');

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/api/users/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowModal(false);
      fetchUsers();
      setFormData({ username: '', email: '', password: '', role: 'RECEPTIONIST', phone: '' });
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Staff Directory</h2>
          <p className="text-slate-500 font-medium">Manage system access and permissions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-transform active:scale-95">
          <UserPlus size={20}/> Add New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-slate-800 capitalize">{user.username}</h3>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                  user.role === 'OWNER' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
            
            <div className="space-y-3 border-t border-slate-50 pt-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Mail size={16} className="text-slate-300"/> {user.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Phone size={16} className="text-slate-300"/> {user.phone || 'No Phone'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8">
              <h3 className="text-xl font-black text-slate-800 mb-6">Create Staff Account</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Username" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl" onChange={e => setFormData({...formData, username: e.target.value})} required />
                <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl" onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl" onChange={e => setFormData({...formData, password: e.target.value})} required />
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600" onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HOUSEKEEPING">Housekeeping</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-4 font-bold text-slate-400">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;