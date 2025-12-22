import { useState, useEffect } from 'react';
import { Lock, Key, CreditCard, LogOut, ShieldAlert } from 'lucide-react'; // 👈 Added Icons
import { useNavigate, useLocation } from 'react-router-dom'; // 👈 Added useLocation
import { API_URL } from '../config';

const LicenseLock = ({ children }) => {
  const [status, setStatus] = useState(null);
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('access_token');
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Track current URL to allow bypass

  // 1. Check License Status
  const checkLicense = async () => {
    try {
        const res = await fetch(`${API_URL}/api/license/check/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // ✅ AUTO-LOGOUT on Bad Token (Fixes 401 loops/White Screen)
        if (res.status === 401) {
            handleLogout();
            return;
        }

        const data = await res.json();
        setStatus(data);
    } catch (e) { 
        console.error("License Check Failed:", e); 
        // If API fails completely, assume locked to be safe, but allow logout
        setStatus({ is_active: false, error: true });
    }
  };

  useEffect(() => { 
      if (token) {
          checkLicense();
      } else {
          navigate('/login');
      }
  }, [token, navigate]);

  // Helper: Handle Logout (Escape Hatch)
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
      
      setLoading(true);
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
          alert("Activation Error. Check your connection.");
      } finally {
          setLoading(false);
      }
  };

  // 3. RENDER LOGIC
  
  // ✅ BYPASS: Always render children (App) if user is trying to go to the Pricing Page
  // This fixes the "View Subscription Plans" button not working.
  if (location.pathname === '/pricing') return children;

  // Loading State
  if (!status) return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-4">
          <div className="animate-pulse flex items-center gap-2">
             <ShieldAlert size={20}/> Verifying License...
          </div>
          {/* Safety Logout in case it gets stuck loading */}
          <button onClick={handleLogout} className="text-xs uppercase font-bold tracking-widest hover:text-white underline">
              Logout
          </button>
      </div>
  );

  // ✅ Active License? Render the App (children)
  if (status.is_active) return children;

  // 🔒 LOCK SCREEN (If Expired)
  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 relative">
        
        {/* ✅ LOGOUT BUTTON (Crucial Escape Hatch) */}
        <button 
            onClick={handleLogout}
            className="absolute top-6 right-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
        >
            <LogOut size={16}/> Logout
        </button>

        <div className="bg-white p-10 rounded-[40px] max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            {/* Top Bar Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>

            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                <Lock size={32}/>
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted</h1>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed text-sm">
                Your subscription has expired. Please upgrade your plan or enter a valid license key to continue using <span className="font-bold text-slate-700">Atithi Enterprise</span>.
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
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-70"
                >
                    {loading ? "Verifying..." : "Unlock System"}
                </button>

                {/* ✅ PRICING BUTTON (Now Works because of Bypass Logic above) */}
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