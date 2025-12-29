import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Star, Globe, TrendingUp } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-900 font-sans text-white overflow-hidden relative">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[150px] opacity-20 animate-pulse delay-1000"></div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl"><ShieldCheck size={24} className="text-white"/></div>
          <span className="text-xl font-black tracking-tighter italic uppercase">Atithi HMS</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-3 font-bold text-sm uppercase tracking-widest hover:text-blue-400 transition-colors">Login</Link>
          <Link to="/register" className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 flex flex-col items-center text-center">
        <span className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-sm">
          Enterprise Cloud Solution
        </span>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none mb-8 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
          The Future of <br/> Hospitality.
        </h1>
        <p className="text-slate-400 max-w-2xl text-lg mb-10 leading-relaxed">
          Manage your hotel operations, reservations, housekeeping, and finance from one powerful dashboard. Secure, Fast, and Reliable.
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
            <Link to="/register" className="px-10 py-5 bg-blue-600 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/50">
                Start Free Trial <ArrowRight size={20}/>
            </Link>
            <Link to="/login" className="px-10 py-5 bg-slate-800 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-3 border border-slate-700">
                Staff Login
            </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full">
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                <Globe size={32} className="text-blue-400 mb-4"/>
                <h3 className="text-xl font-black uppercase italic mb-2">Cloud Based</h3>
                <p className="text-slate-400 text-sm">Access your property data from anywhere in the world, on any device.</p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                <TrendingUp size={32} className="text-green-400 mb-4"/>
                <h3 className="text-xl font-black uppercase italic mb-2">Real-time Analytics</h3>
                <p className="text-slate-400 text-sm">Track revenue, occupancy, and expenses live as they happen.</p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                <Star size={32} className="text-purple-400 mb-4"/>
                <h3 className="text-xl font-black uppercase italic mb-2">5-Star Support</h3>
                <p className="text-slate-400 text-sm">Dedicated support team to help you run your operations smoothly.</p>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Home;