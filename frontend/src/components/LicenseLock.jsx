import { useEffect, useState } from 'react';
import { Lock, Loader2, ShieldAlert, KeyRound, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext'; 

const LicenseLock = ({ children }) => {
  const [status, setStatus] = useState('LOADING'); 
  const [daysLeft, setDaysLeft] = useState(0);
  const [inputKey, setInputKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  const { token, logout } = useAuth(); 

  useEffect(() => {
    // 🟢 PASS-THROUGH: If AuthContext hasn't given us a token yet,
    // we simply mark as ACTIVE so the Login page can be shown by the Router.
    if (!token) {
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

            // 🟢 Handle 401 (Unauthorized) - Expired Token
            if (res.status === 401) {
                console.warn("Token expired. Logging out.");
                logout();
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setDaysLeft(data.days_left);
                setStatus(data.is_expired ? 'EXPIRED' : (data.days_left <= 7 ? 'WARNING' : 'ACTIVE'));
            } else {
                // If 400/500, we Fail Open (let the user in)
                console.warn("License Check Failed (Server Error), defaulting to ACTIVE.");
                setStatus('ACTIVE'); 
            }
        } catch (err) {
            console.error("License Network Error:", err);
            setStatus('ACTIVE'); 
        }
    };
    
    checkLicense();
  }, [token, logout]);

  // Handle Activation
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
            setError(errData.error || "Invalid License Key.");
        }
    } catch (err) {
        setError("Network error.");
    } finally {
        setActivating(false);
    }
  };

  // --- RENDER ---
  if (status === 'LOADING' && token) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="animate-spin text-blue-500" size={48}/>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Verifying License...</p>
    </div>
  );

  if (status === 'EXPIRED') return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-700 text-center">
            <Lock size={40} className="text-red-500 mx-auto mb-6"/>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-2">System Locked</h1>
            <p className="text-slate-400 text-sm mb-8">License Expired.</p>
            <form onSubmit={handleActivate} className="space-y-4">
                <input 
                    type="text" required placeholder="XXXX-XXXX-XXXX-XXXX" 
                    className="w-full pl-4 p-3 bg-slate-900 text-white rounded-xl font-mono outline-none border border-slate-700"
                    value={inputKey} onChange={e => setInputKey(e.target.value)}
                />
                {error && <div className="text-red-400 text-xs font-bold">{error}</div>}
                <button type="submit" disabled={activating || !inputKey} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs hover:bg-blue-500 transition-all flex justify-center gap-2">
                    {activating ? <Loader2 className="animate-spin" size={16}/> : "Reactivate"}
                </button>
            </form>
            <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
                 <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase">
                    <LogOut size={14}/> Log Out
                 </button>
            </div>
        </div>
    </div>
  );

  return (
    <>
        {children}
        {status === 'WARNING' && (
            <div className="fixed bottom-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 z-50 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3 container mx-auto max-w-7xl">
                    <AlertTriangle size={18} className="animate-pulse"/>
                    <span className="text-xs font-black uppercase tracking-widest">License Expiring Soon: {daysLeft} Days</span>
                </div>
            </div>
        )}
    </>
  );
};

export default LicenseLock;