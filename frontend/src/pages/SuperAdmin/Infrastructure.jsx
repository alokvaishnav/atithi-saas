import { useEffect, useState } from 'react';
import { Megaphone, HardDrive, Trash2 } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const Infrastructure = () => {
    const { token } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    // 🟢 Fix 1: Initialize empty array
    const [logs, setLogs] = useState([]); 
    const [newMsg, setNewMsg] = useState({ title: '', message: '' });

    const fetchData = async () => {
        try {
            const [statsRes, logsRes] = await Promise.all([
                fetch(`${API_URL}/api/super-admin/stats/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/logs/`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setAnnouncements(Array.isArray(statsData.announcements) ? statsData.announcements : []);
            }

            if (logsRes.ok) {
                const logData = await logsRes.json();
                // 🟢 Fix 2: Handle Pagination Logic
                setLogs(Array.isArray(logData) ? logData : (logData.results || []));
            }
        } catch (error) {
            console.error("Infra Fetch Error", error);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const sendBroadcast = async () => {
        try {
            await fetch(`${API_URL}/api/super-admin/stats/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'create_announcement', ...newMsg })
            });
            setNewMsg({ title: '', message: '' });
            fetchData();
            alert("Broadcast Sent!");
        } catch (error) {
            alert("Failed to send broadcast");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            {/* System Announcements */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                <h3 className="font-black text-white uppercase text-sm tracking-widest mb-6 flex items-center gap-2"><Megaphone size={18} className="text-orange-400"/> Global Broadcast</h3>
                <div className="space-y-4">
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none" placeholder="Title" value={newMsg.title} onChange={e => setNewMsg({...newMsg, title: e.target.value})}/>
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white outline-none min-h-[100px]" placeholder="Message" value={newMsg.message} onChange={e => setNewMsg({...newMsg, message: e.target.value})}/>
                    <button onClick={sendBroadcast} className="w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-black uppercase text-xs tracking-widest text-white transition-all">Send Broadcast to All Tenants</button>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-800 space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Active Broadcasts</p>
                    {announcements.map(a => (
                        <div key={a.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div><p className="text-xs font-bold text-white">{a.title}</p><p className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</p></div>
                            <button className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Infrastructure Logs */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col h-[600px]">
                <h3 className="font-black text-white uppercase text-sm tracking-widest mb-6 flex items-center gap-2"><HardDrive size={18} className="text-blue-400"/> System Logs</h3>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {/* 🟢 Fix 3: Ensure map works safely */}
                    {logs.map((l, i) => (
                        <div key={i} className="flex gap-3 items-start border-l-2 border-slate-800 pl-4 py-1">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${l.action === 'ERROR' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <div>
                                <p className="text-xs font-bold text-slate-300">{l.details || "System Event"}</p>
                                <p className="text-[10px] text-slate-600 font-mono mt-1">{new Date(l.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default Infrastructure;