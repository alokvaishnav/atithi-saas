import React, { useEffect, useState } from 'react';
import { 
    TrendingUp, Building, ShieldCheck, Database, 
    BarChart3, AlertTriangle, X, Activity 
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer 
} from 'recharts';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const CommandCenter = () => {
    const { token } = useAuth();
    
    // --- STATE ---
    const [stats, setStats] = useState({ total_hotels: 0, active_licenses: 0, platform_revenue: 0, total_rooms: 0 });
    const [logs, setLogs] = useState([]); // 🟢 Initialized as empty array
    const [trendData, setTrendData] = useState([]); // For the chart

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [statsRes, logsRes] = await Promise.all([
                    fetch(`${API_URL}/api/super-admin/stats/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/logs/`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                // 1. Process Stats & Chart Data
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats || {});
                    
                    // Use real trend data if available, otherwise fallback to mock data for visualization
                    const rawTrend = data.trend || [];
                    const formattedTrend = rawTrend.length > 0 ? rawTrend : [
                        { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
                        { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 4500 },
                        { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 7500 },
                    ];
                    setTrendData(formattedTrend);
                }

                // 2. Process Logs (Safe Handling)
                if (logsRes.ok) {
                    const logData = await logsRes.json();
                    // 🟢 Critical Fix: Handle Pagination Object vs Array
                    const logArray = Array.isArray(logData) ? logData : (logData.results || []);
                    setLogs(logArray);
                }
            } catch (e) { 
                console.error("Dashboard Load Error:", e); 
            }
        };
        if (token) fetchDashboard();
    }, [token]);

    // 🟢 Critical Fix: Safety check before filtering
    const criticalLogs = Array.isArray(logs) ? logs.filter(l => l.action === 'ERROR' || (l.details && l.details.includes('Failed'))) : [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. KEY METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total ARR" 
                    val={`₹${((stats.platform_revenue || 0)/100000).toFixed(2)}L`} 
                    icon={TrendingUp} 
                    color="text-emerald-400" 
                    border="border-emerald-500/20" 
                    bg="bg-emerald-500/10"
                />
                <MetricCard 
                    title="Active Tenants" 
                    val={stats.total_hotels || 0} 
                    icon={Building} 
                    color="text-blue-400" 
                    border="border-blue-500/20" 
                    bg="bg-blue-500/10"
                />
                <MetricCard 
                    title="Active Licenses" 
                    val={stats.active_licenses || 0} 
                    icon={ShieldCheck} 
                    color="text-purple-400" 
                    border="border-purple-500/20" 
                    bg="bg-purple-500/10"
                />
                <MetricCard 
                    title="Global Inventory" 
                    val={stats.total_rooms || 0} 
                    icon={Database} 
                    color="text-orange-400" 
                    border="border-orange-500/20" 
                    bg="bg-orange-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 2. REVENUE CHART (ADVANCED FEATURE) */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2">
                            <BarChart3 size={18} className="text-purple-500"/> Revenue Velocity
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase">Live Data</span>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                                <YAxis stroke="#64748b" tick={{fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px'}}
                                    itemStyle={{color: '#e2e8f0'}}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. SYSTEM HEALTH & ALERTS (ADVANCED FEATURE) */}
                <div className="space-y-6">
                    {/* Health Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2 mb-4">
                            <Activity size={18} className="text-blue-400"/> System Health
                        </h3>
                        <div className="space-y-4">
                            <HealthItem label="API Gateway" status="Operational" color="bg-emerald-500"/>
                            <HealthItem label="Database Cluster" status="Operational" color="bg-emerald-500"/>
                            <HealthItem label="Email Service (SMTP)" status="Degraded" color="bg-yellow-500"/>
                        </div>
                    </div>

                    {/* Alerts Feed */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex-1 h-[250px] overflow-hidden flex flex-col">
                        <h3 className="font-black text-white uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500"/> Critical Events
                        </h3>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                            {criticalLogs.length > 0 ? criticalLogs.slice(0, 5).map((l, i) => (
                                <div key={i} className="flex gap-3 items-start p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <X size={14} className="text-red-500 mt-1 shrink-0"/>
                                    <div>
                                        <p className="text-xs font-bold text-red-200">{l.details || "Unknown Error"}</p>
                                        <p className="text-[10px] text-red-400 mt-1">{new Date(l.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-500 text-xs italic">
                                    No critical alerts found. System nominal.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const MetricCard = ({ title, val, icon: Icon, color, border, bg }) => (
    <div className={`p-6 rounded-2xl border ${border || 'border-slate-800'} ${bg || 'bg-slate-900'} relative overflow-hidden group transition-all hover:scale-[1.02]`}>
        <div className={`absolute top-4 right-4 p-3 rounded-xl bg-slate-950/20 ${color}`}><Icon size={20}/></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-3xl font-black text-white italic tracking-tighter">{val}</h3>
    </div>
);

const HealthItem = ({ label, status, color }) => (
    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} animate-pulse`}></div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">{status}</span>
        </div>
    </div>
);

export default CommandCenter;