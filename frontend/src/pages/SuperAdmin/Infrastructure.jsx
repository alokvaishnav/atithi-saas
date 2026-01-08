import { useEffect, useState } from 'react';
import { Megaphone, HardDrive, Trash2, Search, AlertCircle, Info, CheckCircle, Send } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const Infrastructure = () => {
    const { token } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    // 🟢 Fix 1: Initialize empty array
    const [logs, setLogs] = useState([]); 
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [logSearch, setLogSearch] = useState('');
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
                // 🟢 Fix 2: Handle Pagination Logic & Safe Array Check
                const safeLogs = Array.isArray(logData) ? logData : (logData.results || []);
                setLogs(safeLogs);
                setFilteredLogs(safeLogs);
            }
        } catch (error) {
            console.error("Infra Fetch Error", error);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    // --- LOG FILTER LOGIC ---
    useEffect(() => {
        if (!logSearch) {
            setFilteredLogs(logs);
        } else {
            const lowerTerm = logSearch.toLowerCase();
            setFilteredLogs(logs.filter(l => 
                (l.details || '').toLowerCase().includes(lowerTerm) || 
                (l.action || '').toLowerCase().includes(lowerTerm)
            ));
        }
    }, [logSearch, logs]);

    const sendBroadcast = async () => {
        if(!newMsg.title || !newMsg.message) return alert("Title and Message required");
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

    const deleteAnnouncement = async (id) => {
        if(!confirm("Delete this announcement?")) return;
        try {
            await fetch(`${API_URL}/api/super-admin/stats/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'delete_announcement', id })
            });
            fetchData();
        } catch (e) {
            alert("Delete failed");
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. BROADCAST CENTER */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col">
                <h3 className="font-black text-white uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                    <Megaphone size={18} className="text-orange-400"/> Global Broadcast
                </h3>
                
                <div className="space-y-4 mb-8">
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-orange-500 transition-all" 
                        placeholder="Announcement Title" 
                        value={newMsg.title} 
                        onChange={e => setNewMsg({...newMsg, title: e.target.value})}
                    />
                    <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-bold text-white outline-none min-h-[120px] focus:border-orange-500 transition-all" 
                        placeholder="Message content..." 
                        value={newMsg.message} 
                        onChange={e => setNewMsg({...newMsg, message: e.target.value})}
                    />
                    <button onClick={sendBroadcast} className="w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-black uppercase text-xs tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                        <Send size={16}/> Send Broadcast
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-800 pt-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Active Broadcasts</p>
                    <div className="space-y-3">
                        {announcements.map((a, i) => (
                            <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-start group">
                                <div>
                                    <p className="text-xs font-bold text-white mb-1">{a.title}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleDateString()} • {a.message}</p>
                                </div>
                                <button onClick={() => deleteAnnouncement(a.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                            </div>
                        ))}
                        {announcements.length === 0 && <p className="text-center text-slate-600 text-xs italic py-4">No active announcements</p>}
                    </div>
                </div>
            </div>

            {/* 2. SYSTEM LOGS (With Search & Visuals) */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col h-[600px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2">
                        <HardDrive size={18} className="text-blue-400"/> System Logs
                    </h3>
                    <div className="relative w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={12}/>
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 py-2 text-[10px] font-bold text-white outline-none focus:border-blue-500" 
                            placeholder="Filter logs..."
                            value={logSearch}
                            onChange={e => setLogSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {/* 🟢 Fix 3: Ensure map works safely with filtered logs */}
                    {filteredLogs.map((l, i) => {
                        let color = "text-slate-300";
                        let icon = <Info size={14} className="text-blue-500"/>;
                        let border = "border-blue-500/20";

                        if(l.action === 'ERROR' || (l.details && l.details.includes('Failed'))) {
                            color = "text-red-200";
                            icon = <AlertCircle size={14} className="text-red-500"/>;
                            border = "border-red-500/20";
                        } else if (l.action === 'LOGIN' || l.action === 'SIGNUP') {
                            color = "text-emerald-200";
                            icon = <CheckCircle size={14} className="text-emerald-500"/>;
                            border = "border-emerald-500/20";
                        }

                        return (
                            <div key={i} className={`flex gap-3 items-start p-3 bg-slate-950 rounded-lg border ${border} hover:bg-slate-800/50 transition-colors`}>
                                <div className="mt-0.5 shrink-0">{icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-xs font-bold ${color} truncate`}>{l.action}</p>
                                        <span className="text-[10px] text-slate-600 font-mono whitespace-nowrap ml-2">{new Date(l.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 break-words">{l.details || "System Event"}</p>
                                    <p className="text-[9px] text-slate-700 mt-1 uppercase font-bold">{l.owner ? `User: ${l.user || 'ID:' + l.owner}` : 'System'}</p>
                                </div>
                            </div>
                        );
                    })}
                    {filteredLogs.length === 0 && <p className="text-center text-slate-600 text-xs italic py-10">No logs found matching your search</p>}
                </div>
            </div>
        </div>
    );
};
export default Infrastructure;