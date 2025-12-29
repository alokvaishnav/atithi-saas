import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/api/password_reset/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (res.ok) {
            setMessage("If an account exists, a reset link has been sent to your email.");
        } else {
            setMessage("Error sending reset link. Please try again.");
        }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-[30px] shadow-xl w-full max-w-md border border-slate-100">
            <Link to="/login" className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 hover:text-slate-600">
                <ArrowLeft size={14}/> Back to Login
            </Link>
            
            <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Reset Password</h2>
            <p className="text-slate-400 text-sm mb-6">Enter your registered email to receive recovery instructions.</p>

            {message && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                    <input required type="email" placeholder="Enter Email Address" 
                        className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : "Send Reset Link"}
                </button>
            </form>
        </div>
    </div>
  );
};

export default ForgotPassword;