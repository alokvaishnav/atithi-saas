import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Loader2, Building, User, Lock, Mail, ArrowRight, 
  Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck,
  CreditCard, Copy 
} from 'lucide-react';
import { API_URL } from '../config';

const Register = () => {
  const [formData, setFormData] = useState({
    hotel_name: '', 
    first_name: '', 
    last_name: '', 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 🟢 Success State to show the Hotel ID Modal
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [newHotelId, setNewHotelId] = useState('');
  
  const navigate = useNavigate();

  // Password Strength Logic
  useEffect(() => {
    const pwd = formData.password;
    let score = 0;
    if (pwd.length > 5) score++;
    if (pwd.length > 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setPasswordStrength(score);
  }, [formData.password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 4) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend Validation
    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (!agreeTerms) {
        setError("You must agree to the Terms & Conditions.");
        return;
    }
    if (passwordStrength < 3) {
        setError("Password is too weak. Please use a stronger password.");
        return;
    }

    setLoading(true);
    try {
        // Prepare Payload
        const payload = {
            hotel_name: formData.hotel_name,
            first_name: formData.first_name,
            last_name: formData.last_name,
            username: formData.username,
            email: formData.email,
            password: formData.password
        };

        const res = await fetch(`${API_URL}/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            // 🟢 Success: Show Modal with Hotel ID instead of immediate redirect
            setNewHotelId(data.hotel_code || "HTL-XXXX"); // Fallback if backend doesn't send it yet
            setRegistrationSuccess(true);
        } else {
            // Error Handling: Extract first error message from Django DRF response
            const firstErrorKey = Object.keys(data)[0];
            const errorMessage = Array.isArray(data[firstErrorKey]) 
                ? data[firstErrorKey][0] 
                : data[firstErrorKey] || "Registration failed.";
            
            const displayError = firstErrorKey === 'error' || firstErrorKey === 'detail' 
                ? errorMessage 
                : `${firstErrorKey.charAt(0).toUpperCase() + firstErrorKey.slice(1)}: ${errorMessage}`;

            setError(displayError);
        }
    } catch (err) { 
        console.error(err);
        setError("Network error. Please check your connection.");
    } finally { 
        setLoading(false); 
    }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(newHotelId);
      alert("Hotel ID copied to clipboard!");
  };

  // 🟢 SUCCESS MODAL VIEW
  if (registrationSuccess) {
      return (
        <div className="flex min-h-screen bg-slate-900 items-center justify-center p-4 font-sans relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            
            <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center animate-in zoom-in duration-500 relative z-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-lg shadow-emerald-200">
                    <CheckCircle size={40} />
                </div>
                
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic mb-2">Success!</h2>
                <p className="text-slate-500 font-medium mb-8">Your hotel account has been created.</p>
                
                <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl mb-8">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Your Unique Hotel License ID</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-4xl font-black text-slate-800 tracking-tight">{newHotelId}</span>
                        <button onClick={copyToClipboard} className="p-2 hover:bg-blue-100 rounded-full text-blue-600 transition-colors">
                            <Copy size={20} />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold">⚠️ SAVE THIS ID. YOU NEED IT TO LOGIN.</p>
                </div>

                <button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                >
                    Go to Login
                </button>
            </div>
        </div>
      );
  }

  // 🟢 STANDARD REGISTRATION FORM
  return (
    <div className="flex min-h-screen bg-slate-900 items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px] opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 border-4 border-slate-100/10 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-4 text-blue-600 ring-4 ring-blue-50/50">
                <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Join Atithi</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Start managing your property today</p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-2 shake">
                <AlertCircle size={16}/> {error}
            </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Hotel Name */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Property Name</label>
                <div className="relative group">
                    <Building className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                    <input 
                        required 
                        autoFocus
                        placeholder="e.g. Grand Hotel" 
                        className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-300"
                        value={formData.hotel_name} 
                        onChange={e => setFormData({...formData, hotel_name: e.target.value})} 
                    />
                </div>
            </div>

            {/* Name Fields (First & Last) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">First Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                        <input required placeholder="John" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-300"
                            value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Last Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                        <input required placeholder="Doe" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-300"
                            value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                    </div>
                </div>
            </div>
            
            {/* Username & Email Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Username</label>
                    <div className="relative group">
                        <CreditCard className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                        <input required placeholder="admin_user" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-300"
                            value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                        <input required type="email" placeholder="name@hotel.com" className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-300"
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* Password */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                    <input 
                        required 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Create Password" 
                        className="w-full pl-12 pr-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-300"
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                </div>
                
                {/* Strength Meter */}
                {formData.password && (
                    <div className="flex gap-1 mt-2 px-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-500 ${i < passwordStrength ? getStrengthColor() : 'bg-slate-200'}`}></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Confirm Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                    <input 
                        required 
                        type="password" 
                        placeholder="Repeat Password" 
                        className={`w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 transition-all text-slate-800 placeholder:text-slate-300 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'focus:ring-red-500 border-red-200' : 'focus:ring-blue-500'}`}
                        value={formData.confirmPassword} 
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                    />
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <CheckCircle className="absolute right-4 top-3.5 text-emerald-500 animate-in zoom-in" size={18}/>
                    )}
                </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-3 py-2 px-1">
                <input 
                    type="checkbox" 
                    id="terms" 
                    className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="text-xs font-bold text-slate-500 cursor-pointer select-none">
                    I agree to the <span className="text-slate-800 underline hover:text-blue-600">Terms of Service</span> & <span className="text-slate-800 underline hover:text-blue-600">Privacy Policy</span>
                </label>
            </div>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <>Create Account <ArrowRight size={18}/></>}
            </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Already have an account?</p>
            <Link to="/login" className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline hover:text-blue-800 transition-colors">Login Here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;