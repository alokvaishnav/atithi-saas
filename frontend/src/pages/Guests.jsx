import { useEffect, useState } from 'react';
import { 
  Search, User, Mail, Phone, MapPin, 
  Loader2, Edit3, Trash2, ShieldCheck 
} from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // --- FETCH GUESTS ---
  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/guests/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGuests(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuests(); }, []);

  // --- FILTER ---
  const filteredGuests = guests.filter(g => 
    g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.phone && g.phone.includes(searchTerm)) ||
    (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Guest Directory</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Profiles: {guests.length}</p>
        </div>
        
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Name, Phone, Email..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* GUEST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map(guest => (
            <div key={guest.id} className="bg-white p-6 rounded-[32px] border border-slate-100 hover:shadow-xl transition-all group relative">
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User size={32}/>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{guest.full_name}</h3>
                        {guest.id_proof_number && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-[9px] font-black uppercase tracking-widest mt-1">
                                <ShieldCheck size={10}/> Verified ID
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Phone size={16} className="text-slate-400"/>
                        <span className="text-xs font-bold text-slate-600">{guest.phone || "No Phone"}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Mail size={16} className="text-slate-400"/>
                        <span className="text-xs font-bold text-slate-600 truncate">{guest.email || "No Email"}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <MapPin size={16} className="text-slate-400"/>
                        <span className="text-xs font-bold text-slate-600 truncate">{guest.address || "No Address"}</span>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <button 
                        onClick={() => navigate(`/guests/edit/${guest.id}`)}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit3 size={14}/> Edit Profile
                    </button>
                </div>

            </div>
        ))}
      </div>

    </div>
  );
};

export default Guests;