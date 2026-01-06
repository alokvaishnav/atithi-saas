import { useEffect, useState } from 'react';
import { 
  User, Mail, Phone, Star, Search, 
  MapPin, Loader2, MoreHorizontal, Plus,
  Download, Ban, Briefcase, CreditCard, X, Save,
  ShieldCheck, Trash2, Edit, RefreshCcw, AlertCircle
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Guests = () => {
  const { token, role, user } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error State
  const [submitting, setSubmitting] = useState(false); // New: Form Loading State
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🛡️ SECURITY: Only Owners and Managers can Delete or Blacklist
  const isAdmin = ['OWNER', 'MANAGER'].includes(role) || user?.is_superuser;

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null); 
  
  const [newGuestData, setNewGuestData] = useState({
      full_name: '', email: '', phone: '', 
      id_proof_number: '', address: '', type: 'REGULAR'
  });

  // --- FETCH GUESTS ---
  const fetchGuests = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/guests/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
          navigate('/login');
          return;
      }

      if (res.ok) {
          setGuests(await res.json());
      } else {
          setError("Failed to load guest directory.");
      }
    } catch (err) { 
        console.error(err); 
        setError("Network error. Please check your connection.");
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchGuests(); }, [token]);

  // --- ACTIONS ---
  const toggleVIP = async (id, currentStatus) => {
    // Optimistic Update
    setGuests(prev => prev.map(g => g.id === id ? { ...g, is_vip: !currentStatus } : g));
    if(selectedGuest && selectedGuest.id === id) {
        setSelectedGuest(prev => ({ ...prev, is_vip: !currentStatus }));
    }

    try {
        await fetch(`${API_URL}/api/guests/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ is_vip: !currentStatus })
        });
    } catch(err) { 
        fetchGuests(); // Revert on error
    }
  };

  // 🛡️ Admin Only Action
  const toggleBlacklist = async (id, currentStatus) => {
    if (!isAdmin) return alert("Only Managers can blacklist guests.");
    
    // Optimistic Update
    setGuests(prev => prev.map(g => g.id === id ? { ...g, is_blacklisted: !currentStatus } : g));
    if(selectedGuest && selectedGuest.id === id) {
        setSelectedGuest(prev => ({ ...prev, is_blacklisted: !currentStatus }));
    }

    try {
        await fetch(`${API_URL}/api/guests/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ is_blacklisted: !currentStatus })
        });
    } catch(err) { fetchGuests(); }
  };

  // 🛡️ Admin Only Action
  const handleDelete = async (id, e) => {
      e.stopPropagation(); // Prevent opening the details modal
      if (!isAdmin) return;
      if (!window.confirm("Permanently delete this guest profile? History will be lost.")) return;

      const originalGuests = [...guests];
      setGuests(guests.filter(g => g.id !== id));
      if(selectedGuest?.id === id) setSelectedGuest(null);

      try {
          const res = await fetch(`${API_URL}/api/guests/${id}/`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed");
      } catch (err) {
          setGuests(originalGuests);
          alert("Could not delete guest. They may have active bookings.");
      }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const res = await fetch(`${API_URL}/api/guests/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newGuestData)
        });
        if(res.ok) {
            alert("Guest Profile Created Successfully! 🎉");
            setShowAddModal(false);
            setNewGuestData({ full_name: '', email: '', phone: '', id_proof_number: '', address: '', type: 'REGULAR' });
            fetchGuests(); 
        } else {
            alert("Failed to create profile. Check if email/phone already exists.");
        }
      } catch(err) { 
          console.error(err);
          alert("Network Error"); 
      } finally {
          setSubmitting(false);
      }
  };

  // --- CALCULATIONS & FILTER ---
  const filteredGuests = guests.filter(g => 
    (g.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.phone || '').includes(searchTerm)
  );

  const vipCount = guests.filter(g => g.is_vip).length;
  const corporateCount = guests.filter(g => g.type === 'CORPORATE').length;
  const totalLTV = guests.reduce((sum, g) => sum + (parseFloat(g.total_spent) || 0), 0);

  // --- LOADING & ERROR STATES ---
  if (loading && guests.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Loading Directory...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Guest Database</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">CRM & Loyalty Management</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
                onClick={fetchGuests}
                className="bg-white border border-slate-200 text-slate-600 p-3 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
                title="Refresh List"
            >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/>
            </button>
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm flex-1 md:flex-none">
                <Download size={16}/> Export CSV
            </button>
            <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg transition-all flex-1 md:flex-none">
                <Plus size={16}/> New Guest
            </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
            <AlertCircle size={16}/> {error}
        </div>
      )}

      {/* STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><User size={20}/></div>
              <div>
                  <p className="text-2xl font-black text-slate-800">{guests.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Profiles</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={20}/></div>
              <div>
                  <p className="text-2xl font-black text-slate-800">{vipCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VIP Guests</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Briefcase size={20}/></div>
              <div>
                  <p className="text-2xl font-black text-slate-800">{corporateCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corporate</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CreditCard size={20}/></div>
              <div>
                  <p className="text-2xl font-black text-slate-800">₹{(totalLTV/100000).toFixed(2)}L</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
              </div>
          </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
              type="text" placeholder="Search by Name, Phone, Email..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-700 placeholder:font-medium transition-all shadow-sm focus:shadow-md" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          />
      </div>

      {/* GUEST TABLE */}
      <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Profile</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">History</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredGuests.map(guest => (
                        <tr key={guest.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedGuest(guest)}>
                            <td className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg uppercase">
                                        {guest.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-sm">{guest.full_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1 truncate max-w-[150px]">
                                            <MapPin size={10}/> {guest.address || "Unknown"}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-600 flex items-center gap-2"><Phone size={12}/> {guest.phone || "N/A"}</p>
                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-2 truncate max-w-[150px]"><Mail size={12}/> {guest.email || "N/A"}</p>
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="flex gap-2 flex-wrap">
                                    {guest.is_vip && <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit"><Star size={10} fill="currentColor"/> VIP</span>}
                                    {guest.type === 'CORPORATE' && <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-widest w-fit">CORP</span>}
                                    {guest.is_blacklisted && <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit"><Ban size={10}/> BANNED</span>}
                                    {!guest.is_vip && !guest.is_blacklisted && guest.type !== 'CORPORATE' && <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest w-fit">REGULAR</span>}
                                </div>
                            </td>
                            <td className="p-6">
                                <p className="text-sm font-black text-slate-800">₹{(parseFloat(guest.total_spent) || 0).toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{guest.total_stays || 0} Stays</p>
                            </td>
                            <td className="p-6 text-right flex justify-end gap-2">
                                <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                                    <MoreHorizontal size={20}/>
                                </button>
                                {/* 🛡️ DELETE (Admins Only) */}
                                {isAdmin && (
                                    <button 
                                        onClick={(e) => handleDelete(guest.id, e)} 
                                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100 opacity-100"
                                        title="Delete Profile"
                                    >
                                        <Trash2 size={20}/>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {filteredGuests.length === 0 && <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">No guest profiles found matching your search.</div>}
      </div>

      {/* --- ADD GUEST MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white p-8 rounded-[30px] w-full max-w-lg space-y-4 animate-in zoom-in duration-200 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">Create Profile</h3>
                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={newGuestData.full_name} onChange={e => setNewGuestData({...newGuestData, full_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                        <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={newGuestData.phone} onChange={e => setNewGuestData({...newGuestData, phone: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                        value={newGuestData.email} onChange={e => setNewGuestData({...newGuestData, email: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Number</label>
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" 
                            value={newGuestData.id_proof_number} onChange={e => setNewGuestData({...newGuestData, id_proof_number: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                            value={newGuestData.type} onChange={e => setNewGuestData({...newGuestData, type: e.target.value})}>
                            <option value="REGULAR">Regular</option>
                            <option value="VIP">VIP</option>
                            <option value="CORPORATE">Corporate</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
                        {submitting ? "Creating..." : "Save Profile"}
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* --- GUEST DETAIL SLIDEOVER/MODAL --- */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end z-50">
            <div className="bg-white w-full max-w-md h-full p-8 overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl border-l border-slate-200">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-slate-200 uppercase">
                            {selectedGuest.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 leading-none">{selectedGuest.full_name}</h2>
                            <div className="flex gap-2 mt-2">
                                {selectedGuest.id_proof_number && (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                                        <ShieldCheck size={10}/> Verified
                                    </span>
                                )}
                                <button 
                                    onClick={() => navigate(`/guests/edit/${selectedGuest.id}`)}
                                    className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1 hover:bg-blue-100 transition-colors"
                                >
                                    <Edit size={10}/> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedGuest(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-8">
                    <button onClick={() => toggleVIP(selectedGuest.id, selectedGuest.is_vip)} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all ${selectedGuest.is_vip ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-slate-100 text-slate-400 hover:border-yellow-400'}`}>
                        {selectedGuest.is_vip ? 'Remove VIP' : 'Make VIP'}
                    </button>
                    {/* 🛡️ BLACKLIST (Admins Only) */}
                    <button 
                        onClick={() => toggleBlacklist(selectedGuest.id, selectedGuest.is_blacklisted)} 
                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all ${selectedGuest.is_blacklisted ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 text-slate-400 hover:border-red-400 hover:text-red-500'}`}
                        disabled={!isAdmin}
                        title={!isAdmin ? "Manager Access Required" : ""}
                    >
                        {selectedGuest.is_blacklisted ? 'Unban' : 'Blacklist'}
                    </button>
                </div>

                {/* Info Grid */}
                <div className="space-y-8">
                    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contact Information</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm"><Phone size={14}/></div> 
                                {selectedGuest.phone || "N/A"}
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm"><Mail size={14}/></div> 
                                {selectedGuest.email || "N/A"}
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm"><MapPin size={14}/></div> 
                                {selectedGuest.address || "No Address Provided"}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financial Summary</h4>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">Total Visits</span>
                            <span className="text-lg font-black text-slate-800">{selectedGuest.total_stays || 0}</span>
                        </div>
                        <div className="w-full h-px bg-slate-100 mb-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">Lifetime Spend</span>
                            <span className="text-lg font-black text-green-600">₹{(parseFloat(selectedGuest.total_spent) || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes</h4>
                        <div className="w-full p-4 bg-yellow-50 rounded-2xl text-sm font-medium text-yellow-900 border border-yellow-100 min-h-[100px]">
                            {selectedGuest.preferences || "No specific notes recorded for this guest."}
                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
};

export default Guests;