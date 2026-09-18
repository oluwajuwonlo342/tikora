import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket as TicketIcon, Loader, QrCode, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyTickets = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/tickets/my-tickets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTickets(response.data.tickets || response.data);
      } catch (err) {
        setError('Failed to load your tickets.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTickets();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Loader className="animate-spin" size={45} style={{ margin: '0 auto 15px', color: 'var(--primary)' }} />
        <p style={{ color: '#777', fontWeight: '600' }}>Loading your tickets...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container" style={{ textAlign: 'center', padding: '80px', color: '#d33' }}>{error}</div>;
  }

  return (
    <div className="container my-tickets-page">
      <div className="my-tickets-header">
        <h1>My Tickets</h1>
        <p>Access your purchased event tickets, entry codes, and scannable QR passes.</p>
      </div>

      {tickets.length === 0 ? (
        <div className="dashboard-empty" style={{ background: 'white', border: '1px dashed #ddd', borderRadius: '20px', padding: '60px 20px', textAlign: 'center' }}>
          <div className="empty-icon"><TicketIcon size={30} /></div>
          <h3>No tickets purchased yet</h3>
          <p>Explore upcoming events and secure your spot today.</p>
          <Link to="/events" className="btn btn-primary" style={{ marginTop: '15px', display: 'inline-flex' }}>
            Discover Events
          </Link>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => {
            const event = ticket.event || {};
            const formattedDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            }) : 'TBD';

            return (
              <div key={ticket._id} className="ticket-item-card">
                <div className="ticket-item-top">
                  <span>{ticket.ticketType || 'Standard Ticket'}</span>
                  <span className={`ticket-status-badge ${ticket.status === 'used' ? 'status-used' : ticket.status === 'cancelled' ? 'status-cancelled' : 'status-active'}`}>
                    {ticket.status || 'Active'}
                  </span>
                </div>

                <div className="ticket-item-body">
                  <h3>{event.title || 'Special Event'}</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="ticket-meta-row">
                      <Calendar size={16} style={{ color: 'var(--primary)' }} />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="ticket-meta-row">
                      <MapPin size={16} style={{ color: 'var(--primary)' }} />
                      <span>{event.venue || 'Venue TBA'}, {event.location || ''}</span>
                    </div>
                  </div>

                  <div className="ticket-code-box">
                    <div>
                      <span>Ticket Code</span>
                      <strong>{ticket.ticketCode}</strong>
                    </div>
                    <Link to={`/tickets/${ticket._id}`} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '12px' }}>
                      <QrCode size={16} /> View QR
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTickets;