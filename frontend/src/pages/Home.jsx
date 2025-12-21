import { Link } from 'react-router-dom';
import { 
  Building2, CheckCircle, ArrowRight, ShieldCheck, 
  BarChart3, Users, CreditCard, Star 
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 🟢 NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">A</div>
            <span className="text-xl font-black tracking-tighter italic">ATITHI ENTERPRISE</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">LOGIN</Link>
            <Link to="/register" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-white/10">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 🟢 HERO SECTION */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Star size={12} fill="currentColor" /> v2.5 Enterprise Edition Live
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic mb-8 leading-[0.9]">
            The Operating System <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              For Modern Hotels
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Manage bookings, housekeeping, billing, and staff in one unified cloud platform. 
            Built for speed, security, and scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 group">
              Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700">
              Live Demo
            </Link>
          </div>
          
          {/* Dashboard Preview Image */}
          <div className="mt-20 rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
             {/* Placeholder for a screenshot - using a CSS mock for now */}
             <div className="bg-slate-800 h-[400px] md:h-[600px] w-full flex items-center justify-center text-slate-600 font-black text-2xl uppercase tracking-widest">
                <div className="text-center">
                    <BarChart3 size={64} className="mx-auto mb-4 opacity-50"/>
                    Interactive Dashboard Preview
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* 🟢 FEATURES GRID */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tighter italic mb-4">Everything You Need</h2>
            <p className="text-slate-400">Replace 5 different tools with one cohesive system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="text-blue-400" size={32}/>}
              title="Smart Front Desk"
              desc="Fast check-ins, drag-and-drop calendar, and digital guest profiles. No more paper logbooks."
            />
            <FeatureCard 
              icon={<CreditCard className="text-green-400" size={32}/>}
              title="POS & Billing"
              desc="Integrated restaurant and service billing. Add charges to room folios instantly and generate GST invoices."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-purple-400" size={32}/>}
              title="Role-Based Security"
              desc="Granular access controls for Owners, Managers, and Staff. Keep your financial data secure."
            />
          </div>
        </div>
      </section>

      {/* 🟢 PRICING SECTION */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
           <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-[40px] p-12 md:p-24 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-6">Ready to Upgrade?</h2>
                <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
                  Join 500+ independent hotels using Atithi to streamline operations and boost revenue.
                </p>
                <Link to="/register" className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                  Get Started for Free
                </Link>
                <p className="mt-6 text-blue-200 text-xs font-bold uppercase tracking-widest opacity-70">
                  No Credit Card Required • 14-Day Trial
                </p>
              </div>
           </div>
        </div>
      </section>

      {/* 🟢 FOOTER */}
      <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm font-medium">
        <p>&copy; 2025 Atithi SaaS Corp. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl hover:bg-slate-800 transition-colors">
    <div className="mb-6 bg-slate-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default Home;