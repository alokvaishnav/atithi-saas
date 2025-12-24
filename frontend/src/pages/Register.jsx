import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Building2, Loader2, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; // 👈 Import the Brain

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', 
    email: '', 
    password: '', 
    phone: '', 
    hotel_name: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // 🧠 Use Context Login function
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        // ✅ CRITICAL FIX: Preserve Old Logic
        // In the old code, you forced the role to be 'OWNER'. 
        // We must ensure the Context receives this role.
        const authData = {
            ...data,
            user_role: 'OWNER', // 👈 Forced Owner Role
            hotel_name: formData.hotel_name // Ensure Hotel Name is passed
        };

        // 🧠 Update Global State Instantly
        login(authData); 
        
        // 🚀 Redirect to the Home/Dashboard
        navigate('/'); 
      } else {
        // ❌ Handle Validation Errors gracefully
        let errorMsg = "Registration failed.";
        
        if (data.detail) errorMsg = data.detail; // Catch generic backend errors
        else if (data.username) errorMsg = `Username: ${data.username[0]}`;
        else if (data.email) errorMsg = `Email: ${data.email[0]}`;
        else if (data.password) errorMsg = `Password: ${data.password[0]}`;
        
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Network Error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-[100px] opacity-20"></div>

      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border-4 border-slate-100 relative z-10">
        
        <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Get Started</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Start your 14-Day Enterprise Trial</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input icon={<User size={18}/>} name="username" placeholder="Username" val={formData.username} set={setFormData} full={formData}/>
          <Input icon={<Mail size={18}/>} type="email" name="email" placeholder="Email Address" val={formData.email} set={setFormData} full={formData}/>
          <Input icon={<Lock size={18}/>} type="password" name="password" placeholder="Password" val={formData.password} set={setFormData} full={formData}/>
          <Input icon={<Phone size={18}/>} name="phone" placeholder="Phone Number" val={formData.phone} set={setFormData} full={formData}/>
          <Input icon={<Building2 size={18}/>} name="hotel_name" placeholder="Property Name (e.g. Grand Hotel)" val={formData.hotel_name} set={setFormData} full={formData}/>

          <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 mt-4">
            <CheckCircle className="text-blue-600 shrink-0" size={16} />
            <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                By creating an account, you get full access to the PMS, Point of Sale, and Housekeeping modules for 14 days. No credit card required.
            </p>
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-slate-900 hover:bg-blue-600 active:scale-95 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all mt-6 flex justify-center items-center gap-2 shadow-xl shadow-slate-200 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors">Login Here</Link>
        </p>
      </div>
    </div>
  );
};

// Reusable Input Component
const Input = ({ icon, type="text", name, placeholder, val, set, full }) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">{icon}</div>
    <input 
      required 
      type={type}
      name={name} // 👈 Added this missing attribute for browser autofill/accessibility
      placeholder={placeholder} 
      value={val}
      onChange={e => set({...full, [name]: e.target.value})}
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all text-sm placeholder:font-medium placeholder:text-slate-400 placeholder:normal-case"
    />
  </div>
);

export default Register;