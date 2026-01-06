import { useEffect, useState, useCallback } from 'react';
import { 
  Save, Building, MapPin, Globe, Phone, 
  Loader2, Image as ImageIcon, Mail, FileText,
  Server, Lock, MessageCircle, Eye, EyeOff, CheckCircle,
  Upload, Clock, Coins, Info, Copy, ExternalLink, Smartphone,
  AlertCircle
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { token, user, updateGlobalProfile } = useAuth(); 
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // General & Branding
    hotel_name: '', 
    description: '',
    address: '', 
    phone: '', 
    email: '', 
    website: '', 
    tax_gst_number: '',
    logo: null, 
    
    // Operations
    check_in_time: '12:00',
    check_out_time: '11:00',
    currency_symbol: '₹',

    // Automation (Email)
    auto_send_confirmation: false,
    auto_send_invoice: false,
    smtp_server: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    
    // WhatsApp
    whatsapp_provider: 'META',
    whatsapp_phone_id: '',
    whatsapp_auth_token: ''
  });
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New: Error state
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [showPassword, setShowPassword] = useState(false);

  // Derived Links for "Digital Presence"
  const publicLink = `${window.location.origin}/book/${user?.username}`;
  const hkLink = `${window.location.origin}/hk-mobile`;

  // --- FETCH SETTINGS ---
  const fetchSettings = useCallback(async () => {
    if (!token) return; 
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/settings/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
          navigate('/login');
          return;
      }

      if (res.ok) {
        const data = await res.json();
        const settings = Array.isArray(data) ? data[0] : data;
        
        if (settings) {
            setFormData(prev => ({
                ...prev,
                ...settings,
                // Ensure protected fields don't get overwritten with nulls if backend hides them
                smtp_password: settings.smtp_password || '',
                whatsapp_auth_token: settings.whatsapp_auth_token || ''
            }));
            if (settings.logo) setLogoPreview(settings.logo);
        }
      } else {
          setError("Failed to load settings.");
      }
    } catch (err) { 
      console.error("Error fetching settings:", err); 
      setError("Network connection failed.");
    } finally { 
      setLoading(false); 
    }
  }, [token, navigate]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // --- HANDLE INPUT CHANGES ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- HANDLE IMAGE SELECTION ---
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setFormData({ ...formData, logo: file }); 
        setLogoPreview(URL.createObjectURL(file)); 
    }
  };

  // --- SAVE SETTINGS (Multipart) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const dataToSend = new FormData();
        
        Object.keys(formData).forEach(key => {
            // Only append logo if it's a new File (not existing URL string)
            if (key === 'logo') {
                if (formData.logo instanceof File) {
                    dataToSend.append('logo', formData.logo);
                }
            } else if (formData[key] !== null && formData[key] !== undefined) {
                dataToSend.append(key, formData[key]);
            }
        });

        const res = await fetch(`${API_URL}/api/settings/`, {
            method: 'POST', 
            headers: { 
                'Authorization': `Bearer ${token}` 
            },
            body: dataToSend
        });
        
        if (res.ok) {
            const updated = await res.json();
            if (updated.hotel_name) {
                updateGlobalProfile(updated.hotel_name.toUpperCase());
            }
            alert("Configuration Saved Successfully! ✅");
        } else {
            alert("Failed to save settings. Please check inputs.");
        }
    } catch (err) { 
        console.error(err);
        alert("Server error occurred.");
    } finally {
        setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      alert("Link copied to clipboard!");
  };

  if (loading) return <div className="p-20 text-center flex justify-center items-center gap-2"><Loader2 className="animate-spin text-blue-600"/> Loading System Config...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">System Configuration</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">General, Branding & Notifications</p>
            </div>
            <button 
                onClick={handleSave} 
                type="button" 
                disabled={saving}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-70"
            >
                {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                {saving ? "Saving..." : "Save Configuration"}
            </button>
        </div>

        {/* ERROR BANNER */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
                <AlertCircle size={20}/> {error}
                <button onClick={fetchSettings} className="underline ml-auto hover:text-red-800">Retry</button>
            </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl border border-slate-200 w-fit overflow-x-auto">
            {['GENERAL', 'DIGITAL PRESENCE', 'EMAIL', 'WHATSAPP'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeTab === tab 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                >
                    {tab === 'EMAIL' ? 'SMTP Email' : tab}
                </button>
            ))}
        </div>

        <form id="settings-form" onSubmit={handleSave} className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-200 relative overflow-hidden min-h-[500px]">
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-20 -mt-20 z-0 pointer-events-none"></div>

            {/* --- TAB 1: GENERAL & BRANDING --- */}
            {activeTab === 'GENERAL' && (
                <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Brand Identity Section */}
                    <div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <ImageIcon size={16}/> Hotel Branding
                        </h3>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Logo Upload */}
                            <div className="w-full md:w-1/3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Hotel Logo</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-blue-400 transition-all text-center relative h-40 group cursor-pointer">
                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer z-20"/>
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="h-full w-auto object-contain z-10"/>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                                <Upload size={18}/>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">Click to Upload</span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase mt-1">PNG, JPG (Max 2MB)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Basic Details */}
                            <div className="w-full md:w-2/3 grid grid-cols-1 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Hotel Name</label>
                                    <div className="relative group">
                                        <Building className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                        <input required name="hotel_name" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                            value={formData.hotel_name} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Currency Symbol</label>
                                        <div className="relative group">
                                            <Coins className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                            <input name="currency_symbol" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                                value={formData.currency_symbol} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">GST / Tax ID</label>
                                        <input name="tax_gst_number" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                            value={formData.tax_gst_number} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Description / Tagline</label>
                             <div className="relative group">
                                <Info className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                <textarea name="description" rows="2" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all resize-none" 
                                    placeholder="e.g. Luxury Stay in the Heart of the City"
                                    value={formData.description} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* Operational Details */}
                    <div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Clock size={16}/> Operations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Standard Check-In Time</label>
                                <input name="check_in_time" type="time" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent" 
                                    value={formData.check_in_time} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Standard Check-Out Time</label>
                                <input name="check_out_time" type="time" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent" 
                                    value={formData.check_out_time} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <MapPin size={16}/> Location & Contact
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Full Address</label>
                                <input name="address" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                    value={formData.address} onChange={handleChange} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Phone</label>
                                    <Phone className="absolute left-4 top-[2.4rem] text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                    <input name="phone" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                        value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email</label>
                                    <Mail className="absolute left-4 top-[2.4rem] text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                    <input name="email" type="email" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                        value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="relative group">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Website</label>
                                    <Globe className="absolute left-4 top-[2.4rem] text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                    <input name="website" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                        value={formData.website} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 2: DIGITAL PRESENCE (NEW) --- */}
            {activeTab === 'DIGITAL PRESENCE' && (
                <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Public Website Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[30px] shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-sm">
                                <Globe size={48} className="text-blue-200"/>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Your Booking Engine</h3>
                                <p className="text-blue-100 text-sm font-medium mb-6 max-w-md">
                                    Share this link on Google Maps, Instagram, and WhatsApp to get direct commission-free bookings.
                                </p>
                                
                                <div className="bg-slate-900/30 p-2 pl-4 rounded-xl flex items-center justify-between gap-4 border border-white/10">
                                    <span className="font-mono text-xs truncate text-blue-200">{publicLink}</span>
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => copyToClipboard(publicLink)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Copy">
                                            <Copy size={16}/>
                                        </button>
                                        <a href={publicLink} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200" title="Open">
                                            <ExternalLink size={16}/>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Housekeeping App Card */}
                    <div className="bg-slate-50 p-8 rounded-[30px] shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-8">
                        <div className="p-6 bg-purple-100 rounded-3xl border border-purple-200">
                            <Smartphone size={48} className="text-purple-600"/>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">Housekeeping Portal</h3>
                            <p className="text-slate-500 text-sm mb-4">
                                Share this link with your cleaning staff. It's a simplified mobile view to mark rooms as Clean/Dirty without needing login.
                            </p>
                            <div className="bg-white p-2 pl-4 rounded-xl flex items-center justify-between gap-4 border border-slate-200 shadow-sm">
                                <span className="font-mono text-xs truncate text-slate-600">{hkLink}</span>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => copyToClipboard(hkLink)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                                        <Copy size={16}/>
                                    </button>
                                    <a href={hkLink} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600">
                                        <ExternalLink size={16}/>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 3: EMAIL (SMTP) --- */}
            {activeTab === 'EMAIL' && (
                <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Mail size={16}/> SMTP Configuration
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            Configure this to send booking confirmations and invoices automatically. For Gmail, use an <strong>App Password</strong>.
                        </p>

                        {/* Automation Toggles */}
                        <div className="flex gap-6 mb-8">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" name="auto_send_confirmation" checked={formData.auto_send_confirmation} onChange={handleChange} className="w-5 h-5 rounded-md border-2 border-slate-300 checked:bg-blue-600"/>
                                <label className="text-xs font-bold text-slate-700 uppercase">Auto-Send Booking Confirmation</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" name="auto_send_invoice" checked={formData.auto_send_invoice} onChange={handleChange} className="w-5 h-5 rounded-md border-2 border-slate-300 checked:bg-blue-600"/>
                                <label className="text-xs font-bold text-slate-700 uppercase">Auto-Send Invoice on Checkout</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">SMTP Host</label>
                                <div className="relative group">
                                    <Server className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                    <input name="smtp_server" placeholder="smtp.gmail.com" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                        value={formData.smtp_server} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">SMTP Port</label>
                                <input name="smtp_port" placeholder="587" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                    value={formData.smtp_port} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Username / Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                    <input name="smtp_username" placeholder="hotel@gmail.com" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                        value={formData.smtp_username} onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        name="smtp_password"
                                        placeholder="App Password" 
                                        className="w-full pl-12 pr-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                        value={formData.smtp_password} 
                                        onChange={handleChange} 
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB 4: WHATSAPP --- */}
            {activeTab === 'WHATSAPP' && (
                <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <MessageCircle size={16}/> WhatsApp API
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Provider</label>
                                <select name="whatsapp_provider" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all"
                                    value={formData.whatsapp_provider} onChange={handleChange}>
                                    <option value="META">Meta Cloud API (Official)</option>
                                    <option value="TWILIO">Twilio</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Phone Number ID</label>
                                <input name="whatsapp_phone_id" placeholder="e.g. 105672..." className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all" 
                                    value={formData.whatsapp_phone_id} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Auth Token / API Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="whatsapp_auth_token"
                                    placeholder="Meta/Twilio Token" 
                                    className="w-full pl-12 pr-12 p-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all font-mono text-sm" 
                                    value={formData.whatsapp_auth_token} 
                                    onChange={handleChange} 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                            <CheckCircle className="text-green-600" size={20}/>
                            <p className="text-xs text-green-800 font-bold">
                                Once configured, bills will be automatically sent to guests upon Checkout.
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </form>

      </div>
    </div>
  );
};

export default Settings;