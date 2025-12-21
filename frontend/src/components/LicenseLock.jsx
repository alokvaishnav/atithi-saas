import { useState, useEffect } from 'react';
import { Lock, Key, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config';

const LicenseLock = ({ children }) => {
  const [status, setStatus] = useState(null);
  const [key, setKey] = useState('');
  const token = localStorage.getItem('access_token');

  const checkLicense = async () => {
    try {
        const res = await fetch(`${API_URL}/api/license/check/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setStatus(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if(token) checkLicense(); }, [token]);

  const handleActivate = async () => {
      const res = await fetch(`${API_URL}/api/license/activate/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ license_key: key })
      });
      const data = await res.json();
      if(res.ok) {
          alert("License Activated! Welcome Pro User. 🚀");
          window.location.reload();
      } else {
          alert("Invalid Key");
      }
  };

  // If loading or Valid, show App
  if (!status || status.is_active) return children;

  // Otherwise, Lock Screen
  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Lock size={40}/>
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">License Expired</h1>
            <p className="text-slate-500 mb-8">Your subscription has ended. Please enter a valid license key to continue using Atithi Enterprise.</p>
            
            <div className="relative mb-4">
                <Key className="absolute left-4 top-3.5 text-slate-400" size={20}/>
                <input 
                    type="text" 
                    placeholder="Enter License Key (e.g. ATITHI-PRO-365)" 
                    className="w-full pl-12 p-4 border-2 border-slate-200 rounded-xl font-bold uppercase"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                />
            </div>
            <button onClick={handleActivate} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                Unlock System
            </button>
        </div>
    </div>
  );
};

export default LicenseLock;