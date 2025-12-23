import { useEffect, useState } from 'react';
import { 
  Save, Building, CreditCard, Mail, Phone, MapPin, 
  Percent, Globe, Loader2, Building2, Key, ShieldCheck, Utensils 
} from 'lucide-react'; 
import { API_URL } from '../config'; 
import { useAuth } from '../context/AuthContext'; 

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🧠 Use Context to update Global State instantly
  const { updateGlobalProfile } = useAuth(); 

  // 1. Property Settings State (Updated with NEW TAX FIELDS)
  const [formData, setFormData] = useState({
    hotel_name: '',
    gstin: '',
    contact_number: '',
    email: '',
    address: '',
    currency_symbol: '₹',
    room_tax_rate: '12.00',    // Existing
    food_tax_rate: '5.00',     // 👈 NEW
    service_tax_rate: '18.00'  // 👈 NEW
  });

  // 2. Email Automation State
  const [emailData, setEmailData] = useState({
    email: '',
    password: ''
  });

  const [settingId, setSettingId] = useState(null);
  const token = localStorage.getItem('access_token');

  // --- FETCH DATA ---
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        setLoading(true);
        
        // A. Fetch Property Settings
        const propRes = await fetch(`${API_URL}/api/settings/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const propData = await propRes.json();
        
        // If settings exist, populate form
        if (Array.isArray(propData) && propData.length > 0) {
          setFormData(propData[0]);
          setSettingId(propData[0].id);
        }

        // B. Fetch Email Settings
        const emailRes = await fetch(`${API_URL}/api/settings/email/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (emailRes.ok) {
            const eData = await emailRes.json();
            // We only get the email back, password is hidden for security
            if (eData.email) setEmailData(prev => ({ ...prev, email: eData.email }));
        }

      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllSettings();
  }, [token]);

  // --- SAVE DATA ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Save Property Settings
      const method = settingId ? 'PUT' : 'POST';
      const url = settingId 
        ? `${API_URL}/api/settings/${settingId}/` 
        : `${API_URL}/api/settings/`;

      const propReq = fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      // 2. Save Email Settings
      const emailReq = fetch(`${API_URL}/api/settings/email/`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(emailData)
      });

      // Wait for both requests to finish
      const [propRes, emailRes] = await Promise.all([propReq, emailReq]);

      if (propRes.ok && emailRes.ok) {
        
        // 🧠 THE MAGIC: Update Global Context Instantly
        updateGlobalProfile(formData.hotel_name);

        alert("✅ All System Configurations Updated Successfully!");
        
      } else {
        alert("⚠️ Saved partially. Please check inputs.");
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

      <form onSubmit={handleSave} className="max-w-4xl space-y-8">
        
        {/* SECTION 1: IDENTITY */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Building2 size={20}/></div>
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

        {/* SECTION 2: FINANCIALS (UPDATED WITH TAXES) */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><CreditCard size={20}/></div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Financial & Tax Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Currency</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 p-4 rounded-2xl font-black text-xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                value={formData.currency_symbol}
                onChange={e => setFormData({...formData, currency_symbol: e.target.value})}
                placeholder="₹"
              />
            </div>
            
            {/* 🆕 ROOM TAX */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Room GST %</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
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

            {/* 🆕 FOOD TAX */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Food GST %</label>
              <div className="relative">
                <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-black text-xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                  value={formData.food_tax_rate}
                  onChange={e => setFormData({...formData, food_tax_rate: e.target.value})}
                  placeholder="5.00"
                />
              </div>
            </div>

            {/* 🆕 SERVICE TAX */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Other Service GST %</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-black text-xl border-2 border-transparent focus:border-green-500 outline-none transition-all"
                  value={formData.service_tax_rate}
                  onChange={e => setFormData({...formData, service_tax_rate: e.target.value})}
                  placeholder="18.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: CONTACT */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
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

        {/* SECTION 4: EMAIL AUTOMATION */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Mail size={20}/></div>
            <div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Email Automation</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">For Sending Invoices</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sender Gmail Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold border-2 border-transparent focus:border-purple-500 outline-none transition-all"
                  value={emailData.email}
                  onChange={e => setEmailData({...emailData, email: e.target.value})}
                  placeholder="your-hotel@gmail.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Gmail App Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold border-2 border-transparent focus:border-purple-500 outline-none transition-all"
                  value={emailData.password}
                  onChange={e => setEmailData({...emailData, password: e.target.value})}
                  placeholder="xxxx xxxx xxxx xxxx"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-bold ml-2">
                 <ShieldCheck size={12}/> Security Note: Use a Google App Password, not your login password.
              </p>
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