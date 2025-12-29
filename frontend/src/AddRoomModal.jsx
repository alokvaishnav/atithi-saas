import { useState } from 'react';
import { X } from 'lucide-react';
import api from './api';

export default function AddRoomModal({ onClose, onRoomAdded }) {
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'SINGLE',
    price: '',
    status: 'AVAILABLE'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/rooms/', formData);
      onRoomAdded(); // Refresh the list
      onClose(); // Close the modal
    } catch (error) {
      alert("Error adding room! Check console.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Add New Room</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Room Number</label>
                <input 
                    type="text" 
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.room_number}
                    onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                    <select 
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                        value={formData.room_type}
                        onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                    >
                        <option value="SINGLE">Single</option>
                        <option value="DOUBLE">Double</option>
                        <option value="SUITE">Suite</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)</label>
                    <input 
                        type="number" 
                        required
                        className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
                {loading ? 'Creating...' : 'Create Room'}
            </button>
        </form>
      </div>
    </div>
  );
}