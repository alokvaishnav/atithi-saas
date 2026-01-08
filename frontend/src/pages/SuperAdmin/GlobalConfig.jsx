import { useEffect, useState } from 'react';
import { Settings2, Mail } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const GlobalConfig = () => {
    const { token } = useAuth();
    const [config, setConfig] = useState({ app_name: '', company_name: '', support_email: '', support_phone: '', smtp_host: '', smtp_user: '', smtp_password: '', maintenance_mode: false });

    useEffect(() => {
        fetch(`${API_URL}/api/super-admin/platform-settings/`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setConfig(data));
    }, [token]);

    const saveConfig = async () => {
        const res = await fetch(`${API_URL}/api/super-admin/platform-settings/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(config)
        });
        if(res.ok) alert("Configuration Saved");
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800">
                <h3 className="font-black text-white uppercase text-xl tracking-tighter mb-8 flex items-center gap-3"><Settings2 size={24} className="text-purple-500"/> Platform Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Branding</h4>
                        <Input label="App Name" val={config.app_name} set={v => setConfig({...config, app_name: v})} />
                        <Input label="Company Name" val={config.company_name} set={v => setConfig({...config, company_name: v})} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Support</h4>
                        <Input label="Support Email" val={config.support_email} set={v => setConfig({...config, support_email: v})} />
                        <Input label="Support Phone" val={config.support_phone} set={v => setConfig({...config, support_phone: v})} />
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Mail size={14}/> SMTP Gateway</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Host" val={config.smtp_host} set={v => setConfig({...config, smtp_host: v})} />
                        <Input label="User" val={config.smtp_user} set={v => setConfig({...config, smtp_user: v})} />
                        <div className="col-span-2">
                            <Input label="Password" type="password" val={config.smtp_password} set={v => setConfig({...config, smtp_password: v})} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-800">
                    <div className="flex items-center gap-3 mr-auto">
                        <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${config.maintenance_mode ? 'bg-red-500' : 'bg-slate-700'}`} onClick={() => setConfig({...config, maintenance_mode: !config.maintenance_mode})}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${config.maintenance_mode ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maintenance Mode</span>
                    </div>
                    <button onClick={saveConfig} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const Input = ({ label, val, set, type="text" }) => (
    <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{label}</label>
        <input type={type} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-purple-500" value={val} onChange={e => set(e.target.value)}/>
    </div>
);

export default GlobalConfig;