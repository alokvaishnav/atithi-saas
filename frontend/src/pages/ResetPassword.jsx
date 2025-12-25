import { useState } from 'react';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/password-reset-confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uidb64: uid, token, password })
      });

      if(res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError('❌ Invalid or expired token.');
      }
    } catch (err) {
      setError('❌ Connection error.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[40px] text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40}/>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Password Updated!</h2>
        <p className="text-slate-500 mb-6">Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Set New Password</h1>
        <p className="text-slate-500 mb-8">Create a strong password for your account.</p>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 font-bold text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="password" 
              required
              placeholder="New Password (min 6 chars)"
              minLength={6}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none font-bold text-slate-800 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;