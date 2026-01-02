import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Loader2, ArrowLeft, KeyRound, 
  CheckCircle, AlertCircle, Timer, HelpCircle, Phone,
  Plus, Trash 
} from 'lucide-react';
import { API_URL } from '../config';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [message, setMessage] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Handle Countdown Timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);
    setStatus('idle');

    try {
        const res = await fetch(`${API_URL}/api/password_reset/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        // We generally show success even if email doesn't exist for security (to prevent enumeration)
        // But if your API returns specific errors, handle them here.
        if (res.ok) {
            setStatus('success');
            setCooldown(60); // Start 60s cooldown
        } else {
            setStatus('error');
            setMessage("Unable to process request. Please try again later.");
        }
    } catch (err) { 
        console.error(err);
        setStatus('error');
        setMessage("Network error. Please check your connection.");
    } finally { 
        setLoading(false); 
    }
  };

  const handleRetry = () => {
      setStatus('idle');
      setEmail('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 font-sans relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-100 rounded-full blur-[100px] opacity-50"></div>

        <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100 relative z-10">
            
            {/* Navigation */}
            <Link to="/login" className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8 hover:text-slate-800 transition-colors group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Back to Login
            </Link>
            
            {/* Header Icon */}
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <KeyRound size={32} className="text-blue-600"/>
            </div>

            {/* CONDITIONAL UI: SUCCESS STATE */}
            {status === 'success' ? (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <CheckCircle size={20}/>
                        <span className="text-xs font-black uppercase tracking-widest">Email Sent</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase italic mb-4">Check Inbox</h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        We have sent password recovery instructions to <span className="font-bold text-slate-800">{email}</span>.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-2"><Timer size={14}/> Resend available in</span>
                            <span className="text-blue-600 font-black">{cooldown}s</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-blue-600 h-full transition-all duration-1000 ease-linear" 
                                style={{ width: `${(cooldown / 60) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleSubmit} 
                            disabled={cooldown > 0 || loading}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16}/> : "Resend Email"}
                        </button>
                        <button 
                            onClick={handleRetry}
                            className="w-full py-3 bg-white text-slate-400 border border-slate-200 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 hover:text-slate-600 transition-all"
                        >
                            Entered wrong email?
                        </button>
                    </div>
                </div>
            ) : (
                /* CONDITIONAL UI: FORM STATE */
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Reset Password</h2>
                    <p className="text-slate-400 text-sm mb-8">Enter your registered email address and we'll send you a link to reset your password.</p>

                    {status === 'error' && (
                        <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                            <AlertCircle size={16}/> {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                <input 
                                    required 
                                    type="email" 
                                    placeholder="name@company.com" 
                                    className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-200 transition-all"
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading || !email} 
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16}/> : "Send Reset Link"}
                        </button>
                    </form>

                    {/* Support Section */}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-start gap-3">
                            <HelpCircle size={18} className="text-slate-300 mt-0.5"/>
                            <div>
                                <p className="text-xs font-bold text-slate-800 mb-1">Having trouble?</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    If you don't receive an email within 5 minutes, check your spam folder or contact <a href="tel:+919876543210" className="text-blue-500 hover:underline">Support</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default ForgotPassword;