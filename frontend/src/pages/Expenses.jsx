import { useEffect, useState } from 'react';
import { Plus, TrendingDown, Calendar, FileText, Trash2 } from 'lucide-react';
import { API_URL } from '../config';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'UTILITIES', date: new Date().toISOString().split('T')[0] });
  const token = localStorage.getItem('access_token');

  const fetchExpenses = async () => {
    const res = await fetch(`${API_URL}/api/expenses/`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setExpenses(await res.json());
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
    });
    setShowModal(false);
    setFormData({ title: '', amount: '', category: 'UTILITIES', date: new Date().toISOString().split('T')[0] });
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Expense Tracker</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Outflow: ₹{totalExpenses.toLocaleString()}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-200">
            <Plus size={16}/> Record Expense
        </button>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 group">
                        <td className="p-6 text-sm font-bold text-slate-500 flex items-center gap-2">
                            <Calendar size={14}/> {e.date}
                        </td>
                        <td className="p-6 font-bold text-slate-800">{e.title}</td>
                        <td className="p-6">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {e.category}
                            </span>
                        </td>
                        <td className="p-6 text-right font-black text-red-500 text-lg">
                            -₹{parseFloat(e.amount).toLocaleString()}
                        </td>
                    </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold italic">No expenses recorded yet.</td></tr>}
            </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[30px] w-full max-w-md space-y-4">
                <h3 className="text-xl font-black text-slate-800 uppercase italic mb-4 text-red-600">Record Outflow</h3>
                <input required placeholder="Expense Title" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <input required type="number" placeholder="Amount" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <select className="w-full p-3 bg-slate-50 rounded-xl font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="UTILITIES">Utilities (Bill, Wifi)</option>
                    <option value="SALARY">Salaries</option>
                    <option value="MAINTENANCE">Repairs</option>
                    <option value="SUPPLIES">Supplies Purchase</option>
                    <option value="MARKETING">Marketing</option>
                </select>
                <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-700 mt-2">Save Record</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
            </form>
        </div>
      )}
    </div>
  );
};

export default Expenses;