import { useEffect, useState } from 'react';
import { 
  HelpCircle, BookOpen, MessageSquare, PhoneCall, 
  ChevronDown, ExternalLink, ShieldCheck, Zap, 
  LifeBuoy, Mail, Clock, PlayCircle
} from 'lucide-react';
import { API_URL } from '../config';

const Support = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch Company Info from Admin Panel
  useEffect(() => {
    const fetchSupportInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/api/support-info/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        // Since the API returns a list, we take the first config object
        setInfo(data[0] || {}); 
      } catch (err) {
        console.error("Failed to load support info", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupportInfo();
  }, []);

  const guides = [
    { 
      title: "Front Desk Mastery", 
      desc: "Comprehensive guide on guest check-ins, GRC compliance, and room allocation logic.",
      color: "bg-blue-50 text-blue-600"
    },
    { 
      title: "Financial Ledger", 
      desc: "How to read the dynamic profit & loss dashboard and track operational expenses.",
      color: "bg-emerald-50 text-emerald-600"
    },
    { 
      title: "Housekeeping Loop", 
      desc: "Optimizing room turnover: managing dirty rooms and marking inventory as available.",
      color: "bg-orange-50 text-orange-600"
    }
  ];

  const faqs = [
    {
      q: "How do I fix a double-booking error?",
      a: "The system prevents overlaps automatically. If you see a conflict, ensure the existing booking check-out time is correctly processed."
    },
    {
      q: "Why isn't the confirmation email sending?",
      a: "Check the 'Settings' to ensure your SMTP credentials are active. Also, verify that the Guest profile has a valid email address."
    },
    {
      q: "Can I void a POS charge after checkout?",
      a: "Charges are locked once the Folio is finalized. To adjust, you must log an 'Expense' entry in the Accounting module."
    }
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-slate-400 font-bold uppercase tracking-widest">
      <LifeBuoy className="animate-spin mr-3"/> Connecting to Support...
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* 🏔️ HERO HEADER */}
      <div className="mb-12 text-center max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-6">
          <LifeBuoy size={16} className="animate-spin-slow"/>
          <span className="text-[10px] font-black uppercase tracking-widest">
            {info?.software_version || 'System v2.5'}
          </span>
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-4">
          Knowledge Center
        </h2>
        <p className="text-slate-500 font-medium text-lg">
          Empowering your hospitality team with real-time documentation and direct access to 
          <span className="font-bold text-slate-800"> {info?.company_name || 'Support Engineering'}</span>.
        </p>
      </div>

      {/* 📚 QUICK ACCESS GUIDES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {guides.map((g, i) => (
          <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
            <div className={`w-16 h-16 ${g.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner`}>
              <BookOpen size={28}/>
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight italic">{g.title}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{g.desc}</p>
            <button className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:gap-4 transition-all">
              Launch Guide <PlayCircle size={14}/>
            </button>
          </div>
        ))}
      </div>

      {/* ❓ INTERACTIVE FAQ SECTION */}
      <div className="max-w-4xl mx-auto mb-20 bg-white rounded-[48px] p-10 shadow-sm border border-slate-100">
        <h3 className="text-2xl font-black text-slate-900 mb-8 italic flex items-center gap-3 lowercase tracking-tighter">
            <Zap className="text-yellow-400" fill="currentColor"/> common system queries
        </h3>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-slate-50 last:border-0">
              <button 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex justify-between items-center py-6 text-left group"
              >
                <span className="font-black text-slate-700 group-hover:text-blue-600 transition-colors">{faq.q}</span>
                <ChevronDown size={20} className={`text-slate-300 transition-transform duration-500 ${activeFaq === i ? 'rotate-180' : ''}`}/>
              </button>
              <div className={`overflow-hidden transition-all duration-500 ${activeFaq === i ? 'max-h-40 mb-6' : 'max-h-0'}`}>
                <p className="text-slate-500 text-sm leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border-l-4 border-blue-500">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 CALL TO ACTION: DIRECT SUPPORT (Dynamic Data) */}
      <div className="bg-slate-950 p-12 rounded-[56px] text-white flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        
        <div className="relative z-10 text-center lg:text-left">
          <h3 className="text-4xl font-black italic tracking-tighter mb-4 leading-none uppercase">Technical Emergency?</h3>
          <p className="text-slate-400 font-bold max-w-lg leading-relaxed">
            Our enterprise engineers are on standby to resolve infrastructure or accounting discrepancies.
          </p>
          
          {/* Dynamic Address & Email */}
          <div className="mt-6 space-y-2">
             <div className="flex items-center gap-3 text-sm text-slate-300 font-medium justify-center lg:justify-start">
                <Mail size={16} className="text-blue-500"/> {info?.support_email || 'support@atithi.com'}
             </div>
             <div className="flex items-center gap-3 text-sm text-slate-300 font-medium justify-center lg:justify-start">
                <ShieldCheck size={16} className="text-emerald-500"/> {info?.address || 'Tech Park, India'}
             </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
          <a href={`mailto:${info?.support_email}`} className="flex-1 bg-white text-slate-900 px-10 py-5 rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-2xl cursor-pointer">
            <MessageSquare size={20}/> Email Support
          </a>
          <a href={`tel:${info?.support_phone}`} className="flex-1 bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 cursor-pointer">
            <PhoneCall size={20}/> {info?.support_phone || 'Contact Support'}
          </a>
        </div>
      </div>

      {/* FOOTER BADGE */}
      <div className="mt-12 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">
          Built with excellence by {info?.company_name || 'Atithi SaaS Corp'}
        </p>
      </div>
    </div>
  );
};

export default Support;