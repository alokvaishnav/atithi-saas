import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

const EditGuest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', address: '', id_proof_number: ''
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/guests/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setFormData(await res.json());
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchGuest();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
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
            alert("Guest Profile Updated! ✅");
            navigate('/guests');
        }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline"/> Loading Profile...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-2xl mx-auto">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-6">
            <ArrowLeft size={20}/> Back to Directory
        </button>

        <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-200">
            <h2 className="text-3xl font-black text-slate-800 uppercase italic mb-8">Edit Guest Profile</h2>
            
            <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                        <input className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                            <input className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                            <input className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                        <input className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">ID Proof Number</label>
                    <input className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.id_proof_number} onChange={e => setFormData({...formData, id_proof_number: e.target.value})} />
                </div>

                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 mt-4">
                    <Save size={18}/> Save Changes
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EditGuest;