import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, ShieldCheck, MapPin, User } from 'lucide-react';
import { API_URL } from '../config';

const EditGuest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', 
        id_type: 'Aadhaar', id_proof_number: '', 
        address: '', nationality: 'Indian'
    });

    useEffect(() => {
        fetch(`${API_URL}/api/guests/${id}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setFormData(data));
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/api/guests/${id}/`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            alert("Guest Identity Updated! ✅");
            navigate('/guests');
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold mb-6 hover:text-slate-800">
                <ArrowLeft size={20}/> Back to Directory
            </button>

            <div className="max-w-2xl bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white">
                    <h2 className="text-2xl font-black tracking-tight">Update Guest Profile</h2>
                    <p className="text-slate-400 text-sm">Verify and update identity documents for legal compliance</p>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Full Name</label>
                            <input type="text" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Phone Number</label>
                            <input type="text" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                        </div>
                    </div>

                    {/* Identity Verification */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={16}/> Identity Verification
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <select className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold" value={formData.id_type} onChange={e => setFormData({...formData, id_type: e.target.value})}>
                                <option value="Aadhaar">Aadhaar Card</option>
                                <option value="Passport">Passport</option>
                                <option value="Voter ID">Voter ID</option>
                                <option value="Driving License">Driving License</option>
                            </select>
                            <input type="text" placeholder="ID Number" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold" value={formData.id_proof_number} onChange={e => setFormData({...formData, id_proof_number: e.target.value})} required />
                        </div>
                    </div>

                    {/* Address & Nationality */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                         <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={16}/> Contact Address
                        </h4>
                        <input type="text" placeholder="Nationality" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
                        <textarea placeholder="Full Permanent Address" className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold h-24" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                        <Save size={20}/> Save Profile Updates
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditGuest;