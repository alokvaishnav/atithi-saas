import { useState, useEffect } from 'react';
import { Lock, Key, CreditCard, LogOut } from 'lucide-react'; // 👈 Added LogOut icon
import { useNavigate, useLocation } from 'react-router-dom'; // 👈 Added useLocation
import { API_URL } from '../config';

const LicenseLock = ({ children }) => {
  const [status, setStatus] = useState(null);
  const [key, setKey] = useState('');
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Track current URL

  // 1. Check License Status
  const checkLicense = async () => {
    try {
        const res = await fetch(`${API_URL}/api/license/check/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // ✅ AUTO-LOGOUT on Bad Token (Fixes 401 loops)
        if (res.status === 401) {
            handleLogout();
            return;
        }

        const data = await res.json();
        setStatus(data);
    } catch (e) { 
        console.error("License Check Failed:", e); 
    }
  };

  useEffect(() => { 
      if (token) {
          checkLicense();
      } else {
          navigate('/login');
      }
  }, [token]);

  // Helper: Handle Logout
  const handleLogout = () => {
      localStorage.clear();
      window.location.href = '/login';
  };

  // 2. Handle Manual Key Activation
  const handleActivate = async () => {
      if (!key) {
          alert("Please enter a license key.");
          return;
      }
      
      try {
          const res = await fetch(`${API_URL}/api/license/activate/`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ license_key: key })
          });
          const data = await res.json();
          
          if(res.ok) {
              alert("✅ License Activated! Welcome Pro User. 🚀");
              window.location.reload(); 
          } else {
              alert(data.error || "Invalid License Key");
          }
      } catch (err) {
          console.error(err);
          alert("Activation Error.");
      }
  };

  // 3. Render Logic
  
  // ✅ BYPASS: Always render children if user is on the Pricing Page
  if (location.pathname === '/pricing') return children;

  // Loading State
  if (!status) return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 animate-pulse">
          Verifying License...
      </div>
  );

  // Active License? Render App
  if (status.is_active) return children;

  // 🔒 LOCK SCREEN (With Logout & Pricing Fixes)
  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 relative">
        
        {/* ✅ LOGOUT BUTTON (Escape Hatch) */}
        <button 
            onClick={handleLogout}
            className="absolute top-6 right-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
        >
            <LogOut size={18} /> Logout
        </button>

        <div className="bg-white p-10 rounded-[40px] max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>

            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                <Lock size={32}/>
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted</h1>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed text-sm">
                Your subscription has expired. Please upgrade your plan or enter a valid license key.
            </p>
            
            {/* Input Section */}
            <div className="relative mb-4 group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18}/>
                <input 
                    type="text" 
                    placeholder="Enter License Key" 
                    className="w-full pl-12 p-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 uppercase focus:border-blue-500 focus:outline-none transition-all placeholder:normal-case placeholder:font-medium"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                />
            </div>
            
            <div className="space-y-3">
                <button 
                    onClick={handleActivate} 
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                    Unlock System
                </button>

                <button 
                    onClick={() => navigate('/pricing')} 
                    className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                    <CreditCard size={16}/> View Subscription Plans
                </button>
            </div>

            <div className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Support ID: {status.user_id || 'Unknown'}
            </div>
        </div>
    </div>
  );
};

export default LicenseLock;