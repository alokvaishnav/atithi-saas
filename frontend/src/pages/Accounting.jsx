import { useEffect, useState } from 'react';
import { 
  TrendingUp, TrendingDown, Landmark, Receipt, 
  Plus, X, Filter, Download, Trash2, Loader2,
  AlertCircle, Wallet
} from 'lucide-react';
import { API_URL } from '../config';

const Accounting = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'UTILITY', amount: '', description: '' });
  
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/expenses/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Ledger Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/expenses/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', category: 'UTILITY', amount: '', description: '' });
        fetchExpenses();
        alert("Expense Logged Successfully! 📉");
      }
    } catch (err) { 
      console.error(err); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Void this expense entry? This will adjust the property net profit immediately.")) {
      try {
        const res = await fetch(`${API_URL}/api/expenses/${id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchExpenses();
      } catch (err) { console.error(err); }
    }
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  if (loading && expenses.length === 0) return (
    <div className="p-20 text-center font-black animate-pulse text-red-600 uppercase tracking-widest text-xs">
      <Loader2 className="animate-spin inline-block mr-2" /> Decrypting Financial Ledger...
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Finance & Ledger</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Operational Outflow Tracking • <span className="text-red-500">Expenditure Control</span>
          </p>
        </div>
        {['OWNER', 'ACCOUNTANT', 'MANAGER'].includes(userRole) && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            <Plus size={18}/> Log Outflow
          </button>
        )}
      </div>

      {/* 💰 FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-red-200 transition-all">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <TrendingDown size={32}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Costs</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalSpent.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl flex items-center gap-6 relative overflow-hidden">
          <Landmark className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <div className="w-16 h-16 bg-white/10 text-blue-400 rounded-3xl flex items-center justify-center">
            <Receipt size={32}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Invoices Processed</p>
            <h3 className="text-3xl font-black tracking-tighter">{expenses.length} Entries</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner">
            <Wallet size={32}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Burn Rate</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{(totalSpent / 30).toFixed(0)} <span className="text-xs text-slate-400">/avg</span></h3>
          </div>
        </div>
      </div>

      {/* 📄 MASTER EXPENSE TABLE */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="p-8">Expense Identity</th>
                <th className="p-8 text-center">Category</th>
                <th className="p-8 text-center">Reference Date</th>
                <th className="p-8 text-right">Settlement</th>
                <th className="p-8 text-center">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.length > 0 ? expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <AlertCircle size={18}/>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg tracking-tight capitalize">{exp.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{exp.description || 'No supplementary notes'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full font-black text-[9px] uppercase tracking-[0.1em] border border-slate-200">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-8 text-center">
                    <p className="font-bold text-slate-500 text-sm italic">{new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </td>
                  <td className="p-8 text-right">
                    <p className="font-black text-red-600 text-2xl tracking-tighter italic">₹{parseFloat(exp.amount).toLocaleString()}</p>
                  </td>
                  <td className="p-8 text-center">
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                      title="Void Entry"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.4em] italic">No Financial Outflows Recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🏗️ MODAL: RECORD EXPENDITURE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Record Outflow</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Property Expense Management</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bill Subject / Vendor</label>
                <input 
                  type="text" placeholder="e.g. Reliance Energy - Nov Bill" required
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500 transition-all"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Expense Category</label>
                   <select 
                    className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none border-2 border-transparent focus:border-red-500 transition-all appearance-none"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="UTILITY">Utility Bill</option>
                    <option value="SALARY">Staff Salary</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INVENTORY">Inventory / Food</option>
                    <option value="OTHER">Miscellaneous</option>
                  </select>
                 </div>
                 <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Amount (₹)</label>
                  <input 
                    type="number" placeholder="0.00" required
                    className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none border-2 border-transparent focus:border-red-500 transition-all text-xl"
                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Internal Remarks</label>
                <textarea 
                  placeholder="Note payment method or receipt number..."
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-red-500 transition-all h-32"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-white p-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-black transition-all disabled:opacity-30"
              >
                {isSubmitting ? 'Syncing Ledger...' : 'Authorize & Post entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;