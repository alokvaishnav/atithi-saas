import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';

const PrintGRC = () => {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const token = localStorage.getItem('access_token');

    useEffect(() => {
        fetch(`${API_URL}/api/bookings/${bookingId}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setBooking(data))
        .catch(err => console.error("Error loading GRC:", err));
    }, [bookingId]);

    if (!booking) return (
        <div className="flex h-screen items-center justify-center font-bold text-blue-600">
            Fetching Secure Legal Document...
        </div>
    );

    return (
        <div className="bg-white p-8 sm:p-12 max-w-[850px] mx-auto text-slate-900 font-serif" id="grc-content">
            
            {/* 🏨 HOTEL BRANDING & HEADER */}
            <div className="flex justify-between items-start border-b-4 border-double border-slate-900 pb-6 mb-8">
                <div className="brand">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">ATITHI HOTEL</h1>
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">Luxury & Hospitality Redefined</p>
                    <p className="text-[10px] mt-2 text-slate-400">GSTIN: 27AABCA1234A1Z5 | Contact: +91 98765 43210</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase underline">Guest Registration Card</h2>
                    <p className="text-sm font-bold mt-1">Reg No: #{booking.id}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Date: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* 👤 GUEST & STAY INFORMATION GRID */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm mb-10">
                <div className="space-y-4">
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Guest Name:</span>
                        <span className="font-bold">{booking.guest_details?.full_name}</span>
                    </p>
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Identity Proof:</span>
                        <span className="font-bold">{booking.guest_details?.id_type || '_________'} - {booking.guest_details?.id_proof_number || '_________'}</span>
                    </p>
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Coming From:</span>
                        <span className="font-bold">{booking.coming_from || '_________________'}</span>
                    </p>
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Going To:</span>
                        <span className="font-bold">{booking.going_to || '_________________'}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Room Number:</span>
                        <span className="font-bold">RM {booking.room_details?.room_number} ({booking.room_details?.room_type})</span>
                    </p>
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Check-In:</span>
                        <span className="font-bold">{new Date(booking.check_in_date).toLocaleString()}</span>
                    </p>
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Check-Out:</span>
                        <span className="font-bold">{new Date(booking.check_out_date).toLocaleString()}</span>
                    </p>
                    <p className="border-b border-slate-200 pb-1 flex justify-between">
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Purpose of Visit:</span>
                        <span className="font-bold">{booking.purpose_of_visit}</span>
                    </p>
                </div>
            </div>

            {/* 💰 FINANCIAL SUMMARY BOX */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Booking Summary</h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Total Estimated Charges</p>
                        <p className="text-2xl font-black text-slate-900">₹{parseFloat(booking.total_amount).toLocaleString()}</p>
                    </div>
                    <div className="text-right border-l border-slate-300 pl-10">
                        <p className="text-xs text-slate-500 font-bold uppercase">Advance Deposit Received</p>
                        <p className="text-2xl font-black text-green-600">₹{parseFloat(booking.advance_paid).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* 📄 TERMS & CONDITIONS */}
            <div className="mt-8">
                <h3 className="font-black text-[10px] uppercase text-slate-500 mb-3 tracking-widest">Management Policies & Conditions</h3>
                <div className="text-[10px] space-y-2 text-slate-600 leading-tight">
                    <p>1. The hotel is not responsible for any loss of guest property, valuables, or money not deposited in the management safe.</p>
                    <p>2. Guests are requested to vacate the room by 11:00 AM on the day of departure. Late checkout is subject to availability and extra fee.</p>
                    <p>3. Visitors are not allowed in the guest rooms after 10:00 PM as per local security regulations.</p>
                    <p>4. I, the undersigned, agree to be personally liable for the full payment of the total amount of charges incurred during my stay.</p>
                    <p>5. Valid Government ID proof is mandatory for all occupants as per local law.</p>
                </div>
            </div>

            {/* ✍️ SIGNATURE SECTION */}
            <div className="mt-20 flex justify-between px-4 pb-20">
                <div className="text-center">
                    <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Guest Signature</p>
                </div>
                <div className="text-center">
                    <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Front Office Manager</p>
                </div>
            </div>

            {/* 🖨️ PRINT CONTROL (Hidden during print) */}
            <div className="mt-10 no-print flex justify-center gap-4">
                <button 
                    onClick={() => window.close()}
                    className="bg-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-300 transition"
                >
                    Close Window
                </button>
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-2"
                >
                    Confirm & Print Legal GRC
                </button>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    #grc-content { 
                        border: none !important; 
                        max-width: 100% !important; 
                        width: 100% !important; 
                        padding: 0 !important; 
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default PrintGRC;