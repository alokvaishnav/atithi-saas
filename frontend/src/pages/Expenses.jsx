import { useEffect, useState } from 'react';
import { 
  Wallet, Plus, TrendingDown, Calendar, 
  Trash2, FileText, Loader2, X 
} from 'lucide-react';
import { API_URL } from '../config';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Default to today's date
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({ 
    title: '', 
    amount: '', 
    category: 'UTILITIES', 
    date: today,
    notes: '' 
  });

  const token = localStorage.getItem('access_token');

  // --- FETCH EXPENSES ---
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/expenses/`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) setExpenses(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  // --- CREATE EXPENSE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', amount: '', category: 'UTILITIES', date: today, notes: '' });
        fetchExpenses();
      }
    } catch (err) { console.error(err); } 
    finally { setSubmitting(false); }
  };

  // --- DELETE EXPENSE ---
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this expense record?")) return;
    
    // Optimistic Update
    setExpenses(expenses.filter(e => e.id !== id));

    try {
        await fetch(`${API_URL}/api/expenses/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) { 
        console.error(err);
        fetchExpenses(); // Revert on error
    }
  };

  // Calculate Total
  const totalExpense = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Expenses</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Cost Tracking & Financials</p>
            </div>
            
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

            <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 flex items-center gap-2 transition-all shadow-lg ml-auto md:ml-0">
                <Plus size={16}/> Log Expense
            </button>
        </div>

        {/* EXPENSE TABLE */}
        <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        <th className="p-5 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-5 font-bold text-slate-500 text-sm flex items-center gap-2">
                                <Calendar size={14} className="text-slate-300"/> 
                                {new Date(expense.date).toLocaleDateString()}
                            </td>
                            <td className="p-5 font-bold text-slate-800">
                                {expense.title}
                                {expense.notes && <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{expense.notes}</span>}
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
                                <button onClick={() => handleDelete(expense.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                No expenses recorded yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* MODAL */}
        {showModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4 animate-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-slate-800 uppercase italic">Log New Expense</h3>
                        <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Title</label>
                        <input required placeholder="e.g. Monthly Electricity Bill" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none" 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                            <input required type="number" placeholder="0.00" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none" 
                                value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                            <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none" 
                                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-red-500 outline-none" 
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="UTILITIES">Utilities (Bill, Wifi)</option>
                            <option value="SALARY">Salaries</option>
                            <option value="MAINTENANCE">Repairs</option>
                            <option value="SUPPLIES">Supplies Purchase</option>
                            <option value="MARKETING">Marketing</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl uppercase tracking-widest hover:bg-red-600 flex items-center justify-center gap-2 transition-all">
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