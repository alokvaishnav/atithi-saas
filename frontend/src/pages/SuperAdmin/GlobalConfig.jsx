import { useEffect, useState } from 'react';
import { 
    Settings2, Mail, MessageCircle, Save, 
    Globe, Server, ShieldAlert, Loader2 
} from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const GlobalConfig = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({ 
        // Branding
        app_name: '', 
        company_name: '', 
        
        // Support
        support_email: '', 
        support_phone: '',
        address: '', 

        // SMTP (Email)
        smtp_host: '', 
        smtp_port: '587', 
        smtp_user: '', 
        smtp_password: '',
        
        // Email Automation
        welcome_email_subject: '',
        welcome_email_body: '',

        // WhatsApp API (Meta)
        whatsapp_enabled: false,
        whatsapp_phone_id: '',
        whatsapp_token: '',
        welcome_whatsapp_msg: '',

        // System
        maintenance_mode: false 
    });

    useEffect(() => {
        fetch(`${API_URL}/api/super-admin/platform-settings/`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setConfig(prev => ({ ...prev, ...data })));
    }, [token]);

    const saveConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/super-admin/platform-settings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(config)
            });
            if(res.ok) alert("✅ Configuration Saved Successfully");
            else alert("❌ Failed to save configuration");
        } catch (e) {
            alert("Network Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                        <Settings2 size={32} className="text-purple-500"/> Global Configuration
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        System Identity, Gateways & Automation
                    </p>
                </div>
                <button onClick={saveConfig} disabled={loading} className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 shadow-lg transition-all">
                    {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save All Changes
                </button>
            </div>

            <div className="space-y-8">
                
                {/* 1. IDENTITY & BRANDING */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Globe size={18} className="text-blue-500"/> Platform Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Application Name" val={config.app_name} set={v => setConfig({...config, app_name: v})} placeholder="e.g. Atithi SaaS" />
                        <Input label="Company Legal Name" val={config.company_name} set={v => setConfig({...config, company_name: v})} placeholder="e.g. Atithi Tech Pvt Ltd" />
                        <Input label="Support Email" val={config.support_email} set={v => setConfig({...config, support_email: v})} placeholder="support@atithi.com" />
                        <Input label="Support Phone" val={config.support_phone} set={v => setConfig({...config, support_phone: v})} placeholder="+91 98765 43210" />
                        <div className="md:col-span-2">
                            <Input label="Office Address" val={config.address} set={v => setConfig({...config, address: v})} placeholder="123, Tech Park, Pune, India" />
                        </div>
                    </div>
                </div>

                {/* 2. EMAIL SMTP & AUTOMATION */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Mail size={18} className="text-orange-500"/> Email Gateway (SMTP)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Input label="SMTP Host" val={config.smtp_host} set={v => setConfig({...config, smtp_host: v})} placeholder="smtp.gmail.com" />
                        <Input label="SMTP Port" val={config.smtp_port} set={v => setConfig({...config, smtp_port: v})} placeholder="587" />
                        <Input label="SMTP User" val={config.smtp_user} set={v => setConfig({...config, smtp_user: v})} placeholder="auth@atithi.com" />
                        <div className="md:col-span-3">
                            <Input label="SMTP Password (App Password)" type="password" val={config.smtp_password} set={v => setConfig({...config, smtp_password: v})} />
                        </div>
                    </div>

                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">New Client Welcome Email Template</p>
                        <div className="space-y-4">
                            <Input label="Subject Line" val={config.welcome_email_subject} set={v => setConfig({...config, welcome_email_subject: v})} placeholder="Welcome to {app_name}!" />
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Body (Use {'{name}'}, {'{username}'}, {'{password}'})</label>
                                <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-medium text-slate-300 outline-none focus:border-orange-500 min-h-[120px]" 
                                    value={config.welcome_email_body} 
                                    onChange={e => setConfig({...config, welcome_email_body: e.target.value})}
                                    placeholder="Hi {name}, Welcome to {app_name}. Your login credentials are..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. WHATSAPP GATEWAY */}
                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle size={18} className="text-emerald-500"/> WhatsApp API (Meta Cloud)
                        </h4>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{config.whatsapp_enabled ? 'Active' : 'Disabled'}</span>
                            <div className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${config.whatsapp_enabled ? 'bg-emerald-500' : 'bg-slate-700'}`} onClick={() => setConfig({...config, whatsapp_enabled: !config.whatsapp_enabled})}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transition-transform ${config.whatsapp_enabled ? 'translate-x-5' : ''}`}></div>
                            </div>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-opacity ${!config.whatsapp_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Input label="Phone Number ID" val={config.whatsapp_phone_id} set={v => setConfig({...config, whatsapp_phone_id: v})} placeholder="100345..." />
                        <Input label="Permanent Access Token" type="password" val={config.whatsapp_token} set={v => setConfig({...config, whatsapp_token: v})} />
                    </div>

                    <div className={`bg-slate-950 p-6 rounded-2xl border border-slate-800 transition-opacity ${!config.whatsapp_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Welcome WhatsApp Template</label>
                        <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-medium text-slate-300 outline-none focus:border-emerald-500 min-h-[100px]" 
                            value={config.welcome_whatsapp_msg} 
                            onChange={e => setConfig({...config, welcome_whatsapp_msg: e.target.value})}
                            placeholder="Hello {name}! Your account is ready. Login at..."
                        />
                    </div>
                </div>

                {/* 4. DANGER ZONE */}
                <div className="bg-red-950/10 p-8 rounded-3xl border border-red-900/30 flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                            <ShieldAlert size={18}/> Maintenance Mode
                        </h4>
                        <p className="text-[10px] text-red-400/60 font-medium">When active, only Super Admins can access the system.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-red-400 uppercase">{config.maintenance_mode ? 'System Locked' : 'Normal'}</span>
                        <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${config.maintenance_mode ? 'bg-red-500' : 'bg-slate-800'}`} onClick={() => setConfig({...config, maintenance_mode: !config.maintenance_mode})}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${config.maintenance_mode ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// UI Helper
const Input = ({ label, val, set, type="text", placeholder="" }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{label}</label>
        <input 
            type={type} 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-medium text-slate-200 outline-none focus:border-purple-500 focus:bg-slate-900 transition-all placeholder:text-slate-700" 
            value={val} 
            onChange={e => set(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

export default GlobalConfig;