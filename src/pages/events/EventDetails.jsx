import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Ticket as TicketIcon, Loader } from 'lucide-react';
import axios from 'axios';
import TicketPurchaseModal from '../../components/TicketPurchaseModal';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal and Selection State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [preSelectedTicketId, setPreSelectedTicketId] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiUrl}/events/${id}`);
        setEvent(response.data.event || response.data);
      } catch (err) {
        setError('Failed to load event details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Loader size={40} className="animate-spin" /></div>;
  if (error || !event) return <div style={{ textAlign: 'center', padding: '100px', color: 'red' }}>{error || 'Event not found'}</div>;

  const handleTierClick = (ticketId) => {
    setPreSelectedTicketId(ticketId);
    setShowPurchaseModal(true);
  };

  const handleBuyClick = () => {
    setPreSelectedTicketId(null);
    setShowPurchaseModal(true);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-NG', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="container event-details-container">
      <Link to={token ? "/dashboard" : "/events"} className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textDecoration: 'none', color: '#555', fontWeight: '600' }}>
        <ArrowLeft size={18} />
        {token ? "Back to Dashboard" : "Back to Events"}
      </Link>

      {/* FIX: explicit responsive height + object-fit: contain so the whole poster is always visible.
          The className is removed so stylesheet rules (.event-banner / .event-banner img)
          can't override these inline styles. */}
      <div
        style={{
          width: '100%',
          height: 'clamp(280px, 60vh, 600px)',
          backgroundColor: '#0a0a0a',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '40px'
        }}
      >
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        ) : (
          <div style={{ color: '#fff', fontWeight: 'bold' }}>No Image Available</div>
        )}
      </div>

      <div className="event-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        <div className="event-main">
          <span className="event-badge" style={{ textTransform: 'capitalize', background: '#eee', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
            {event.category || 'Event'}
          </span>
          <h1 className="event-title" style={{ fontSize: '36px', color: '#111', margin: '15px 0' }}>{event.title}</h1>
          <p className="event-desc" style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '30px' }}>{event.description}</p>

          <div className="event-meta-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="meta-row" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div className="meta-icon" style={{ background: '#fff0eb', padding: '12px', borderRadius: '12px', color: '#ff5a36' }}>
                <Calendar size={24} />
              </div>
              <div className="meta-info">
                <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#111' }}>Date & Time</h4>
                <p style={{ margin: 0, color: '#555', fontSize: '15px' }}>Start: {formatDateTime(event.date)}</p>
                {event.endDate && <p style={{ margin: '4px 0 0 0', color: '#555', fontSize: '15px' }}>End: {formatDateTime(event.endDate)}</p>}
              </div>
            </div>

            <div className="meta-row" style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div className="meta-icon" style={{ background: '#fff0eb', padding: '12px', borderRadius: '12px', color: '#ff5a36' }}>
                <MapPin size={24} />
              </div>
              <div className="meta-info">
                <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#111' }}>Location</h4>
                <p style={{ margin: 0, color: '#555', fontSize: '15px', fontWeight: '500' }}>{event.venue}</p>
                <p style={{ color: '#777', fontSize: '14px', margin: '4px 0 0 0' }}>{event.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="ticket-sidebar" style={{ background: '#f8f9fa', padding: '30px', borderRadius: '16px', border: '1px solid #eee' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', margin: '0 0 20px 0' }}>
              <TicketIcon size={24} color="#ff5a36" /> Ticket Tiers
            </h3>

            <div className="tier-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              {event.tickets?.map((tier) => {
                const available = tier.quantity - tier.sold;
                const isAvailable = available > 0;

                return (
                  <div
                    key={tier._id || tier.name}
                    className="tier-card"
                    onClick={() => isAvailable && handleTierClick(tier._id)}
                    style={{
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      opacity: isAvailable ? 1 : 0.6,
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      padding: '15px',
                      borderRadius: '12px',
                      transition: 'border-color 0.2s ease, transform 0.1s ease',
                    }}
                    onMouseEnter={(e) => isAvailable && (e.currentTarget.style.borderColor = '#ff5a36')}
                    onMouseLeave={(e) => isAvailable && (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <div className="tier-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '16px', color: '#111' }}>{tier.name}</strong>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff5a36' }}>
                        {tier.price === 0 ? 'FREE' : `₦${tier.price?.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleBuyClick}
              className="btn btn-primary buy-btn"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', background: '#ff5a36', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Get Tickets Now
            </button>
          </div>
        </div>
      </div>

      {showPurchaseModal && (
        <TicketPurchaseModal
          event={event}
          onClose={() => setShowPurchaseModal(false)}
          initialTicketId={preSelectedTicketId}
        />
      )}
    </div>
  );
};

export default EventDetails;
