import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Lock, Loader2, Eye, EyeOff, CheckCircle, 
  AlertCircle, ShieldCheck, ArrowRight
} from 'lucide-react';
import { API_URL } from '../config';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  // Password Strength Logic
  useEffect(() => {
    const pwd = formData.password;
    let score = 0;
    if (pwd.length > 5) score++; // Length > 5
    if (pwd.length > 8) score++; // Length > 8
    if (/[A-Z]/.test(pwd)) score++; // Has Uppercase
    if (/[0-9]/.test(pwd)) score++; // Has Number
    if (/[^A-Za-z0-9]/.test(pwd)) score++; // Has Symbol
    setStrength(score);
  }, [formData.password]);

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ ...status, error: null });

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
        setStatus({ ...status, error: "Passwords do not match." });
        return;
    }
    if (strength < 2) {
        setStatus({ ...status, error: "Password is too weak. Please add numbers or symbols." });
        return;
    }

    setStatus({ ...status, loading: true });

    try {
        const res = await fetch(`${API_URL}/api/password_reset/confirm/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                uid, 
                token, 
                new_password: formData.password 
            })
        });

        if (res.ok) {
            setStatus({ loading: false, error: null, success: true });
            // Auto-redirect after 3 seconds
            setTimeout(() => navigate('/login'), 3000);
        } else {
            setStatus({ loading: false, error: "Link expired or invalid. Please request a new one.", success: false });
        }
    } catch (err) { 
        console.error(err); 
        setStatus({ loading: false, error: "Network error occurred. Please try again.", success: false });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 font-sans relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-[80px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-100 rounded-full blur-[80px] opacity-60"></div>

        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-300">
            
            {status.success ? (
                /* SUCCESS STATE VIEW */
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Password Updated!</h2>
                    <p className="text-slate-400 text-sm font-medium mb-8">
                        Your account is now secure. Redirecting you to login...
                    </p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                        Login Now <ArrowRight size={16}/>
                    </button>
                </div>
            ) : (
                /* FORM STATE VIEW */
                <div>
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 ring-4 ring-blue-50/50">
                            <ShieldCheck size={32}/>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-center text-slate-800 uppercase italic mb-2">Set New Password</h2>
                    <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Secure your account</p>

                    {status.error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-pulse">
                            <AlertCircle size={16}/> {status.error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Password Field */}
                        <div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                <input 
                                    required 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="New Password" 
                                    className="w-full pl-12 pr-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-300"
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                            
                            {/* Strength Meter */}
                            {formData.password && (
                                <div className="flex gap-1 mt-2 px-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i < strength ? getStrengthColor() : 'bg-slate-200'}`}></div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                            <input 
                                required 
                                type="password" 
                                placeholder="Confirm Password" 
                                className={`w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 transition-all text-slate-800 placeholder:text-slate-300 ${
                                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                                    ? 'focus:ring-red-500 border-red-200' 
                                    : 'focus:ring-blue-500'
                                }`}
                                value={formData.confirmPassword} 
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={status.loading} 
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {status.loading ? <Loader2 className="animate-spin" size={16}/> : "Update Password"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    </div>
  );
};

export default ResetPassword;