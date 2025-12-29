import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../config';

const PrintGRC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const printRef = useRef();
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchBooking = async () => {
        const res = await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setBooking(await res.json());
    };
    fetchBooking();
  }, [bookingId]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `GRC_${bookingId}`,
  });

  if (!booking) return <div className="p-20 text-center"><Loader2 className="animate-spin inline"/> Generating GRC...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold"><ArrowLeft size={20}/> Back</button>
        <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2">
            <Printer size={16}/> Print Card
        </button>
      </div>

      <div className="bg-white p-12 max-w-4xl mx-auto shadow-xl border border-slate-200" ref={printRef}>
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8">
            <h1 className="text-3xl font-black uppercase tracking-widest mb-2">{booking.hotel_name || "HOTEL REGISTRATION CARD"}</h1>
            <p className="text-sm font-bold uppercase tracking-widest">Guest Registration Form (Form C)</p>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 text-sm">
            
            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registration No</span>
                <span className="text-lg font-bold">#{booking.id}</span>
            </div>
            
            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date of Arrival</span>
                <span className="text-lg font-bold">{booking.check_in_date}</span>
            </div>

            <div className="col-span-2 border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Guest Name</span>
                <span className="text-xl font-black uppercase">{booking.guest_details?.full_name}</span>
            </div>

            <div className="col-span-2 border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Address</span>
                <span className="text-base font-medium">{booking.guest_details?.address || "N/A"}</span>
            </div>

            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nationality</span>
                <span className="text-base font-bold">Indian</span>
            </div>

            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mobile Number</span>
                <span className="text-base font-bold">{booking.guest_details?.phone}</span>
            </div>

            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Room Number</span>
                <span className="text-xl font-black">{booking.room_details?.room_number}</span>
            </div>

            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Room Rate</span>
                <span className="text-base font-bold">₹{booking.total_amount}</span>
            </div>

            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Arrival From</span>
                <span className="text-base font-medium">_______________________</span>
            </div>

            <div className="border-b border-slate-200 pb-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Proceeding To</span>
                <span className="text-base font-medium">_______________________</span>
            </div>

        </div>

        {/* Footer Signatures */}
        <div className="grid grid-cols-2 gap-20 mt-20 pt-10 border-t-2 border-black">
            <div className="text-center">
                <p className="font-bold text-xs uppercase tracking-widest">Guest Signature</p>
            </div>
            <div className="text-center">
                <p className="font-bold text-xs uppercase tracking-widest">Manager Signature</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PrintGRC;