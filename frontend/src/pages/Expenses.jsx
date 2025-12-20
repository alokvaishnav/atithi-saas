import { useEffect, useState } from 'react';
import { 
  Plus, X, DollarSign, Calendar, TrendingDown, 
  Wallet, FileText, PieChart, Tag, Trash2, Search
} from 'lucide-react'; 
import { API_URL } from '../config'; 

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem('access_token');

  // New Expense Model
  const [formData, setFormData] = useState({
    category: 'UTILITIES',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const CATEGORIES = [
    { value: 'SALARY', label: 'Staff Payroll', color: 'bg-blue-100 text-blue-700' },
    { value: 'UTILITIES', label: 'Electricity & Water', color: 'bg-orange-100 text-orange-700' },
    { value: 'MAINTENANCE', label: 'Repairs & Maint.', color: 'bg-red-100 text-red-700' },
    { value: 'SUPPLIES', label: 'Kitchen/Cleaning', color: 'bg-green-100 text-green-700' },
    { value: 'MARKETING', label: 'Ads & Promo', color: 'bg-purple-100 text-purple-700' },
    { value: 'OTHER', label: 'Miscellaneous', color: 'bg-slate-100 text-slate-700' }
  ];

  const fetchExpenses = async () => {
    try {
      const res = await fetch(API_URL + '/api/expenses/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setExpenses(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(API_URL + '/api/expenses/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("Expense Recorded Successfully! 💸");
        setShowModal(false);
        setFormData({ category: 'UTILITIES', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
        fetchExpenses();
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this expense record?")) return;
    try {
        await fetch(`${API_URL}/api/expenses/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchExpenses();
    } catch (err) { console.error(err); }
  };

  // Filter Logic
  const filteredList = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.category.includes(searchTerm.toUpperCase())
  );

  const totalExpenses = filteredList.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Cost Control</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase tracking-widest">
              <TrendingDown size={12}/> Expenses Ledger
            </span>
            <span className="text-slate-400 font-bold text-xs">FY 2024-25</span>
          </div>
        </div>

        <div className="flex w-full lg:w-auto gap-4">
            <div className="bg-slate-900 text-white px-8 py-4 rounded-[20px] shadow-xl text-right min-w-[200px]">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Outflow</p>
                <p className="text-3xl font-black tracking-tighter">₹{totalExpenses.toLocaleString()}</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-[20px] font-black hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest text-xs">
                <Plus size={20} className="text-red-500"/> Record Expense
            </button>
        </div>
      </div>

      {/* 🔍 SEARCH BAR */}
      <div className="relative mb-8 max-w-md">
         <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
         <input 
           type="text" placeholder="Search expenses..." 
           className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[20px] font-bold text-slate-700 focus:border-red-500 outline-none transition-all shadow-sm"
           value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {/* 📋 EXPENSE LIST */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="p-6 pl-8">Date</th>
                <th className="p-6">Category</th>
                <th className="p-6">Details</th>
                <th className="p-6">Authorized By</th>
                <th className="p-6 text-right">Amount</th>
                <th className="p-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredList.length > 0 ? filteredList.map(item => {
                const catStyle = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[5];
                return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-6 pl-8 font-bold text-slate-600 text-sm">
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-slate-300"/>
                                {new Date(item.date).toLocaleDateString()}
                            </div>
                        </td>
                        <td className="p-6">
                            <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${catStyle.color}`}>
                                {catStyle.label}
                            </span>
                        </td>
                        <td className="p-6 font-bold text-slate-800">{item.description || '—'}</td>
                        <td className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">{item.paid_by_username || 'Admin'}</td>
                        <td className="p-6 text-right font-black text-slate-900 text-lg">₹{parseFloat(item.amount).toLocaleString()}</td>
                        <td className="p-6 text-center">
                            <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                );
              }) : (
                <tr><td colSpan="6" className="p-20 text-center text-slate-300 italic font-medium">No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ➕ ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-10 rounded-[40px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">New Expense</h3>
                    <button onClick={() => setShowModal(false)}><X className="text-slate-300 hover:text-slate-900"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Category</label>
                        <select 
                            className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-red-500 transition-all mt-1"
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Amount</label>
                            <input type="number" required placeholder="0.00" 
                                className="w-full bg-slate-50 p-4 rounded-xl font-black text-xl outline-none border-2 border-transparent focus:border-red-500 transition-all mt-1"
                                value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date</label>
                            <input type="date" required 
                                className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-red-500 transition-all mt-1"
                                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description / Vendor</label>
                        <input type="text" placeholder="e.g. June Staff Salary, Vegetable Vendor..." 
                            className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border-2 border-transparent focus:border-red-500 transition-all mt-1"
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all">
                        {isSubmitting ? 'Saving...' : 'Confirm Payment'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;