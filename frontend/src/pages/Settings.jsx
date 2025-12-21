import { useEffect, useState } from 'react';
import { 
  Save, Building, CreditCard, Mail, Phone, MapPin, 
  Percent, Globe, Loader2 
} from 'lucide-react'; 
import { API_URL } from '../config'; 

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Matches the PropertySetting model in backend/hotel/models.py
  // Initial state matches the expected fields. ID will be added if fetched.
  const [formData, setFormData] = useState({
    hotel_name: '',
    gstin: '',
    contact_number: '',
    email: '',
    address: '',
    currency_symbol: '₹',
    room_tax_rate: '12.00'
  });

  const token = localStorage.getItem('access_token');

  // 1. Fetch Current Settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/settings/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      // If settings exist, populate form. If it's an array (default DRF list), take the first item.
      if (Array.isArray(data) && data.length > 0) {
        setFormData(data[0]);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  // 2. Save/Update Settings
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // We use POST to create a new record or PUT to update an existing one.
      // We check if 'id' exists in the fetched formData to decide.
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `${API_URL}/api/settings/${formData.id}/` 
        : `${API_URL}/api/settings/`;

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("✅ System Configuration Updated Successfully!");
        // Reloading page ensures the Sidebar and Header update with the new Hotel Name immediately
        window.location.reload(); 
      } else {
        alert("Failed to save settings. Please try again.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Configuration...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">System Configuration</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Global Property Settings & Branding</p>
      </div>

      <form onSubmit={handleSave} className="max-w-4xl">
        
        {/* SECTION 1: IDENTITY */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Building size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Property Identity</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hotel Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                value={formData.hotel_name}
                onChange={e => setFormData({...formData, hotel_name: e.target.value})}
                placeholder="e.g. Grand Palace Hotel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">GSTIN / Tax ID</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                value={formData.gstin}
                onChange={e => setFormData({...formData, gstin: e.target.value})}
                placeholder="e.g. 22AAAAA0000A1Z5"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTACT */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><Globe size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Contact & Location</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@hotel.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all"
                  value={formData.contact_number}
                  onChange={e => setFormData({...formData, contact_number: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Address</label>
            <textarea 
              rows="3"
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none transition-all resize-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Full street address..."
            />
          </div>
        </div>

        {/* SECTION 3: FINANCIALS */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><CreditCard size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Financial Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Currency Symbol</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 p-4 rounded-2xl font-black text-xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                value={formData.currency_symbol}
                onChange={e => setFormData({...formData, currency_symbol: e.target.value})}
                placeholder="₹"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Default Room GST (%)</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-black text-xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                  value={formData.room_tax_rate}
                  onChange={e => setFormData({...formData, room_tax_rate: e.target.value})}
                  placeholder="12.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button 
          type="submit" 
          disabled={isSaving}
          className="bg-slate-900 text-white w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20}/>}
          {isSaving ? 'Saving Changes...' : 'Update System Configuration'}
        </button>

      </form>
    </div>
  );
};

export default Settings;