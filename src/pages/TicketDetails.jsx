import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Receipt } from 'lucide-react';
import { getTicketById } from '../services/ticketService';

const TicketDetails = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTicketById(id);
        setTicket(data.ticket);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading ticket...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!ticket) return null;

  const event = ticket.event;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link to="/my-tickets" className="inline-flex items-center text-blue-600 hover:underline mb-6">
        <ArrowLeft size={20} className="mr-1" /> Back to My Tickets
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border">
        {/* Header Image */}
        <div className="h-48 w-full bg-gray-200">
          {event?.image && <img src={event.image} alt={event.title} className="w-full h-full object-cover" />}
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          {/* Left Column: Details */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{event?.title}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                ticket.status === 'valid' ? 'bg-green-100 text-green-800' : 
                ticket.status === 'used' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
              }`}>
                Status: {ticket.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start">
                <Calendar className="mr-3 text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{new Date(event?.date).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="mr-3 text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="font-medium">{event?.venue}</p>
                  <p className="text-sm text-gray-600">{event?.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <User className="mr-3 text-gray-400 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Ticket Holder</p>
                  <p className="font-medium">{ticket.buyer?.name}</p>
                  <p className="text-sm text-gray-600">{ticket.buyer?.email}</p>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg mt-6 border">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <Receipt size={16} className="mr-2" /> Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket Price ({ticket.ticketType})</span>
                  <span>₦{ticket.ticketPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee (7%)</span>
                  <span>₦{ticket.platformFee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-lg">
                  <span>Total Paid</span>
                  <span>₦{ticket.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Ref: {ticket.paymentReference}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code */}
          <div className="w-full md:w-64 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <h3 className="font-bold text-gray-700 mb-4 text-center">Scan at Entry</h3>
            <div className="bg-white p-2 rounded-lg shadow-sm mb-4">
              <img src={ticket.qrCode} alt="Ticket QR Code" className="w-48 h-48" />
            </div>
            <p className="font-mono font-bold text-lg tracking-wider text-center bg-gray-200 px-4 py-2 rounded">
              {ticket.ticketCode}
            </p>
            <p className="text-xs text-gray-500 text-center mt-4">
              Do not share this QR code. It can only be scanned once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;