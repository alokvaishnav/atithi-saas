import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/api/password_reset/confirm/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, token, new_password: password })
        });
        if (res.ok) {
            alert("Password Reset Successful! Please Login.");
            navigate('/login');
        } else {
            alert("Invalid or Expired Link.");
        }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-[30px] shadow-xl w-full max-w-md border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 uppercase italic mb-6">New Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                    <input required type="password" placeholder="Enter New Password" 
                        className="w-full pl-12 p-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-green-600 transition-all">
                    {loading ? <Loader2 className="animate-spin mx-auto"/> : "Update Password"}
                </button>
            </form>
        </div>
    </div>
  );
};

export default ResetPassword;