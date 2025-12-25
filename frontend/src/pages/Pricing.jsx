import { useState, useEffect } from 'react';
import { CheckCircle, Zap, Shield, Star, Loader2, Calendar } from 'lucide-react';
import { API_URL } from '../config';

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  
  // 1️⃣ State for Current Subscription
  const [currentPlan, setCurrentPlan] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  
  const token = localStorage.getItem('access_token');

  // 2️⃣ Fetch Current Plan Status on Mount
  useEffect(() => {
    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/api/license/check/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) {
                const data = await res.json();
                setCurrentPlan(data.plan); // e.g., 'PRO', 'STARTER', 'TRIAL'
                setDaysLeft(data.days_left);
            }
        } catch (err) {
            console.error("Failed to check license", err);
        }
    };
    fetchStatus();
  }, [token]);

  // 3️⃣ Load Razorpay SDK Dynamically
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 4️⃣ Handle Payment Logic
  const handlePayment = async (planName, amount) => {
    setLoading(true);
    
    // A. Load Script
    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    // B. Create Order on Backend
    try {
      const orderRes = await fetch(`${API_URL}/api/payment/create/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ amount, plan_name: planName })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error || "Order creation failed");

      // C. Open Razorpay Options
      const options = {
        key: orderData.key_id, 
        amount: orderData.amount, 
        currency: "INR",
        name: "Atithi SaaS",
        description: `Upgrade to ${planName} Plan`,
        order_id: orderData.order_id, 
        handler: async function (response) {
            // D. Verify Payment on Backend
            const verifyRes = await fetch(`${API_URL}/api/payment/verify/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok) {
                alert("🎉 Payment Successful! License Extended.");
                window.location.reload(); // Reload to reflect new plan immediately
            } else {
                alert(verifyData.error || "Payment Verification Failed.");
            }
        },
        prefill: {
            name: localStorage.getItem('username') || "Hotel Owner",
            email: "",
            contact: ""
        },
        theme: { color: "#2563eb" }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-20 px-4 font-sans">
      
      {/* HEADER with Status Badge */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full mb-6 border border-blue-800">
            <Calendar size={16}/>
            <span className="text-xs font-bold uppercase tracking-widest">
                Current Status: {currentPlan || 'Loading...'} — {daysLeft} Days Left
            </span>
        </div>
        <h1 className="text-5xl text-white font-black italic tracking-tighter mb-6">Choose Your Power Plan</h1>
        <p className="text-slate-400 text-lg">Unleash the full potential of your hospitality business with enterprise-grade tools.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* STARTER */}
        <PricingCard 
            title="Starter" 
            price="999" 
            planCode="STARTER"
            currentPlan={currentPlan}
            icon={<Zap size={24}/>}
            features={['50 Bookings/mo', 'Basic Dashboard', 'Email Support']}
            btnText="Start Small"
            onClick={() => handlePayment('STARTER', 999)}
            loading={loading}
        />

        {/* PROFESSIONAL (Highlighted) */}
        <div className="relative transform scale-105 z-10">
            <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 rounded-full"></div>
            <PricingCard 
                title="Professional" 
                price="1999" 
                planCode="PRO"
                currentPlan={currentPlan}
                isPopular
                icon={<Star size={24}/>}
                features={['Unlimited Bookings', 'Real-Time Analytics', 'Priority Support', 'PDF Invoicing']}
                btnText="Go Professional"
                onClick={() => handlePayment('PRO', 1999)}
                loading={loading}
            />
        </div>

        {/* ENTERPRISE */}
        <PricingCard 
            title="Enterprise" 
            price="2999" 
            planCode="ENTERPRISE"
            currentPlan={currentPlan}
            icon={<Shield size={24}/>}
            features={['Multi-Property Sync', 'Dedicated Account Mgr', 'API Access', 'Custom Branding']}
            btnText="Scale Up"
            onClick={() => handlePayment('ENTERPRISE', 2999)}
            loading={loading}
        />

      </div>
    </div>
  );
};

// 💡 Updated Card to handle "Current Plan" state
const PricingCard = ({ title, price, planCode, currentPlan, icon, features, isPopular, btnText, onClick, loading }) => {
  const isCurrent = currentPlan === planCode;

  return (
    <div className={`bg-slate-800 p-8 rounded-[32px] border ${isPopular ? 'border-blue-500 shadow-2xl shadow-blue-900/50' : 'border-slate-700'} flex flex-col h-full relative`}>
        {isPopular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest">Most Popular</div>}
        
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isPopular ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
            {icon}
        </div>
        
        <h3 className="text-white font-black text-xl uppercase tracking-widest mb-2">{title}</h3>
        <div className="flex items-end gap-1 mb-8">
            <span className="text-4xl font-black text-white">₹{price}</span>
            <span className="text-slate-500 font-bold text-sm mb-1">/month</span>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
            {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                    <CheckCircle size={16} className={isPopular ? "text-blue-500" : "text-slate-500"}/> {f}
                </li>
            ))}
        </ul>

        {/* 🟢 DYNAMIC BUTTON STATE */}
        <button 
            onClick={onClick}
            disabled={loading || isCurrent}
            className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all 
                ${isCurrent 
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/50' 
                    : isPopular 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95' 
                        : 'bg-white hover:bg-slate-200 text-slate-900 active:scale-95'
                }`}
        >
            {loading ? <Loader2 className="animate-spin mx-auto"/> : isCurrent ? "Active Plan" : btnText}
        </button>
    </div>
  );
};

export default Pricing;