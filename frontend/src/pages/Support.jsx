import React from 'react';
import { Mail, Phone, LifeBuoy } from 'lucide-react';

const Support = () => {
  return (
    <div className="p-10 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <LifeBuoy size={40}/>
            </div>
            <h1 className="text-4xl font-black text-slate-800 uppercase italic mb-4">Need Help?</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
                Our support team is available 24/7 to assist with your hotel operations.
            </p>
            <div className="space-y-4">
                <a href="mailto:support@atithi.com" className="block p-4 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all font-bold text-slate-700 flex items-center justify-center gap-3">
                    <Mail size={18}/> support@atithi.com
                </a>
                <a href="tel:+919876543210" className="block p-4 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-green-500 transition-all font-bold text-slate-700 flex items-center justify-center gap-3">
                    <Phone size={18}/> +91 98765 43210
                </a>
            </div>
        </div>
    </div>
  );
};
export default Support;