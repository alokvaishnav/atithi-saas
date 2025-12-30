import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, ArrowRight, Star, Globe, TrendingUp, 
  Menu, X, Check, Zap, Layout, CreditCard, Users, 
  Twitter, Linkedin, Instagram, ChevronDown 
} from 'lucide-react';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-white overflow-hidden relative selection:bg-blue-500 selection:text-white">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[150px] opacity-20 animate-pulse delay-1000 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-emerald-500 rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20"><ShieldCheck size={24} className="text-white"/></div>
                <span className="text-xl font-black tracking-tighter italic uppercase">Atithi HMS</span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex gap-4">
                <Link to="/login" className="px-6 py-2.5 font-bold text-xs uppercase tracking-widest text-white hover:text-blue-400 transition-colors">Login</Link>
                <Link to="/register" className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200">Get Started</Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-slate-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
            </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
            <div className="md:hidden bg-slate-900 border-b border-white/10 p-6 space-y-4 animate-in slide-in-from-top-10">
                <a href="#features" className="block text-sm font-bold uppercase text-slate-400">Features</a>
                <a href="#pricing" className="block text-sm font-bold uppercase text-slate-400">Pricing</a>
                <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                    <Link to="/login" className="w-full py-3 text-center border border-slate-700 rounded-xl font-bold uppercase text-xs">Login</Link>
                    <Link to="/register" className="w-full py-3 text-center bg-blue-600 rounded-xl font-bold uppercase text-xs">Sign Up Free</Link>
                </div>
            </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in zoom-in duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Enterprise Cloud Solution v2.0
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none mb-8 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent animate-in slide-in-from-bottom-8 duration-700">
          The Future of <br/> Hospitality.
        </h1>
        
        <p className="text-slate-400 max-w-2xl text-lg mb-10 leading-relaxed font-medium animate-in slide-in-from-bottom-8 duration-700 delay-100">
          Streamline operations, boost revenue, and delight guests. The all-in-one Property Management System built for modern hotels.
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 w-full justify-center mb-20 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            <Link to="/register" className="px-10 py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/50 hover:scale-105 group">
                Start Free Trial <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link to="/login" className="px-10 py-5 bg-white/5 backdrop-blur-sm rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/10">
                Live Demo
            </Link>
        </div>

        {/* Dashboard Mockup */}
        <div className="w-full max-w-5xl rounded-[30px] border border-white/10 bg-slate-800/50 backdrop-blur-xl shadow-2xl p-2 md:p-4 animate-in slide-in-from-bottom-20 duration-1000 delay-300">
            <div className="bg-slate-900 rounded-[20px] overflow-hidden border border-white/5 aspect-video relative flex items-center justify-center group">
                 {/* Fake UI Elements */}
                 <div className="absolute top-0 left-0 w-64 bottom-0 border-r border-white/5 bg-slate-900/50 p-6 hidden md:block">
                     <div className="w-8 h-8 bg-blue-600 rounded-lg mb-8"></div>
                     <div className="space-y-4">
                        {[1,2,3,4,5].map(i => <div key={i} className="h-4 w-3/4 bg-white/10 rounded"></div>)}
                     </div>
                 </div>
                 <div className="text-center">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Interactive Dashboard</p>
                    <h3 className="text-3xl font-black italic text-white/20 uppercase">System Preview</h3>
                 </div>
                 {/* Hover Overlay */}
                 <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link to="/register" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs">Access Now</Link>
                 </div>
            </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="border-y border-white/5 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
             {[
                { label: "Hotels Managed", val: "500+" },
                { label: "Bookings Processed", val: "1M+" },
                { label: "Uptime SLA", val: "99.9%" },
                { label: "Support", val: "24/7" }
             ].map((stat, i) => (
                 <div key={i}>
                     <h3 className="text-3xl md:text-4xl font-black text-white mb-1">{stat.val}</h3>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                 </div>
             ))}
          </div>
      </div>

      {/* FEATURES SECTION */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
            <h2 className="text-4xl font-black uppercase italic mb-4">Everything you need</h2>
            <p className="text-slate-400">A complete operating system for your property.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Layout size={28}/>
                </div>
                <h3 className="text-xl font-black uppercase italic mb-3">Front Desk</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Fast check-ins, drag-and-drop calendar, and instant guest profiles. Managing bookings has never been easier.</p>
            </div>
            
            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp size={28}/>
                </div>
                <h3 className="text-xl font-black uppercase italic mb-3">Revenue Mgmt</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Dynamic pricing tools and deep analytics to maximize your RevPAR and occupancy rates.</p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap size={28}/>
                </div>
                <h3 className="text-xl font-black uppercase italic mb-3">Housekeeping</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Live room status updates for your staff. Mark rooms dirty, clean, or maintenance in one click.</p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CreditCard size={28}/>
                </div>
                <h3 className="text-xl font-black uppercase italic mb-3">Billing & POS</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Generate digital invoices, manage restaurant orders, and track payments seamlessly.</p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users size={28}/>
                </div>
                <h3 className="text-xl font-black uppercase italic mb-3">Staff Mgmt</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Role-based access control (RBAC). Assign permissions for reception, housekeeping, and managers.</p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-colors group">
                <div className="w-14 h-14 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Globe size={28}/>
                </div>
                <h3 className="text-xl font-black uppercase italic mb-3">Cloud Sync</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Your data is backed up instantly. Access your property from any device, anywhere.</p>
            </div>
        </div>
      </div>

      {/* PRICING SECTION */}
      <div id="pricing" className="bg-slate-900 border-t border-white/5 py-32 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-black uppercase italic mb-4">Simple Pricing</h2>
                <p className="text-slate-400">No hidden fees. Cancel anytime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Starter */}
                <div className="p-8 rounded-[32px] border border-white/10 bg-slate-800/50 backdrop-blur-sm hover:border-white/20 transition-all">
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">Starter</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-black">Free</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                        {['Up to 10 Rooms', 'Basic Reporting', '1 User Account', 'Email Support'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                <Check size={16} className="text-blue-500"/> {item}
                            </li>
                        ))}
                    </ul>
                    <Link to="/register" className="block w-full py-4 text-center rounded-xl border border-white/10 font-bold uppercase text-xs hover:bg-white hover:text-slate-900 transition-all">Start Free</Link>
                </div>

                {/* Pro */}
                <div className="p-8 rounded-[32px] border-2 border-blue-500 bg-slate-800/80 backdrop-blur-sm transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
                    <div className="inline-block px-3 py-1 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">Most Popular</div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4">Professional</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-black">₹1999</span>
                        <span className="text-slate-400 text-sm">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                        {['Unlimited Rooms', 'Advanced Analytics', '5 User Accounts', 'POS & Billing', 'Priority Support'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-white">
                                <Check size={16} className="text-blue-400"/> {item}
                            </li>
                        ))}
                    </ul>
                    <Link to="/register" className="block w-full py-4 text-center rounded-xl bg-blue-600 font-bold uppercase text-xs hover:bg-blue-500 transition-all shadow-lg">Get Started</Link>
                </div>

                {/* Enterprise */}
                <div className="p-8 rounded-[32px] border border-white/10 bg-slate-800/50 backdrop-blur-sm hover:border-white/20 transition-all">
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">Enterprise</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-black">Custom</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                        {['Multi-Property', 'API Access', 'Dedicated Manager', 'Custom Training', 'SLA Guarantee'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                <Check size={16} className="text-blue-500"/> {item}
                            </li>
                        ))}
                    </ul>
                    <a href="mailto:sales@atithi.com" className="block w-full py-4 text-center rounded-xl border border-white/10 font-bold uppercase text-xs hover:bg-white hover:text-slate-900 transition-all">Contact Sales</a>
                </div>
            </div>
          </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase italic mb-2">Trusted by Managers</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { name: "Rahul Sharma", role: "GM, Grand Palace", text: "Atithi changed how we operate. Check-ins are 50% faster." },
                { name: "Priya Patel", role: "Owner, Seaside Resort", text: "The revenue reports are incredible. I can finally see where my money is going." },
                { name: "Vikram Singh", role: "Ops Head, Urban Stays", text: "Best support team ever. They helped us set up everything in one day." }
            ].map((t, i) => (
                <div key={i} className="p-8 bg-white/5 rounded-3xl border border-white/5">
                    <div className="flex gap-1 text-yellow-500 mb-4">
                        {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor"/>)}
                    </div>
                    <p className="text-slate-300 italic mb-6">"{t.text}"</p>
                    <div>
                        <p className="font-bold text-white">{t.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{t.role}</p>
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="max-w-3xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-black uppercase italic mb-10 text-center">Common Questions</h2>
        <div className="space-y-4">
            {[
                { q: "Is my data secure?", a: "Yes. We use 256-bit encryption and daily cloud backups to ensure your data is always safe." },
                { q: "Can I upgrade later?", a: "Absolutely. You can switch plans at any time from your dashboard settings." },
                { q: "Do you offer training?", a: "Yes, we provide free video tutorials and documentation. Enterprise plans get live training sessions." }
            ].map((item, i) => (
                <div key={i} className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden">
                    <button onClick={() => toggleFaq(i)} className="w-full flex justify-between items-center p-6 text-left hover:bg-white/5 transition-colors">
                        <span className="font-bold text-sm uppercase tracking-wide">{item.q}</span>
                        <ChevronDown size={20} className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`}/>
                    </button>
                    {openFaq === i && (
                        <div className="p-6 pt-0 text-slate-400 text-sm leading-relaxed border-t border-white/5 mt-2">
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-white/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <ShieldCheck size={20} className="text-blue-500"/>
                        <span className="font-black italic uppercase">Atithi HMS</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                        Empowering hoteliers with modern technology. Built for speed, reliability, and growth.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-6">Product</h4>
                    <ul className="space-y-4 text-xs text-slate-400 font-medium">
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">API</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Integrations</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-6">Company</h4>
                    <ul className="space-y-4 text-xs text-slate-400 font-medium">
                        <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-white uppercase tracking-widest text-xs mb-6">Connect</h4>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><Twitter size={16}/></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><Linkedin size={16}/></a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><Instagram size={16}/></a>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">© 2024 Atithi HMS. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:text-slate-400">Privacy</a>
                    <a href="#" className="text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:text-slate-400">Terms</a>
                </div>
            </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;