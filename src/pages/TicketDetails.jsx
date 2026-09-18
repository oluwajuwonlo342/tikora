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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading ticket...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (!ticket) return null;

  const event = ticket.event;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Back Button */}
      <Link 
        to="/my-tickets" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          color: '#2563eb', 
          textDecoration: 'none', 
          marginBottom: '24px',
          fontWeight: '500'
        }}
      >
        <ArrowLeft size={18} style={{ marginRight: '6px' }} /> Back to My Tickets
      </Link>

      {/* Main Ticket Card */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        
        {/* Header Image */}
        <div style={{ height: '200px', width: '100%', backgroundColor: '#f3f4f6' }}>
          {event?.image && (
            <img 
              src={event.image} 
              alt={event.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          )}
        </div>

        {/* Ticket Body (Two Columns) */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '32px', 
          padding: '32px' 
        }}>
          
          {/* LEFT COLUMN: Details */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Title & Status */}
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#111827' }}>
                {event?.title}
              </h1>
              <span style={{ 
                display: 'inline-block',
                padding: '6px 12px', 
                borderRadius: '999px', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                textTransform: 'uppercase',
                backgroundColor: ticket.status === 'valid' ? '#dcfce7' : ticket.status === 'used' ? '#f3f4f6' : '#fee2e2',
                color: ticket.status === 'valid' ? '#166534' : ticket.status === 'used' ? '#374151' : '#991b1b'
              }}>
                Status: {ticket.status}
              </span>
            </div>

            {/* Icon Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Calendar color="#9ca3af" size={22} style={{ marginTop: '2px' }} />
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>Date & Time</p>
                  <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>
                    {new Date(event?.date).toLocaleString('en-NG', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin color="#9ca3af" size={22} style={{ marginTop: '2px' }} />
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>Venue</p>
                  <p style={{ margin: 0, fontWeight: '500', color: '#1f2937' }}>{event?.venue}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>{event?.location}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <User color="#9ca3af" size={22} style={{ marginTop: '2px' }} />
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>Ticket Holder</p>
                  <p style={{ margin: 0, fontWeight: '500', color: '#1f2937', textTransform: 'capitalize' }}>
                    {ticket.buyer?.name}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#4b5563' }}>{ticket.buyer?.email}</p>
                </div>
              </div>

            </div>

            {/* Financial Breakdown */}
            <div style={{ 
              backgroundColor: '#f9fafb', 
              padding: '20px', 
              borderRadius: '12px', 
              marginTop: '16px',
              border: '1px solid #e5e7eb' 
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#374151', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} /> Payment Summary
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Ticket Price ({ticket.ticketType})</span>
                  <span>₦{ticket.ticketPrice?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                  <span>Platform Fee (7%)</span>
                  <span>₦{ticket.platformFee?.toLocaleString()}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d1d5db', paddingTop: '12px', marginTop: '4px', fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>
                  <span>Total Paid</span>
                  <span>₦{ticket.totalAmount?.toLocaleString()}</span>
                </div>
                
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                  Ref: {ticket.paymentReference}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: QR Code */}
          <div style={{ 
            flex: '1 1 250px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '32px 24px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '16px', 
            border: '2px dashed #cbd5e1' 
          }}>
            <h3 style={{ fontWeight: 'bold', color: '#334155', margin: '0 0 20px 0', textAlign: 'center' }}>
              Scan at Entry
            </h3>
            
            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '20px' }}>
              <img 
                src={ticket.qrCode} 
                alt="Ticket QR Code" 
                style={{ width: '180px', height: '180px', objectFit: 'contain' }} 
              />
            </div>
            
            <p style={{ 
              fontFamily: 'monospace', 
              fontWeight: 'bold', 
              fontSize: '16px', 
              letterSpacing: '2px', 
              textAlign: 'center', 
              backgroundColor: '#e2e8f0', 
              padding: '8px 16px', 
              borderRadius: '6px',
              margin: '0 0 16px 0',
              color: '#0f172a'
            }}>
              {ticket.ticketCode}
            </p>
            
            <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
              Do not share this QR code.<br/>It can only be scanned once.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
