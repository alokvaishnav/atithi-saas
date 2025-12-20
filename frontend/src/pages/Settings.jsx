import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Globe, ShieldCheck, Building2, Mail, Phone } from 'lucide-react';
import { API_URL } from '../config';

const Settings = () => {
  const [settings, setSettings] = useState({
    hotel_name: '',
    gstin: '',
    contact_number: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('access_token');

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.length > 0) setSettings(data[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const method = settings.id ? 'PATCH' : 'POST';
    const url = settings.id ? `${API_URL}/api/settings/${settings.id}/` : `${API_URL}/api/settings/`;
    
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(settings)
    });

    if (res.ok) alert("Global Settings Updated! 🚀");
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-blue-600">Loading Configuration...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Property Settings</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">White-Label & Legal Configuration</p>
        </div>
        <button 
          onClick={handleUpdate}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs"
        >
          <Save size={18}/> Deploy Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: BRANDING */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 italic"><Building2 className="text-blue-600"/> Identity Branding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hotel Display Name</label>
                <input type="text" className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" value={settings.hotel_name} onChange={e => setSettings({...settings, hotel_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Legal GSTIN</label>
                <input type="text" className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" value={settings.gstin} onChange={e => setSettings({...settings, gstin: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Registered Address</label>
              <textarea className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all h-32" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200">
             <h3 className="text-xl font-black mb-8 flex items-center gap-3 italic"><Globe className="text-blue-600"/> Contact Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl">
                  <Phone className="text-slate-400" />
                  <input type="text" className="bg-transparent font-bold outline-none w-full" placeholder="Front Desk Number" value={settings.contact_number} onChange={e => setSettings({...settings, contact_number: e.target.value})} />
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl">
                  <Mail className="text-slate-400" />
                  <input type="email" className="bg-transparent font-bold outline-none w-full" placeholder="Official Email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT: SYSTEM STATUS */}
        <div className="space-y-8">
          <div className="bg-blue-600 p-10 rounded-[40px] text-white shadow-2xl">
            <ShieldCheck size={48} className="mb-6 opacity-40" />
            <h4 className="text-2xl font-black leading-tight mb-4 tracking-tighter uppercase italic">Security & Compliance</h4>
            <p className="text-sm opacity-80 leading-relaxed font-bold">Your system is currently running on the Atithi Enterprise v2.1 Engine. All tax calculations are based on the latest GST regulations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;