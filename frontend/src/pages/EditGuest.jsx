import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Save, ArrowLeft, Loader2, 
  Calendar, Globe, CreditCard, Star, FileText, Trash2 
} from 'lucide-react';
import { API_URL } from '../config';

const EditGuest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '', 
    email: '', 
    phone: '', 
    address: '', 
    id_proof_number: '',
    id_proof_type: 'AADHAR', // Default
    dob: '',
    nationality: '',
    preferences: '', // Notes like "Allergic to nuts"
    is_vip: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const token = localStorage.getItem('access_token');

  // Fetch Guest Data
  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/guests/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Merge fetched data with default state to prevent uncontrolled inputs
            setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchGuest();
  }, [id, token]);

  // Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
        const res = await fetch(`${API_URL}/api/guests/${id}/`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            alert("Guest Profile Updated Successfully! ✅");
            navigate('/guests');
        } else {
            alert("Failed to update. Please check the fields.");
        }
    } catch (err) { 
        console.error(err); 
    } finally {
        setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
      if (!window.confirm("⚠️ WARNING: This will permanently delete this guest and their history. Are you sure?")) return;
      
      setDeleting(true);
      try {
        const res = await fetch(`${API_URL}/api/guests/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            navigate('/guests');
        }
      } catch (err) {
          console.error(err);
          setDeleting(false);
      }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-widest gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32}/> 
        Loading Profile...
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto">
        
        {/* TOP NAV */}
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                <ArrowLeft size={20}/> Back to Directory
            </button>
            <button 
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all"
            >
                {deleting ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14}/>} Delete Guest
            </button>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-xl border border-slate-200 relative overflow-hidden">
            
            {/* VIP BANNER (Conditional) */}
            {formData.is_vip && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-6 py-2 rounded-bl-2xl uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <Star size={12} fill="currentColor"/> VIP Member
                </div>
            )}

            <h2 className="text-3xl font-black text-slate-800 uppercase italic mb-2">Edit Profile</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Update guest information & preferences</p>
            
            <form onSubmit={handleUpdate} className="space-y-8">
                
                {/* SECTION 1: PERSONAL DETAILS */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={16} className="text-blue-500"/> Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                            <input required className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-200 transition-all text-slate-800 placeholder:text-slate-300"
                                value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-slate-400" size={16}/>
                                <input type="email" className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-300"
                                    value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 text-slate-400" size={16}/>
                                <input required className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-300"
                                    value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16}/>
                                <input type="date" className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                                    value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nationality</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-3.5 text-slate-400" size={16}/>
                                <input className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-300"
                                    placeholder="e.g. Indian"
                                    value={formData.nationality || ''} onChange={e => setFormData({...formData, nationality: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100"/>

                {/* SECTION 2: IDENTITY & ADDRESS */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CreditCard size={16} className="text-purple-500"/> Identity & Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ID Type</label>
                            <select className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                                value={formData.id_proof_type || 'AADHAR'} onChange={e => setFormData({...formData, id_proof_type: e.target.value})}>
                                <option value="AADHAR">Aadhar Card</option>
                                <option value="PASSPORT">Passport</option>
                                <option value="DRIVING_LICENSE">Driving License</option>
                                <option value="VOTER_ID">Voter ID</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ID Number</label>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 placeholder:text-slate-300"
                                value={formData.id_proof_number || ''} onChange={e => setFormData({...formData, id_proof_number: e.target.value})} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Permanent Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3.5 text-slate-400" size={16}/>
                                <input className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 placeholder:text-slate-300"
                                    value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100"/>

                {/* SECTION 3: PREFERENCES & VIP */}
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-orange-500"/> Notes & Status
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition-colors"
                             onClick={() => setFormData({...formData, is_vip: !formData.is_vip})}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${formData.is_vip ? 'bg-yellow-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                <Star size={14} fill={formData.is_vip ? "currentColor" : "none"}/>
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 uppercase">VIP Status</p>
                                <p className="text-[10px] font-bold text-slate-400">Mark this guest as a Very Important Person</p>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Preferences / Notes</label>
                            <textarea rows="3" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500 resize-none text-slate-800 placeholder:text-slate-300"
                                placeholder="E.g. Allergies, Room preferences, Special requests..."
                                value={formData.preferences || ''} onChange={e => setFormData({...formData, preferences: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* SUBMIT */}
                <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-300"
                >
                    {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                    {saving ? "Saving Changes..." : "Save Profile"}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EditGuest;