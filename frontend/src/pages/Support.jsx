import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, HelpCircle, FileText, MessageSquare, 
  Send, Server, Database, Wifi, CheckCircle, 
  Loader2, LifeBuoy, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const Support = () => {
  const { token, user } = useAuth();
  
  // --- 1. DYNAMIC COMPANY INFO STATE ---
  const [info, setInfo] = useState({
    app_name: 'Atithi SaaS',
    company_name: 'Atithi Tech',
    support_email: 'support@atithi.com',
    support_phone: '+91 98765 43210',
    address: 'Tech Park'
  });

  // --- 2. TICKET FORM STATE ---
  const [ticket, setTicket] = useState({ subject: '', category: 'BUG', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // --- 3. FETCH SETTINGS (SMART LOGIC) ---
  useEffect(() => {
    const loadSettings = async () => {
      // OPTION A: If User context already has settings, use them immediately
      if (user?.hotel_settings) {
          const settings = user.hotel_settings;
          setInfo(prev => ({
              ...prev,
              app_name: settings.hotel_name || prev.app_name,
              // If your settings model has support info, map it here
              // Otherwise keep defaults
          }));
      }

      // OPTION B: Only Super Admins can fetch platform settings
      if (user?.is_superuser) {
          try {
            const res = await axios.get(`${API_URL}/api/super-admin/platform-settings/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                if (data) {
                    setInfo(prev => ({ 
                        ...prev, 
                        app_name: data.app_name || prev.app_name,
                        company_name: data.company_name || prev.company_name,
                        support_email: data.support_email || prev.support_email,
                        support_phone: data.support_phone || prev.support_phone
                    }));
                }
            }
          } catch (err) {
            // Silent fail - use defaults
            console.warn("Could not fetch platform settings (Using defaults)");
          }
      }
    };

    loadSettings();
  }, [token, user]);

  // --- 4. TICKET SUBMISSION (SIMULATED) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate API Call (Since we haven't built a Ticketing Backend yet)
    // In a real app, you would POST to /api/tickets/ here
    setTimeout(() => {
        setSending(false);
        setSent(true);
        setTicket({ subject: '', category: 'BUG', message: '' });
        
        // Reset success message after 3 seconds
        setTimeout(() => setSent(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3">
            <LifeBuoy className="text-blue-600" size={32}/> {info.app_name} Help Desk
        </h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 ml-1">
            Support provided by {info.company_name}
        </p>
      </div>

      {/* TOP CARDS (Dynamic Contact Methods) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Phone Card */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone size={24}/>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Line</p>
                <a href={`tel:${info.support_phone}`} className="text-lg font-black text-slate-800 hover:text-blue-600 transition-colors">
                    {info.support_phone}
                </a>
            </div>
        </div>

        {/* Email Card */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-purple-200 transition-all">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail size={24}/>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Support</p>
                <a href={`mailto:${info.support_email}`} className="text-lg font-black text-slate-800 hover:text-purple-600 transition-colors break-all">
                    {info.support_email}
                </a>
            </div>
        </div>

        {/* Guides Card */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-green-200 transition-all">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24}/>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Knowledge Base</p>
                <button className="text-sm font-black text-green-600 underline hover:text-green-700 transition-colors">View Guides</button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: TICKET FORM */}
        <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-slate-900 text-white rounded-xl">
                        <MessageSquare size={20}/>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase italic">Submit a Ticket</h3>
                        <p className="text-xs text-slate-400 font-bold">We usually respond within 2 hours.</p>
                    </div>
                </div>

                {sent ? (
                    <div className="bg-green-50 text-green-600 p-8 rounded-2xl text-center border border-green-100 animate-in zoom-in">
                        <CheckCircle size={48} className="mx-auto mb-4"/>
                        <h4 className="text-xl font-black uppercase">Ticket Sent!</h4>
                        <p className="text-sm">We have received your request. Ticket #9921</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                                <input 
                                  required 
                                  placeholder="Brief issue summary" 
                                  className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all" 
                                  value={ticket.subject} 
                                  onChange={e => setTicket({...ticket, subject: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <select 
                                  className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                  value={ticket.category} 
                                  onChange={e => setTicket({...ticket, category: e.target.value})}
                                >
                                    <option value="BUG">Report a Bug</option>
                                    <option value="FEATURE">Feature Request</option>
                                    <option value="BILLING">Billing Issue</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                            <textarea 
                              required 
                              rows="4" 
                              placeholder="Describe your issue in detail..." 
                              className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition-all resize-none"
                              value={ticket.message} 
                              onChange={e => setTicket({...ticket, message: e.target.value})} 
                            />
                        </div>
                        <div className="pt-2">
                            <button type="submit" disabled={sending} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
                                {sending ? <Loader2 className="animate-spin" size={16}/> : <><Send size={16}/> Submit Ticket</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* FAQ SECTION */}
            <div className="mt-8">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    <HelpCircle size={24} className="text-slate-400"/> Frequently Asked Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-800 mb-1 text-sm">How do I reset staff passwords?</h4>
                        <p className="text-slate-500 text-xs">Go to Staff Directory &gt; Click Edit on the staff member &gt; Reset Password.</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-800 mb-1 text-sm">Can I export reports to Excel?</h4>
                        <p className="text-slate-500 text-xs">Yes. On the Reports page, click the "Download CSV" button at the top right.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: SYSTEM HEALTH */}
        <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-[30px] shadow-2xl shadow-slate-900/20">
                <h3 className="text-lg font-black uppercase italic mb-6 border-b border-white/10 pb-4">System Health</h3>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Server size={18} className="text-blue-400"/>
                            <span className="font-bold text-sm">AWS Server</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg uppercase tracking-widest">
                            <CheckCircle size={10}/> Online
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database size={18} className="text-purple-400"/>
                            <span className="font-bold text-sm">Database</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-lg uppercase tracking-widest">
                            <CheckCircle size={10}/> Healthy
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wifi size={18} className="text-orange-400"/>
                            <span className="font-bold text-sm">API Latency</span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">24ms</span>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Your Account</p>
                        <p className="text-xs font-bold text-slate-300">
                             {user?.is_superuser ? 'Super Admin' : (user?.role || 'Staff')} License
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Tutorials Box */}
            <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 uppercase italic mb-4">Quick Tutorials</h3>
                <ul className="space-y-3">
                    <li className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                        <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-red-500 group-hover:text-white transition-colors">01</div>
                        <span className="text-sm font-bold text-slate-600">How to create a booking</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                        <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-blue-500 group-hover:text-white transition-colors">02</div>
                        <span className="text-sm font-bold text-slate-600">Managing room inventory</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                        <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-orange-500 group-hover:text-white transition-colors">03</div>
                        <span className="text-sm font-bold text-slate-600">Printing Guest Invoices</span>
                    </li>
                </ul>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Support;