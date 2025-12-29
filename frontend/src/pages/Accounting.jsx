import React from 'react';
import Reports from './Reports'; // Re-use reports logic for now
const Accounting = () => {
  return (
    <div>
        <div className="p-8 bg-slate-900 text-white mb-[-20px] pb-20">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Ledger & Audit</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Double Entry Books</p>
        </div>
        <div className="relative z-10">
            <Reports /> 
        </div>
    </div>
  );
};
export default Accounting;