import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Building, User, Lock, Mail, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

const Register = () => {
  const [formData, setFormData] = useState({
    hotel_name: '', username: '', email: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/api/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            alert("Registration Successful! Please Login. 🚀");
            navigate('/login');
        } else {
            const err = await res.json();
            alert("Error: " + JSON.stringify(err));
        }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px] opacity-10 animate-pulse"></div>

      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 border-4 border-slate-100">
        <h2 className="text-3xl font-black text-center text-slate-800 tracking-tighter uppercase italic mb-2">Join Atithi</h2>
        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Create your Property Account</p>

        <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
                <Building className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                <input required placeholder="Hotel / Property Name" className="w-full pl-12 p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.hotel_name} onChange={e => setFormData({...formData, hotel_name: e.target.value})} />
            </div>
            
            <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                <input required placeholder="Username" className="w-full pl-12 p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>

            <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                <input required type="email" placeholder="Email Address" className="w-full pl-12 p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                <input required type="password" placeholder="Create Password" className="w-full pl-12 p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 mt-4">
                {loading ? <Loader2 className="animate-spin"/> : <>Create Account <ArrowRight size={18}/></>}
            </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Already have an account?</p>
            <Link to="/login" className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline">Login Here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;