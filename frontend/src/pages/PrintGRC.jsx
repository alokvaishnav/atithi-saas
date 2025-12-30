import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2, MapPin, Phone, Mail, Building2 } from 'lucide-react';
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
        try {
            const res = await fetch(`${API_URL}/api/bookings/${bookingId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setBooking(await res.json());
        } catch (err) {
            console.error("Error fetching GRC:", err);
        }
    };
    fetchBooking();
  }, [bookingId]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `GRC_${bookingId}_${booking?.guest_details?.full_name || 'Guest'}`,
  });

  if (!booking) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={32}/> 
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Generating GRC Form...</span>
    </div>
  );

  return (
    <div className="p-8 bg-slate-100 min-h-screen font-sans">
      
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center max-w-[210mm] mx-auto mb-8 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
            <ArrowLeft size={20}/> Back to Bookings
        </button>
        <button 
            onClick={handlePrint} 
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg"
        >
            <Printer size={18}/> Print Form C
        </button>
      </div>

      {/* PRINTABLE AREA (A4 Width approx) */}
      <div className="bg-white p-[10mm] max-w-[210mm] mx-auto shadow-2xl border border-slate-200" ref={printRef}>
        
        {/* 1. HEADER */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
            <div className="flex gap-4">
                <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center rounded-lg">
                    <Building2 size={32}/>
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{booking.hotel_name || "ATITHI GRAND HOTEL"}</h1>
                    <div className="text-xs font-medium text-slate-500 space-y-1 mt-1">
                        <p className="flex items-center gap-1"><MapPin size={10}/> 123, Hospitality Lane, Metro City, India - 400001</p>
                        <p className="flex items-center gap-1"><Phone size={10}/> +91 98765 43210 • <Mail size={10}/> reservations@atithi.com</p>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-300">Form C</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mt-1">Guest Registration Card</p>
            </div>
        </div>

        {/* 2. REGISTRATION DETAILS */}
        <div className="grid grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">GRC Number</span>
                <span className="text-sm font-bold text-slate-900">#{booking.id}</span>
            </div>
            <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Room No</span>
                <span className="text-sm font-bold text-slate-900">{booking.room_details?.room_number || "Unassigned"}</span>
            </div>
            <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Arrival Date</span>
                <span className="text-sm font-bold text-slate-900">{booking.check_in_date}</span>
            </div>
            <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Departure Date</span>
                <span className="text-sm font-bold text-slate-900">{booking.check_out_date}</span>
            </div>
        </div>

        {/* 3. GUEST INFORMATION */}
        <div className="mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-800">Guest Information</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                
                <div className="col-span-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Full Name</span>
                    <div className="border-b border-slate-300 pb-1 text-base font-bold text-slate-900 uppercase">
                        {booking.guest_details?.full_name}
                    </div>
                </div>

                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Nationality</span>
                    <div className="border-b border-slate-300 pb-1 text-sm font-medium">
                        {booking.guest_details?.nationality || "Indian"}
                    </div>
                </div>

                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Date of Birth</span>
                    <div className="border-b border-slate-300 pb-1 text-sm font-medium">
                        {booking.guest_details?.dob || "_________________"}
                    </div>
                </div>

                <div className="col-span-2">
                    <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Permanent Address</span>
                    <div className="border-b border-slate-300 pb-1 text-sm font-medium h-12">
                        {booking.guest_details?.address}
                    </div>
                </div>

                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Mobile Number</span>
                    <div className="border-b border-slate-300 pb-1 text-sm font-medium">
                        {booking.guest_details?.phone}
                    </div>
                </div>

                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Email Address</span>
                    <div className="border-b border-slate-300 pb-1 text-sm font-medium">
                        {booking.guest_details?.email}
                    </div>
                </div>
            </div>
        </div>

        {/* 4. IDENTITY & TRAVEL */}
        <div className="grid grid-cols-2 gap-8 mt-6">
            {/* Left: Identity */}
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-800">Identity Proof</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">ID Type</span>
                        <div className="border-b border-slate-300 pb-1 text-sm font-medium">
                            {booking.guest_details?.id_proof_type || "Aadhar/Passport"}
                        </div>
                    </div>
                    <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">ID Number</span>
                        <div className="border-b border-slate-300 pb-1 text-sm font-medium">
                            {booking.guest_details?.id_proof_number || "_________________"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Stay Details */}
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest border-b border-slate-200 pb-1 mb-4 text-slate-800">Stay Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Arriving From</span>
                        <div className="border-b border-slate-300 pb-1 text-sm font-medium">_________________</div>
                    </div>
                    <div>
                        <span className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Proceeding To</span>
                        <div className="border-b border-slate-300 pb-1 text-sm font-medium">_________________</div>
                    </div>
                </div>
            </div>
        </div>

        {/* 5. FINANCIALS & PAX */}
        <div className="mt-6 border border-slate-800 p-4 rounded-lg">
             <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Pax (Adults/Kids)</span>
                    <span className="text-sm font-bold">2 / 0</span>
                </div>
                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Room Tariff</span>
                    <span className="text-sm font-bold">₹{booking.total_amount} / Night</span>
                </div>
                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Advance Paid</span>
                    <span className="text-sm font-bold">₹0.00</span>
                </div>
                <div>
                    <span className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Billing Instr.</span>
                    <span className="text-sm font-bold">Direct Payment</span>
                </div>
             </div>
        </div>

        {/* 6. TERMS & CONDITIONS */}
        <div className="mt-6 text-[9px] text-justify text-slate-500 leading-tight">
            <p className="font-bold uppercase text-slate-800 mb-1">Terms & Conditions:</p>
            <ol className="list-decimal pl-3 space-y-0.5">
                <li>The management is not responsible for the loss of guest's valuables. Please use the safe deposit lockers.</li>
                <li>Check-out time is 11:00 AM. Late check-out is subject to availability and extra charges.</li>
                <li>Visitors are not allowed in the room after 10:00 PM. They must register at the reception.</li>
                <li>I agree to settle all my bills before check-out. In case of default, the management has a lien on my luggage and belongings.</li>
                <li>I authorize the hotel to charge my credit card for any damages caused to the hotel property during my stay.</li>
            </ol>
        </div>

        {/* 7. SIGNATURES */}
        <div className="grid grid-cols-2 gap-20 mt-12 pt-4">
            <div className="text-center">
                <div className="h-12 border-b border-slate-800 mb-2"></div>
                <p className="font-bold text-[10px] uppercase tracking-widest text-slate-900">Guest Signature</p>
                <p className="text-[8px] text-slate-400">I have read and agreed to the terms.</p>
            </div>
            <div className="text-center">
                <div className="h-12 border-b border-slate-800 mb-2 flex items-end justify-center pb-2">
                    <span className="text-xs font-script text-slate-400">Authorized Signatory</span>
                </div>
                <p className="font-bold text-[10px] uppercase tracking-widest text-slate-900">Receptionist / Manager</p>
            </div>
        </div>

        {/* 8. OFFICE USE ONLY */}
        <div className="mt-8 bg-slate-100 border border-slate-300 p-2 rounded flex justify-between items-center px-4">
            <span className="text-[9px] font-black uppercase text-slate-400">For Office Use Only</span>
            <div className="flex gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-slate-400"></div>
                    <span className="text-[9px] font-bold uppercase text-slate-600">ID Verified</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-slate-400"></div>
                    <span className="text-[9px] font-bold uppercase text-slate-600">Visa Verified</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-slate-400"></div>
                    <span className="text-[9px] font-bold uppercase text-slate-600">C-Form Submitted</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PrintGRC;