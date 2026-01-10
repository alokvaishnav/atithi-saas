import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Lock, User, ShieldCheck, AlertCircle, CheckCircle, Building2 } from 'lucide-react'; // 🟢 Added Building2 Icon
import { useAuth } from '../context/AuthContext'; 

const Login = () => {
  // 🟢 Updated State to include Hotel Code
  const [formData, setFormData] = useState({
    hotel_code: '',
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); 

  // 1️⃣ HANDLE SUCCESS MESSAGES (e.g. from Registration)
  useEffect(() => {
    if (location.state?.msg) {
        setSuccessMsg(location.state.msg);
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 2️⃣ CLEANUP: Clear stale session data
  useEffect(() => {
    const keysToRemove = [
        'access_token', 'refresh_token', 'user_data', 
        'user_role', 'username', 'hotel_name', 
        'user_id', 'is_superuser'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) return;

    setLoading(true);
    setError(null);

    try {
      // 🟢 Delegate API call to AuthContext (Now passes 3 args)
      const result = await login(formData.username, formData.password, formData.hotel_code);

      if (result.success) {
         // SMART NAVIGATION LOGIC
         const currentUser = result.user || JSON.parse(localStorage.getItem('user_data'));
         
         const role = currentUser?.role || 'UNKNOWN';
         const isSuper = currentUser?.is_superuser === true;

         console.log("🔍 Login Decision:", { username: currentUser?.username, role, isSuper });

         // 1. Hotel Owners & Staff -> Dashboard
         if (['OWNER', 'MANAGER', 'STAFF', 'RECEPTIONIST', 'HOUSEKEEPING', 'ACCOUNTANT'].includes(role)) {
             console.log("🏨 Redirecting to Hotel Dashboard...");
             navigate('/dashboard', { replace: true });
         }
         // 2. Super Admin -> Global HQ
         else if (isSuper || role === 'SUPER-ADMIN') {
             console.log("🚀 Redirecting to Super Admin HQ...");
             navigate('/super-admin/stats', { replace: true });
         } 
         // 3. Fallback
         else {
             console.log("⚠️ Unknown Role. Defaulting to Dashboard...");
             navigate('/dashboard', { replace: true });
         }

      } else {
         setError(result.msg || 'Login Failed. Please check your Hotel ID and credentials.');
      }

    } catch (err) {
      console.error('Login Critical Error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none"></div>
      
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border-4 border-slate-100 relative z-10 animate-in fade-in zoom-in duration-300">
        
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-3xl text-blue-600 shadow-inner ring-4 ring-blue-50/50">
            <ShieldCheck size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center text-slate-800 tracking-tighter italic uppercase mb-2">
          Atithi Enterprise
        </h1>
        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
          Secure Personnel Access
        </p>

        {/* Success Message Banner */}
        {successMsg && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-2">
                <CheckCircle size={18} className="shrink-0"/>
                {successMsg}
            </div>
        )}

        {/* Error Message Banner */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-2 shake">
                <AlertCircle size={18} className="shrink-0"/>
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* 🟢 NEW: HOTEL ID INPUT */}
          <div className="relative group">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              autoFocus
              type="text"
              name="hotel_code"
              placeholder="Hotel License ID (e.g. HTL-8842)"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-600 transition-all placeholder:font-medium placeholder:text-slate-400 focus:bg-white uppercase"
              value={formData.hotel_code}
              onChange={handleChange}
              // Not required strictly here because Super Admins might bypass it, handled in backend
            />
          </div>

          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Operator ID / Username"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-600 transition-all placeholder:font-medium placeholder:text-slate-400 focus:bg-white"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Access Key / Password"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-600 transition-all placeholder:font-medium placeholder:text-slate-400 focus:bg-white"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex justify-end">
            <Link 
              to="/forgot-password" 
              className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 text-xs flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : 'Authenticate System'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">New Property?</p>
            <Link to="/register" className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline hover:text-blue-800 transition-colors">
                Create Owner Account
            </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;