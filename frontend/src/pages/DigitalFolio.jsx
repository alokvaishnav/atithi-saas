import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Utensils, Bed, Receipt, Info, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';

const DigitalFolio = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/public/folio/${id}/`)
      .then(res => res.json())
      .then(d => setData(d));
  }, [id]);

  if (!data) return <div className="h-screen flex items-center justify-center font-black animate-bounce text-blue-600">Loading your stay...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      {/* GUEST WELCOME */}
      <div className="mb-8 pt-4">
        <h1 className="text-3xl font-black tracking-tighter">Hello, {data.guest_details?.full_name.split(' ')[0]}!</h1>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Room {data.room_details?.room_number} • Live Bill</p>
      </div>

      {/* QUICK STATUS CARD */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[32px] shadow-2xl mb-8 relative overflow-hidden">
        <CheckCircle2 className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Current Balance Due</p>
        <h2 className="text-4xl font-black italic">₹{parseFloat(data.balance_due).toLocaleString()}</h2>
        <div className="mt-4 flex gap-4 text-[10px] font-black uppercase">
            <span className="bg-white/20 px-3 py-1 rounded-full text-white">Check-out: {new Date(data.check_out_date).toLocaleDateString()}</span>
        </div>
      </div>

      {/* BILLING BREAKDOWN */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Transaction History</h3>
        
        {/* Room Charge */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400"><Bed size={20}/></div>
            <div>
              <p className="font-bold text-sm">Room Accommodation</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Standard Tariff</p>
            </div>
          </div>
          <p className="font-black">₹{parseFloat(data.total_amount).toLocaleString()}</p>
        </div>

        {/* POS Charges */}
        {data.charges?.map((c, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-orange-400"><Utensils size={20}/></div>
              <div>
                <p className="font-bold text-sm">{c.service_name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">{c.quantity} unit(s) • {new Date(c.added_at).toLocaleTimeString()}</p>
              </div>
            </div>
            <p className="font-black text-orange-400">₹{parseFloat(c.total_cost).toLocaleString()}</p>
          </div>
        ))}

        {/* Payments Already Made */}
        <div className="bg-green-950/30 border border-green-500/20 p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-900/50 rounded-xl flex items-center justify-center text-green-400"><Receipt size={20}/></div>
              <div>
                <p className="font-bold text-sm text-green-400">Total Payments/Advance</p>
                <p className="text-[10px] text-green-600 uppercase font-bold tracking-widest">Received</p>
              </div>
            </div>
            <p className="font-black text-green-400">- ₹{parseFloat(data.amount_paid).toLocaleString()}</p>
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-12 text-center p-8 border-t border-white/5">
        <Info className="mx-auto mb-2 text-slate-600" size={20}/>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
          This is a live preview of your folio. <br/> For checkout, please visit the front desk.
        </p>
      </div>
    </div>
  );
};

export default DigitalFolio;