import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

const LicenseLock = ({ children }) => {
  const [valid, setValid] = useState(true);

  // Simple check (In production, verify with backend)
  useEffect(() => {
    setValid(true); 
  }, []);

  if (!valid) return (
    <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
            <Lock size={48} className="mx-auto text-red-500 mb-4"/>
            <h1 className="text-2xl font-black uppercase tracking-widest text-red-500">License Expired</h1>
            <p className="text-slate-500 mt-2">Please contact support to renew your access.</p>
        </div>
    </div>
  );

  return children;
};

export default LicenseLock;