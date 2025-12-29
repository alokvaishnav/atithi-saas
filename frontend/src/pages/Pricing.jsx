import React from 'react';
import { CheckCircle } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
        <h1 className="text-3xl font-black text-slate-800 uppercase italic mb-8 text-center">Subscription Status</h1>
        <div className="max-w-md mx-auto bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-bl-2xl">Active</div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Enterprise Plan</h2>
            <p className="text-slate-400 text-sm mb-6">Next Billing: Lifetime License</p>
            <div className="text-4xl font-black tracking-tighter mb-8">₹0 <span className="text-lg font-bold text-slate-500">/ mo</span></div>
            <div className="space-y-4 mb-8">
                {['Unlimited Rooms', 'Unlimited Staff', 'Cloud Backup', 'Priority Support'].map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                        <CheckCircle size={16} className="text-blue-400"/> {f}
                    </div>
                ))}
            </div>
            <button className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500">Manage Plan</button>
        </div>
    </div>
  );
};
export default Pricing;