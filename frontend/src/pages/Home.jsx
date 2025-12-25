import { Link } from 'react-router-dom';
import { 
  Building2, CheckCircle, ArrowRight, ShieldCheck, 
  BarChart3, Users, CreditCard, Star, MessageSquare, 
  Smartphone, Globe, Zap, Layout
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 🟢 NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">A</div>
            <span className="text-xl font-black tracking-tighter italic">ATITHI ENTERPRISE</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest hidden md:block">Login</Link>
            <Link to="/register" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-white/10 flex items-center gap-2">
              Get Started <ArrowRight size={14}/>
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
            Manage bookings, <span className="text-white">WhatsApp automation</span>, billing, and staff in one unified cloud platform. 
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
          
          {/* Dashboard Preview Image Placeholder */}
          <div className="mt-20 rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden relative group max-w-5xl mx-auto">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
             <div className="bg-slate-800 h-[300px] md:h-[500px] w-full flex items-center justify-center text-slate-600 font-black text-2xl uppercase tracking-widest">
                <div className="text-center">
                    <BarChart3 size={64} className="mx-auto mb-4 opacity-50 text-blue-500"/>
                    <p className="text-xs md:text-sm text-slate-500">Interactive Analytics Dashboard</p>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* 🟢 FEATURES GRID */}
      <section className="py-24 bg-slate-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tighter italic mb-4">Everything You Need</h2>
            <p className="text-slate-400">Replace 10 different tools with one cohesive system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Layout className="text-blue-400" size={32}/>}
              title="Smart Front Desk"
              desc="Fast check-ins, drag-and-drop calendar, and digital guest profiles. No more paper logbooks."
            />
            <FeatureCard 
              icon={<MessageSquare className="text-green-400" size={32}/>}
              title="WhatsApp Automation"
              desc="Send booking confirmations and invoices directly to guests' WhatsApp automatically."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-purple-400" size={32}/>}
              title="Owner Analytics"
              desc="Track revenue, occupancy, and expenses in real-time. Know your profit instantly."
            />
            <FeatureCard 
              icon={<CreditCard className="text-orange-400" size={32}/>}
              title="POS & Billing"
              desc="Integrated restaurant billing. Add charges to room folios and generate GST invoices."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-red-400" size={32}/>}
              title="Staff Security"
              desc="Granular access controls for Owners, Managers, and Receptionists."
            />
            <FeatureCard 
              icon={<Globe className="text-cyan-400" size={32}/>}
              title="Digital Folio"
              desc="Share live bill links with guests for a paperless and professional experience."
            />
          </div>
        </div>
      </section>

      {/* 🟢 PRICING SECTION */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black tracking-tighter italic mb-4">Simple Pricing</h2>
                <p className="text-slate-400">Start with a 14-day free trial. No credit card required.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* STARTER */}
                <div className="border border-white/10 p-8 rounded-[40px] bg-slate-900 hover:border-blue-500/50 transition-all">
                    <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-4">Starter</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-black text-white">₹999</span>
                        <span className="text-slate-500 font-bold">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 text-sm text-slate-300 font-medium">
                        {['10 Rooms', 'Basic Reports', 'Front Desk', 'Email Support'].map(i => (
                            <li key={i} className="flex gap-3"><CheckCircle size={16} className="text-blue-500"/> {i}</li>
                        ))}
                    </ul>
                    <Link to="/register" className="block w-full py-4 rounded-2xl border border-white/20 text-center font-black text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">Choose Starter</Link>
                </div>

                {/* PRO (Highlighted) */}
                <div className="p-8 rounded-[40px] bg-gradient-to-b from-blue-900 to-slate-900 border border-blue-500/50 shadow-2xl relative transform md:-translate-y-4">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-widest">Recommended</div>
                    <h3 className="text-lg font-black text-blue-400 uppercase tracking-widest mb-4">Professional</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-5xl font-black text-white">₹1999</span>
                        <span className="text-blue-200 font-bold">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 text-sm text-blue-100 font-medium">
                        {['Unlimited Rooms', 'WhatsApp Automation', 'Inventory Management', '5 Staff Accounts', 'Priority Support'].map(i => (
                            <li key={i} className="flex gap-3"><CheckCircle size={16} className="text-blue-400"/> {i}</li>
                        ))}
                    </ul>
                    <Link to="/register" className="block w-full py-4 rounded-2xl bg-blue-500 text-white text-center font-black text-xs uppercase tracking-widest hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/25">Start Free Trial</Link>
                </div>

                {/* ENTERPRISE */}
                <div className="border border-white/10 p-8 rounded-[40px] bg-slate-900 hover:border-purple-500/50 transition-all">
                    <h3 className="text-lg font-black text-purple-400 uppercase tracking-widest mb-4">Enterprise</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-black text-white">₹2999</span>
                        <span className="text-slate-500 font-bold">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 text-sm text-slate-300 font-medium">
                        {['Multi-Property', 'Dedicated Manager', 'API Access', 'Custom Branding', 'Unlimited Staff'].map(i => (
                            <li key={i} className="flex gap-3"><CheckCircle size={16} className="text-purple-500"/> {i}</li>
                        ))}
                    </ul>
                    <Link to="/register" className="block w-full py-4 rounded-2xl border border-white/20 text-center font-black text-xs uppercase tracking-widest hover:bg-purple-500 hover:border-purple-500 hover:text-white transition-all">Contact Sales</Link>
                </div>
            </div>
        </div>
      </section>

      {/* 🟢 FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <Building2 size={20}/>
            <span className="font-black italic tracking-tighter">ATITHI</span>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">
            &copy; 2025 Atithi SaaS Corp. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
};

// Helper Component for Feature Cards
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl hover:bg-slate-800 transition-colors group">
    <div className="mb-6 bg-slate-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-100">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm font-medium">{desc}</p>
  </div>
);

export default Home;