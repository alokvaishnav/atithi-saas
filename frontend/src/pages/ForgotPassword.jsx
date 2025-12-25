import { useState } from 'react';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    
    try {
      const res = await fetch(`${API_URL}/api/password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if(res.ok) {
        setMsg('✅ Check your inbox! A reset link has been sent.');
      } else {
        setMsg('❌ ' + (data.email?.[0] || 'Error sending email.'));
      }
    } catch (err) {
      setMsg('❌ Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl w-full max-w-md">
        <button onClick={() => navigate('/login')} className="flex items-center text-slate-400 hover:text-blue-600 mb-6 text-sm font-bold uppercase tracking-widest transition-colors"><ArrowLeft size={16} className="mr-2"/> Back to Login</button>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Reset Password</h1>
        <p className="text-slate-500 mb-8">Enter your registered email address.</p>

        {msg && <div className={`p-4 mb-6 rounded-2xl text-sm font-bold ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="email" 
              required
              placeholder="admin@hotel.com"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-slate-800 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Send Link <ArrowRight size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;