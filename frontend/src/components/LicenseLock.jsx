import { useEffect, useState } from 'react';
import { 
  Lock, Loader2, ShieldAlert, KeyRound, 
  AlertTriangle, RefreshCw, LogOut
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 

const LicenseLock = ({ children }) => {
  const [status, setStatus] = useState('LOADING'); // LOADING | ACTIVE | WARNING | EXPIRED
  const [daysLeft, setDaysLeft] = useState(0);
  const [inputKey, setInputKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  // 🔐 Use Context for live token updates
  const { token, logout } = useAuth(); 

  // 1. Verify License on Mount or Token Change
  useEffect(() => {
    // 🟢 SAFETY CHECK 1: Don't run if no token
    if (!token || token === 'null' || token === 'undefined') {
        setStatus('ACTIVE'); 
        return;
    }
    
    const checkLicense = async () => {
        try {
            const res = await fetch(`${API_URL}/api/license/status/`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // 🟢 NUCLEAR OPTION: If corrupted (400/401), kill session immediately
            if (res.status === 400 || res.status === 401) {
                console.error("🔥 Token corrupted (400). Performing emergency logout.");
                localStorage.clear(); // Wipe storage directly
                window.location.href = '/login'; // Hard redirect (bypasses React state)
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setDaysLeft(data.days_left);
                
                if (data.is_expired) {
                    setStatus('EXPIRED');
                } else if (data.days_left <= 7) {
                    setStatus('WARNING'); // Grace period
                } else {
                    setStatus('ACTIVE');
                }
            } else {
                // For 500 errors (Server Down), default to ACTIVE so you aren't locked out.
                console.warn("License check failed, defaulting to active.");
                setStatus('ACTIVE'); 
            }
        } catch (err) {
            console.error("License Check Error:", err);
            // Fail open for connectivity issues
            setStatus('ACTIVE'); 
        }
    };
    
    checkLicense();
  }, [token]); // Removed logout dependency to prevent re-run loops

  // 2. Handle New Key Submission
  const handleActivate = async (e) => {
    e.preventDefault();
    setActivating(true);
    setError('');

    try {
        const res = await fetch(`${API_URL}/api/license/activate/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ license_key: inputKey })
        });

        if (res.ok) {
            const data = await res.json();
            alert(`Activation Successful! Valid until: ${data.expiry_date}`);
            window.location.reload();
        } else {
            const errData = await res.json();
            setError(errData.error || "Invalid License Key. Please check and try again.");
        }
    } catch (err) {
        setError("Network error. Unable to verify key.");
    } finally {
        setActivating(false);
    }
  };

  // --- RENDER STATES ---

  // A. Loading Screen
  if (status === 'LOADING' && token && token !== 'null') return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="animate-spin text-blue-500" size={48}/>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Verifying System License...</p>
    </div>
  );

  // B. Locked Screen (Expired)
  if (status === 'EXPIRED') return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        
        {/* Background FX */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600 rounded-full blur-[150px] opacity-20"></div>

        <div className="bg-slate-800 p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-700 relative z-10 text-center">
            
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Lock size={40} className="text-red-500"/>
            </div>

            <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-2">System Locked</h1>
            <p className="text-slate-400 text-sm mb-8">Your subscription has expired. Please enter a valid renewal key to continue.</p>

            <form onSubmit={handleActivate} className="space-y-4">
                <div className="relative">
                    <KeyRound className="absolute left-4 top-3.5 text-slate-500" size={18}/>
                    <input 
                        type="text" 
                        required
                        placeholder="XXXX-XXXX-XXXX-XXXX" 
                        className="w-full pl-12 p-3 bg-slate-900 text-white rounded-xl font-mono font-bold border border-slate-700 focus:border-blue-500 outline-none uppercase tracking-widest placeholder:text-slate-600"
                        value={inputKey}
                        onChange={e => setInputKey(e.target.value)}
                    />
                </div>
                
                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20 animate-in fade-in slide-in-from-top-2">
                        <ShieldAlert size={14}/> {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={activating || !inputKey}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all flex justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                    {activating ? <Loader2 className="animate-spin" size={16}/> : "Reactivate System"}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-6">
                 <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                    <LogOutIcon size={14}/> Log Out
                 </button>
                 <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                    <RefreshCw size={14}/> Refresh Status
                 </button>
            </div>
        </div>
    </div>
  );

  // C. Active App (With potential warning)
  return (
    <>
        {children}
        
        {/* Grace Period Warning Banner */}
        {status === 'WARNING' && (
            <div className="fixed bottom-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 z-50 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-full">
                <div className="flex items-center gap-3 container mx-auto max-w-7xl">
                    <AlertTriangle size={18} className="animate-pulse"/>
                    <span className="text-xs font-black uppercase tracking-widest">
                        License Expiring Soon: {daysLeft} Days Remaining
                    </span>
                </div>
                <button 
                    onClick={() => window.location.href = '/settings'}
                    className="text-xs font-bold bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition-colors uppercase"
                >
                    Renew Now
                </button>
            </div>
        )}
    </>
  );
};

// Helper Component for Logout Icon
const LogOutIcon = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

export default LicenseLock;