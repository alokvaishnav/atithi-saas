import { useEffect, useState } from 'react';
import { 
  User, Search, Plus, Edit2, Trash2, 
  Phone, Mail, MapPin, Globe, CreditCard, 
  Loader2, X, Save, Star, ShieldAlert 
} from 'lucide-react';
import { API_URL } from '../config';

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null); // 👈 Track who we are editing
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('access_token');

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    nationality: 'Indian',
    id_proof_number: '',
    notes: '' // Used for VIP/Blacklist tags
  });

  // --- FETCH GUESTS ---
  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/guests/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setGuests(await res.json());
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuests(); }, []);

  // --- HANDLERS ---
  
  // 1️⃣ Open Create Modal
  const handleCreate = () => {
    setEditingGuest(null);
    setFormData({
      full_name: '', email: '', phone: '', address: '', 
      nationality: 'Indian', id_proof_number: '', notes: ''
    });
    setShowModal(true);
  };

  // 2️⃣ Open Edit Modal
  const handleEdit = (guest) => {
    setEditingGuest(guest);
    setFormData({
      full_name: guest.full_name,
      email: guest.email || '',
      phone: guest.phone || '',
      address: guest.address || '',
      nationality: guest.nationality || 'Indian',
      id_proof_number: guest.id_proof_number || '',
      notes: guest.notes || ''
    });
    setShowModal(true);
  };

  // 3️⃣ Submit Data (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingGuest 
        ? `${API_URL}/api/guests/${editingGuest.id}/` 
        : `${API_URL}/api/guests/`;
      
      const method = editingGuest ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(editingGuest ? "Profile Updated! ✅" : "Guest Added! 👤");
        setShowModal(false);
        fetchGuests();
      } else {
        alert("Error saving profile. Please check fields.");
      }
    } catch (err) { console.error(err); } 
    finally { setIsSubmitting(false); }
  };

  // 4️⃣ Delete Guest
  const handleDelete = async (id) => {
    if(!window.confirm("Permanently delete this guest profile?")) return;
    try {
      const res = await fetch(`${API_URL}/api/guests/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if(res.ok) {
          fetchGuests();
      } else {
          alert("Cannot delete guest with active history.");
      }
    } catch (err) { console.error(err); }
  };

  // --- FILTERING (Search Logic) ---
  const filteredGuests = guests.filter(g => 
    g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.phone?.includes(searchTerm) || 
    g.id_proof_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading CRM Database...</p>
       </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Guest Directory</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">CRM & Profile Management</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Search name, phone, or ID..." 
                    className="w-full pl-12 p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={handleCreate} 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
            >
                <Plus size={18}/> Add Guest
            </button>
        </div>
      </div>

      {/* GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGuests.map(guest => (
            <div key={guest.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black text-xl border-4 border-white shadow-sm">
                        {guest.full_name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate w-40">{guest.full_name}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                            <Globe size={10}/> {guest.nationality}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-3 border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <Phone size={14} className="text-blue-400"/>
                        {guest.phone || 'N/A'}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 truncate">
                        <Mail size={14} className="text-purple-400"/>
                        {guest.email || 'No Email'}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <CreditCard size={14} className="text-orange-400"/>
                        <span className="uppercase tracking-wider">{guest.id_proof_number || 'No ID'}</span>
                    </div>
                    {guest.address && (
                        <div className="flex items-start gap-3 text-xs font-medium text-slate-400">
                            <MapPin size={14} className="text-red-400 mt-0.5 shrink-0"/>
                            <span className="line-clamp-2">{guest.address}</span>
                        </div>
                    )}
                </div>

                {/* Tags (Notes Logic) */}
                {guest.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        {guest.notes.toLowerCase().includes('vip') ? (
                            <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                                <Star size={10} fill="currentColor"/> VIP Guest
                            </span>
                        ) : guest.notes.toLowerCase().includes('ban') ? (
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                                <ShieldAlert size={10}/> Blacklisted
                            </span>
                        ) : (
                            <p className="text-[10px] text-slate-400 italic">"{guest.notes}"</p>
                        )}
                    </div>
                )}

                {/* Actions Hover */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(guest)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit2 size={14}/>
                    </button>
                    <button onClick={() => handleDelete(guest.id)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14}/>
                    </button>
                </div>
            </div>
        ))}
        
        {filteredGuests.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                <User size={48} className="mx-auto text-slate-200 mb-4"/>
                <p className="text-slate-400 font-bold uppercase tracking-widest">No guests found</p>
            </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-10 rounded-[40px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                        {editingGuest ? 'Edit Profile' : 'New Guest'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-300 hover:text-slate-900"><X size={28}/></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                        <input type="text" required placeholder="e.g. Rahul Sharma" 
                            className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all mt-1"
                            value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone</label>
                            <input type="text" required placeholder="+91..." 
                                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all mt-1"
                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                            <input type="email" placeholder="guest@mail.com" 
                                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all mt-1"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ID Number</label>
                            <input type="text" placeholder="Aadhar / Passport" 
                                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all mt-1"
                                value={formData.id_proof_number} onChange={e => setFormData({...formData, id_proof_number: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nationality</label>
                            <input type="text" placeholder="Indian" 
                                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all mt-1"
                                value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Address</label>
                        <textarea rows="2" placeholder="Full residential address..." 
                            className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all mt-1 resize-none"
                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Notes (VIP / Blacklist)</label>
                        <input type="text" placeholder="e.g. VIP, Allergies, Banned..." 
                            className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all mt-1"
                            value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all mt-2 flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {isSubmitting ? 'Saving Profile...' : (editingGuest ? 'Update Guest' : 'Save Guest Profile')}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Guests;