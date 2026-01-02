import { useEffect, useState } from 'react';
import { 
  Wallet, Plus, TrendingDown, Calendar, 
  Trash2, Loader2, X, AlertCircle 
} from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
  const { token, role, user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🛡️ SECURITY: Only Owners and Managers can Delete expenses (Audit Safety)
  const canDelete = ['OWNER', 'MANAGER'].includes(role) || user?.is_superuser;

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({ 
    title: '', 
    amount: '', 
    category: 'UTILITIES', 
    date: today,
    notes: '' 
  });

  // --- FETCH EXPENSES ---
  const fetchExpenses = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/expenses/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
          const data = await res.json();
          // Safety check: ensure data is array
          setExpenses(Array.isArray(data) ? data : []);
      }
    } catch (err) { 
        console.error(err); 
        setExpenses([]); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchExpenses(); }, [token]);

  // --- CREATE EXPENSE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
        setFormData({ title: '', amount: '', category: 'UTILITIES', date: today, notes: '' });
        fetchExpenses();
      } else {
        alert("Failed to save expense. Please try again.");
      }
    } catch (err) { console.error(err); } 
    finally { setSubmitting(false); }
  };

  // --- DELETE EXPENSE ---
  const handleDelete = async (id) => {
    if(!window.confirm("⚠️ Are you sure? This will permanently remove this expense record.")) return;
    
    // Optimistic Update
    const originalExpenses = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));

    try {
        const res = await fetch(`${API_URL}/api/expenses/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to delete');
        
    } catch (err) { 
        console.error(err);
        setExpenses(originalExpenses); // Revert on error
        alert("Could not delete expense.");
    }
  };

  // Calculate Total
  const totalExpense = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-xs font-bold uppercase tracking-widest">Loading Financials...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Expenses</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Cost Tracking & Financials</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                {/* Total Card */}
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                        <TrendingDown size={24}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Outflow</p>
                        <p className="text-2xl font-black text-slate-900 leading-none">₹{totalExpense.toLocaleString()}</p>
                    </div>
                </div>

                <button 
                    onClick={() => setShowModal(true)} 
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-300"
                >
                    <Plus size={16}/> Log Expense
                </button>
            </div>
        </div>

        {/* EXPENSE TABLE */}
        <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Date</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                            <th className="p-5 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-5 font-bold text-slate-500 text-sm whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-300"/> 
                                        {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </td>
                                <td className="p-5 font-bold text-slate-800">
                                    {expense.title}
                                    {expense.notes && <span className="block text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{expense.notes}</span>}
                                </td>
                                <td className="p-5">
                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="p-5 text-right font-black text-red-500 text-lg">
                                    -₹{parseFloat(expense.amount).toLocaleString()}
                                </td>
                                <td className="p-5 text-right">
                                    {/* 🛡️ DELETE BUTTON (Restricted) */}
                                    {canDelete && (
                                        <button 
                                            onClick={() => handleDelete(expense.id)} 
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100"
                                            title="Delete Record"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Wallet size={32} className="opacity-20"/>
                                        <p className="font-bold uppercase tracking-widest text-xs">No expenses recorded yet.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL */}
        {showModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in duration-200 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-slate-800 uppercase italic">Log New Expense</h3>
                        <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Title</label>
                        <input required placeholder="e.g. Monthly Electricity Bill" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none transition-all placeholder:text-slate-300" 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                            <input required type="number" placeholder="0.00" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none transition-all" 
                                value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                            <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none transition-all text-slate-600" 
                                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none transition-all text-slate-700" 
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="UTILITIES">Utilities (Bill, Wifi)</option>
                            <option value="SALARY">Salaries</option>
                            <option value="MAINTENANCE">Repairs & Maintenance</option>
                            <option value="SUPPLIES">Supplies & Inventory</option>
                            <option value="MARKETING">Marketing & Ads</option>
                            <option value="TAX">Taxes & Licenses</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    
                    <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes (Optional)</label>
                         <textarea rows="2" placeholder="Additional details..." className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none transition-all resize-none placeholder:text-slate-300"
                            value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl uppercase tracking-widest hover:bg-red-600 flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-400/20 disabled:opacity-70 disabled:cursor-not-allowed">
                            {submitting ? <Loader2 className="animate-spin" size={20}/> : "Save Record"}
                        </button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};

export default Expenses;