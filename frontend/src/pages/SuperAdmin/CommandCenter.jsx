import { useEffect, useState } from 'react';
import { TrendingUp, Building, ShieldCheck, Database, BarChart3, AlertTriangle, X } from 'lucide-react';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const CommandCenter = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({ total_hotels: 0, active_licenses: 0, platform_revenue: 0, total_rooms: 0 });
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsRes, logsRes] = await Promise.all([
                    fetch(`${API_URL}/api/super-admin/stats/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/logs/`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats);
                }
                if (logsRes.ok) setLogs(await logsRes.json());
            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, [token]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard title="Total ARR" val={`₹${((stats.platform_revenue || 0)/100000).toFixed(2)}L`} icon={TrendingUp} color="text-emerald-400" />
                <MetricCard title="Active Nodes" val={stats.total_hotels} icon={Building} color="text-blue-400" />
                <MetricCard title="Total Licenses" val={stats.active_licenses} icon={ShieldCheck} color="text-purple-400" />
                <MetricCard title="Global Inventory" val={stats.total_rooms} icon={Database} color="text-orange-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                    <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2 mb-8"><BarChart3 size={18} className="text-purple-500"/> Revenue Intelligence</h3>
                    <div className="flex items-end justify-between h-48 gap-4">
                        {[35, 42, 28, 55, 60, 48, 72, 65, 85, 90, 78, 95].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div style={{height: `${h}%`}} className="w-full bg-slate-800 rounded-t-lg group-hover:bg-purple-500 transition-all duration-500 relative"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase">M{i+1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <h3 className="font-black text-white uppercase text-sm tracking-widest mb-6 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-500"/> Critical Alerts</h3>
                    <div className="space-y-4">
                        {logs.filter(l => l.action === 'ERROR' || l.details.includes('Failed')).slice(0,5).map((l, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <X size={14} className="text-red-500 mt-1 shrink-0"/>
                                <div>
                                    <p className="text-xs font-bold text-red-200">{l.details}</p>
                                    <p className="text-[10px] text-red-400 mt-1">{new Date(l.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-slate-500 text-xs italic">System nominal. No critical alerts.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, val, icon: Icon, color }) => (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
        <div className={`absolute top-4 right-4 p-3 bg-slate-950 rounded-xl ${color}`}><Icon size={20}/></div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-3xl font-black text-white italic tracking-tighter">{val}</h3>
    </div>
);

export default CommandCenter;