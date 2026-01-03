import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hotel, CheckCircle, ArrowRight, Building } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OnboardingWizard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ hotelName: '', totalFloors: '', basePrice: '' });

  const handleNext = async () => {
    if (step === 3) {
      // Final Submit logic
      try {
        await fetch(`${API_URL}/api/settings/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ hotel_name: formData.hotelName })
        });
        navigate('/dashboard');
      } catch (err) { console.error(err); }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl p-10 rounded-[40px] shadow-2xl">
        <div className="mb-10">
            <div className="flex justify-between items-center text-slate-300 text-sm font-bold uppercase tracking-widest mb-4">
                <span>Step {step} of 3</span>
                <span>Setup Wizard</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(step/3)*100}%` }} 
                    className="h-full bg-blue-600"
                />
            </div>
        </div>

        {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome to Atithi.</h1>
                <p className="text-slate-500 mb-8">Let's start by naming your property.</p>
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 transition-colors flex items-center gap-4">
                    <Hotel className="text-slate-400"/>
                    <input 
                        className="bg-transparent w-full outline-none font-bold text-lg" 
                        placeholder="e.g. Grand Hotel"
                        value={formData.hotelName}
                        onChange={e => setFormData({...formData, hotelName: e.target.value})}
                    />
                </div>
            </motion.div>
        )}

        {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-4xl font-black text-slate-900 mb-2">Structure.</h1>
                <p className="text-slate-500 mb-8">How big is your property?</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
                        <label className="text-xs font-black uppercase text-slate-400">Total Floors</label>
                        <input type="number" className="w-full bg-transparent outline-none font-black text-2xl mt-2" placeholder="1"
                            onChange={e => setFormData({...formData, totalFloors: e.target.value})}
                        />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
                        <label className="text-xs font-black uppercase text-slate-400">Avg Room Price</label>
                        <input type="number" className="w-full bg-transparent outline-none font-black text-2xl mt-2" placeholder="2000"
                            onChange={e => setFormData({...formData, basePrice: e.target.value})}
                        />
                    </div>
                </div>
            </motion.div>
        )}

        {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48}/>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">You're Ready!</h1>
                <p className="text-slate-500 mb-8">Your dashboard has been configured.</p>
            </motion.div>
        )}

        <div className="mt-10 flex justify-end">
            <button 
                onClick={handleNext}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl"
            >
                {step === 3 ? 'Launch Dashboard' : 'Continue'} <ArrowRight size={20}/>
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;