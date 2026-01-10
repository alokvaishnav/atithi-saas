import { useState } from 'react';
import { 
  Check, Crown, Star, ShieldCheck, Zap, Phone, Mail, 
  HelpCircle, Server, Globe, Lock, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // 🟢 Import Auth for real data

const Pricing = () => {
  const { user } = useAuth(); // 🟢 Get current user
  const [billingCycle, setBillingCycle] = useState('MONTHLY'); // MONTHLY | YEARLY
  
  // 🟢 Logic: Determine User's actual plan (Default to STARTER if unknown)
  const currentPlan = user?.subscription_plan ? user.subscription_plan.toUpperCase() : "STARTER";

  const handleUpgrade = (planName) => {
      alert(`🔄 Requesting upgrade to ${planName}... \n\nOur sales team will contact you shortly to finalize the switch.`);
  };

  const plans = [
    {
        name: "STARTER",
        monthly: 999,
        yearly: 9990,
        features: ["10 Rooms Max", "Basic Booking Engine", "Reports (Last 7 Days)", "1 Staff Account", "Email Support"],
        color: "bg-white border-slate-200 text-slate-900",
        btnColor: "bg-slate-100 text-slate-900 hover:bg-slate-200"
    },
    {
        name: "PRO",
        monthly: 2499,
        yearly: 24990,
        features: ["50 Rooms Max", "POS & Inventory", "Advanced Reports", "5 Staff Accounts", "WhatsApp Alerts", "Priority Support"],
        color: "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200",
        btnColor: "bg-white text-blue-600 hover:bg-blue-50",
        recommended: true
    },
    {
        name: "ENTERPRISE",
        monthly: 4999,
        yearly: 49990,
        features: ["Unlimited Rooms", "Multi-Property", "Dedicated Account Manager", "Unlimited Staff", "Custom Branding", "API Access"],
        color: "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-300",
        btnColor: "bg-purple-600 text-white hover:bg-purple-50"
    }
  ];

  const features = [
      { name: "Front Desk Operations", starter: true, pro: true, ent: true },
      { name: "Housekeeping Module", starter: true, pro: true, ent: true },
      { name: "Guest Invoicing & Folios", starter: true, pro: true, ent: true },
      { name: "POS (Restaurant/Cafe)", starter: false, pro: true, ent: true },
      { name: "Inventory Management", starter: false, pro: true, ent: true },
      { name: "WhatsApp Automation", starter: false, pro: true, ent: true },
      { name: "Financial Accounting", starter: false, pro: true, ent: true },
      { name: "Channel Manager Integration", starter: false, pro: false, ent: true },
      { name: "Custom Domain (White-label)", starter: false, pro: false, ent: true },
  ];

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
      
      {/* --- HERO SECTION --- */}
      <div className="text-center max-w-2xl mx-auto mb-16 pt-8">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-4">Subscription Plans</h2>
        <p className="text-slate-500 font-medium mb-8">
            Manage your hotel operations with the power you need. Transparent pricing, no hidden fees.
        </p>
        
        {/* BILLING TOGGLE */}
        <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm relative">
            <button 
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all z-10 ${
                    billingCycle === 'MONTHLY' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                Monthly
            </button>
            <button 
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all z-10 flex items-center gap-2 ${
                    billingCycle === 'YEARLY' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                Yearly <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded animate-pulse">-17% OFF</span>
            </button>
        </div>
      </div>

      {/* --- PRICING CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 px-2">
        {plans.map(plan => {
            const price = billingCycle === 'MONTHLY' ? plan.monthly : plan.yearly;
            const cycleLabel = billingCycle === 'MONTHLY' ? '/mo' : '/yr';
            const isCurrent = currentPlan === plan.name;
            
            return (
                <div key={plan.name} className={`relative p-8 rounded-[40px] border-2 flex flex-col transition-transform hover:scale-[1.02] duration-300 ${plan.color}`}>
                    {plan.recommended && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                            <Star size={12} fill="currentColor"/> Most Popular
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black">₹{price.toLocaleString()}</span>
                            <span className="text-xs font-bold opacity-60">{cycleLabel}</span>
                        </div>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-3 text-sm font-bold opacity-90">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                                    plan.name === 'PRO' || plan.name === 'ENTERPRISE' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'
                                }`}>
                                    <Check size={12}/>
                                </div>
                                {f}
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={() => !isCurrent && handleUpgrade(plan.name)}
                        disabled={isCurrent}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${plan.btnColor}`}
                    >
                        {isCurrent ? 'Current Plan' : 'Upgrade Now'}
                    </button>
                </div>
            );
        })}
      </div>

      {/* --- TRUST BADGES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20 px-2">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Lock size={24}/></div>
              <div>
                  <h4 className="font-black text-slate-800 text-sm">Secure Data</h4>
                  <p className="text-xs text-slate-500">256-bit SSL Encryption</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><Server size={24}/></div>
              <div>
                  <h4 className="font-black text-slate-800 text-sm">99.9% Uptime</h4>
                  <p className="text-xs text-slate-500">Reliable AWS Cloud Hosting</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Globe size={24}/></div>
              <div>
                  <h4 className="font-black text-slate-800 text-sm">Anywhere Access</h4>
                  <p className="text-xs text-slate-500">Mobile, Tablet & Desktop</p>
              </div>
          </div>
      </div>

      {/* --- FEATURE COMPARISON --- */}
      <div className="max-w-5xl mx-auto mb-20 px-2">
          <h3 className="text-2xl font-black text-slate-800 uppercase italic text-center mb-8">Compare Features</h3>
          <div className="bg-white rounded-[30px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Feature</th>
                              <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Starter</th>
                              <th className="p-6 text-xs font-black text-blue-600 uppercase tracking-widest text-center">Pro</th>
                              <th className="p-6 text-xs font-black text-purple-600 uppercase tracking-widest text-center">Enterprise</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {features.map((feat, i) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                  <td className="p-4 pl-6 font-bold text-slate-700 text-sm">{feat.name}</td>
                                  <td className="p-4 text-center">{feat.starter ? <Check className="mx-auto text-green-500" size={18}/> : <X className="mx-auto text-slate-300" size={18}/>}</td>
                                  <td className="p-4 text-center bg-blue-50/30">{feat.pro ? <Check className="mx-auto text-green-500" size={18}/> : <X className="mx-auto text-slate-300" size={18}/>}</td>
                                  <td className="p-4 text-center">{feat.ent ? <Check className="mx-auto text-green-500" size={18}/> : <X className="mx-auto text-slate-300" size={18}/>}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* --- FAQ SECTION --- */}
      <div className="max-w-4xl mx-auto mb-20 px-2">
          <h3 className="text-2xl font-black text-slate-800 uppercase italic text-center mb-8 flex items-center justify-center gap-2">
              <HelpCircle size={28} className="text-slate-400"/> Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Can I change plans later?</h4>
                  <p className="text-slate-500 text-sm">Yes, you can upgrade or downgrade at any time. Prorated charges will apply automatically.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Is there a setup fee?</h4>
                  <p className="text-slate-500 text-sm">No. All plans include free setup and onboarding support. You only pay the subscription.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Do you offer refunds?</h4>
                  <p className="text-slate-500 text-sm">We offer a 7-day money-back guarantee if you are unsatisfied with the PRO or Enterprise plans.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Is my data safe?</h4>
                  <p className="text-slate-500 text-sm">Absolutely. We use AWS servers with automated daily backups and bank-level encryption.</p>
              </div>
          </div>
      </div>

      {/* --- ENTERPRISE BANNER --- */}
      <div className="max-w-5xl mx-auto bg-slate-900 text-white p-10 rounded-[40px] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-900/20 mb-8 mx-4">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Crown size={200}/>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase italic mb-2">Large Chain Hotel?</h3>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    We offer dedicated servers, API engineering, and custom white-label branding for hotels with 5+ properties.
                </p>
            </div>

            <div className="flex gap-4 relative z-10">
                <a href="tel:+917620054157" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2 transition-all shadow-lg">
                    <Phone size={16}/> Call Sales
                </a>
                <a href="mailto:support@atithi.com" className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 flex items-center gap-2 transition-all border border-slate-700">
                    <Mail size={16}/> Email Us
                </a>
            </div>
      </div>

    </div>
  );
};

export default Pricing;