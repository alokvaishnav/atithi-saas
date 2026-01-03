import { useState } from 'react';
import { Hotel, CheckCircle, ArrowRight, Building, MapPin, Coins, BedDouble, Loader2 } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OnboardingWizard = () => {
  const { token, updateGlobalProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    hotelName: '', 
    totalFloors: '1', 
    basePrice: '2000',
    address: '',
    currency: '₹'
  });

  const handleNext = async () => {
    if (step === 3) {
      // --- FINAL SUBMIT LOGIC ---
      setLoading(true);
      try {
        // 1. Save Hotel Settings
        await fetch(`${API_URL}/api/settings/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                hotel_name: formData.hotelName,
                address: formData.address,
                currency_symbol: formData.currency
            })
        });

        // 2. Generate Dummy Rooms (e.g., 4 rooms per floor)
        const floors = parseInt(formData.totalFloors) || 1;
        const price = parseInt(formData.basePrice) || 2000;
        
        // Loop through floors and create 4 rooms for each
        const roomPromises = [];
        for (let f = 1; f <= floors; f++) {
            for (let r = 1; r <= 4; r++) {
                const roomNum = `${f}0${r}`; // e.g., 101, 102, 201...
                roomPromises.push(
                    fetch(`${API_URL}/api/rooms/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            room_number: roomNum,
                            room_type: r === 4 ? 'SUITE' : 'SINGLE', // Make the last room a Suite
                            price_per_night: r === 4 ? price * 1.5 : price,
                            floor: f,
                            capacity: r === 4 ? 4 : 2,
                            status: 'AVAILABLE'
                        })
                    })
                );
            }
        }
        await Promise.all(roomPromises);

        // 3. Update Context & Redirect
        updateGlobalProfile(formData.hotelName.toUpperCase());
        navigate('/dashboard');

      } catch (err) { 
          console.error(err);
          alert("Setup failed. Please try again.");
      } finally {
          setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-2xl p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="mb-10 relative z-10">
            <div className="flex justify-between items-center text-slate-400 text-xs font-black uppercase tracking-widest mb-4">
                <span>Step {step} of 3</span>
                <span>Setup Wizard</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${(step/3)*100}%` }}
                />
            </div>
        </div>

        {/* Step 1: Branding */}
        {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Welcome to Atithi.</h1>
                <p className="text-slate-500 mb-8 font-medium">Let's start by naming your property.</p>
                
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 transition-colors flex items-center gap-4">
                        <Hotel className="text-slate-400"/>
                        <input 
                            className="bg-transparent w-full outline-none font-bold text-lg text-slate-800 placeholder:text-slate-300" 
                            placeholder="e.g. Grand Hotel"
                            value={formData.hotelName}
                            onChange={e => setFormData({...formData, hotelName: e.target.value})}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 flex-1 flex items-center gap-4">
                            <MapPin className="text-slate-400"/>
                            <input 
                                className="bg-transparent w-full outline-none font-bold text-sm text-slate-800 placeholder:text-slate-300" 
                                placeholder="City, Country"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 w-24 flex items-center gap-2">
                            <Coins className="text-slate-400"/>
                            <input 
                                className="bg-transparent w-full outline-none font-bold text-sm text-slate-800 placeholder:text-slate-300 text-center" 
                                placeholder="₹"
                                value={formData.currency}
                                onChange={e => setFormData({...formData, currency: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Step 2: Structure */}
        {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Structure.</h1>
                <p className="text-slate-500 mb-8 font-medium">How big is your property?</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-blue-400 transition-colors group cursor-text" onClick={() => document.getElementById('floors-input').focus()}>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-blue-500">Total Floors</label>
                        <div className="flex items-center mt-2">
                            <Building size={24} className="text-slate-300 mr-2"/>
                            <input id="floors-input" type="number" className="w-full bg-transparent outline-none font-black text-3xl text-slate-800" placeholder="1"
                                value={formData.totalFloors}
                                onChange={e => setFormData({...formData, totalFloors: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 hover:border-blue-400 transition-colors group cursor-text" onClick={() => document.getElementById('price-input').focus()}>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-blue-500">Avg Room Price</label>
                        <div className="flex items-center mt-2">
                            <span className="text-2xl font-black text-slate-300 mr-1">{formData.currency}</span>
                            <input id="price-input" type="number" className="w-full bg-transparent outline-none font-black text-3xl text-slate-800" placeholder="2000"
                                value={formData.basePrice}
                                onChange={e => setFormData({...formData, basePrice: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-4 font-bold bg-blue-50 p-3 rounded-xl text-blue-600 inline-block">
                    ✨ We will generate 4 rooms per floor automatically.
                </p>
            </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center py-8">
                <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-200 animate-bounce">
                    <CheckCircle size={64}/>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">You're Ready!</h1>
                <p className="text-slate-500 mb-8 font-medium">Your digital hotel twin is configured and ready to launch.</p>
            </div>
        )}

        {/* Footer Actions */}
        <div className="mt-12 flex justify-between items-center">
            {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="text-slate-400 font-bold text-sm hover:text-slate-600">Back</button>
            ) : <div></div>}
            
            <button 
                onClick={handleNext}
                disabled={!formData.hotelName || loading}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {loading ? <Loader2 className="animate-spin"/> : (
                    <>
                        {step === 3 ? 'Launch Dashboard' : 'Continue'} 
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default OnboardingWizard;