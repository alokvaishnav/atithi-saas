import { useEffect, useState, useCallback } from 'react';
import { 
  User, Mail, Shield, Plus, Trash2, 
  Loader2, X, KeyRound, CheckCircle, Ban,
  Trash, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 

const Staff = () => {
  const { token, role, user: currentUser } = useAuth(); 
  const navigate = useNavigate();

  // --- STATE ---
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 🛡️ SECURITY: Only Admins can access this page
  const canManage = ['OWNER', 'MANAGER'].includes(role) || currentUser?.is_superuser;
  // Only Owners can delete staff (Managers can add but not delete to prevent lockouts)
  const isOwner = role === 'OWNER' || currentUser?.is_superuser;

  const [formData, setFormData] = useState({
    username: '', password: '', email: '', 
    first_name: '', last_name: '', role: 'RECEPTIONIST'
  });

  // --- FETCH STAFF ---
  const fetchStaff = useCallback(async () => {
    if (!token || !canManage) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/staff/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
          navigate('/login');
          return;
      }

      if (res.ok) {
          const data = await res.json();
          setStaff(data);
      } else {
          setError("Failed to load staff list.");
      }
    } catch (err) { 
        console.error(err); 
        setError("Network connection failed.");
    } finally { 
        setLoading(false); 
    }
  }, [token, canManage, navigate]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // --- CREATE STAFF ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Use the specific endpoint for staff registration
      const res = await fetch(`${API_URL}/api/register/staff/`, {
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
        alert("Staff Member Added Successfully! 🚀");
        fetchStaff();
      } else {
        const errorData = await res.json();
        // Format Django errors nicely
        const errorMsg = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${val}`)
            .join('\n');
        alert(`Failed to create staff:\n${errorMsg}`);
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
    if (!isOwner) return alert("Only Owners can delete staff accounts.");
    if (!window.confirm("Are you sure you want to delete this staff account? Access will be revoked immediately.")) return;
    
    // Optimistic Update
    const originalStaff = [...staff];
    setStaff(staff.filter(m => m.id !== id));

    try {
        const res = await fetch(`${API_URL}/api/staff/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
        console.error(err);
        alert("Could not delete user.");
        setStaff(originalStaff); // Revert on error
    }
  };

  // 🚫 BLOCK UNAUTHORIZED ACCESS
  if (!loading && !canManage) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-widest gap-4">
            <Shield size={64} className="text-red-300"/> 
            <span>Access Restricted: Admins Only</span>
        </div>
      );
  }

  if (loading && staff.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Loading Directory...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      
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

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
            <AlertCircle size={20}/> {error}
            <button onClick={fetchStaff} className="underline ml-auto hover:text-red-800">Retry</button>
        </div>
      )}

      {/* STAFF GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-all">
                
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md ${
                        member.role === 'MANAGER' ? 'bg-purple-600' :
                        member.role === 'OWNER' ? 'bg-slate-900' : 'bg-blue-500'
                    }`}>
                        {member.first_name?.[0] || member.username?.[0]?.toUpperCase() || '?'}
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
                        <Shield size={14} className="text-slate-300"/> 
                        {['OWNER', 'MANAGER'].includes(member.role) ? 'Admin Access' : 'Standard Access'}
                    </div>
                </div>

                {/* 🔒 PREVENT DELETING SELF OR OWNER */}
                {member.role !== 'OWNER' && member.id !== currentUser?.id && isOwner && (
                    <button 
                        onClick={() => handleDelete(member.id)} 
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Revoke Access"
                    >
                        <Trash2 size={16}/>
                    </button>
                )}
                
                {member.role === 'OWNER' && (
                    <div className="absolute top-4 right-4 text-amber-400 p-2" title="Owner (Protected)">
                        <KeyRound size={16}/>
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in duration-200 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">New Staff Member</h3>
                    <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                            value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                            value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                        value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input required type="email" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><KeyRound size={12}/> Password</label>
                    <input required type="password" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 ml-1">Role Permissions</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                        value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HOUSEKEEPING">Housekeeping</option>
                        <option value="ACCOUNTANT">Accountant</option>
                    </select>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
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