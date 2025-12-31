import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 
  const navigate = useNavigate();
  
  const { login } = useAuth(); 

  // 🧹 CLEANUP: Clear any stale session data when landing on Login
  // This prevents the "Ghost Identity" bug where old roles persist.
  useEffect(() => {
    const keysToRemove = [
        'access_token', 
        'refresh_token', 
        'user_role', 
        'username', 
        'hotel_name', 
        'user_id', 
        'is_superuser'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid Username or Password.');
        throw new Error('Login Failed. Please check your credentials.');
      }

      const data = await response.json();
      
      // The login function from AuthContext will now handle role parsing correctly
      await login(data);
      
      // Navigate to Dashboard
      navigate('/'); 

    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message || 'Network Error. Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-10 animate-pulse"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-10 animate-pulse delay-700"></div>
      
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border-4 border-slate-100 relative z-10">
        
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

        {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0"/>
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Operator ID / Username"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-600 transition-all placeholder:font-medium placeholder:text-slate-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="password"
              placeholder="Access Key / Password"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-600 transition-all placeholder:font-medium placeholder:text-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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