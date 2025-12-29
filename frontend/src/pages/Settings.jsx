import { useEffect, useState } from 'react';
import { 
  Save, Building, MapPin, Globe, Phone, 
  Loader2, Image as ImageIcon 
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const [formData, setFormData] = useState({
    hotel_name: '', address: '', phone: '', 
    email: '', website: '', tax_gst_number: ''
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');
  const { updateGlobalProfile } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) setFormData(data[0]);
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/api/settings/`, {
            method: 'POST', // Backend handles create vs update logic
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });
        
        if (res.ok) {
            const updated = await res.json();
            updateGlobalProfile(updated.hotel_name.toUpperCase());
            alert("Settings Saved Successfully! 🏢");
        }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline"/> Loading Config...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Property Settings</h2>
            <button form="settings-form" type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
                <Save size={16}/> Save Changes
            </button>
        </div>

        <form id="settings-form" onSubmit={handleSave} className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-200 space-y-8">
            
            {/* Section 1: Brand */}
            <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Brand Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">Hotel Name</label>
                        <div className="relative">
                            <Building className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                            <input required className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                                value={formData.hotel_name} onChange={e => setFormData({...formData, hotel_name: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">GST / Tax ID</label>
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                            value={formData.tax_gst_number} onChange={e => setFormData({...formData, tax_gst_number: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* Section 2: Contact */}
            <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Contact Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                            <input className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                            <input className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="relative">
                            <Globe className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                            <input className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                                value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

        </form>

      </div>
    </div>
  );
};

export default Settings;