import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Ticket as TicketIcon, Loader } from 'lucide-react';
import axios from 'axios';
import TicketPurchaseModal from '../../components/TicketPurchaseModal'; 

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`https://tikora-backend.onrender.com/api/events/${id}`);
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

  if (loading) return <div style={{textAlign: 'center', padding: '100px'}}><Loader size={40} /></div>;
  if (error || !event) return <div style={{textAlign: 'center', padding: '100px', color: 'red'}}>{error || 'Event not found'}</div>;

const handleBuyClick = () => {
    setShowPurchaseModal(true);
  };

  return (
    <div className="container event-details-container">
      <Link to={token ? "/dashboard" : "/events"} className="back-link">
        <ArrowLeft size={18} /> 
        {token ? "Back to Dashboard" : "Back to Events"}
      </Link>

      <div className="event-banner">
        {event.image ? (
          <img src={event.image} alt={event.title} />
        ) : (
          <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>No Image</div>
        )}
      </div>

      <div className="event-layout">
        <div className="event-main">
          <span className="event-badge">{event.category || 'Event'}</span>
          <h1 className="event-title">{event.title}</h1>
          <p className="event-desc">{event.description}</p>

          <div className="event-meta-section">
            <div className="meta-row">
              <div className="meta-icon"><Calendar size={22} /></div>
              <div className="meta-info">
                <h4>Date & Time</h4>
                <p>Start: {new Date(event.date).toLocaleString()}</p>
                {event.endDate && <p>End: {new Date(event.endDate).toLocaleString()}</p>}
              </div>
            </div>

            <div className="meta-row">
              <div className="meta-icon"><MapPin size={22} /></div>
              <div className="meta-info">
                <h4>Location</h4>
                <p>{event.venue}</p>
                <p style={{color: '#666', fontWeight: '400', fontSize: '14px', marginTop: '3px'}}>{event.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="ticket-sidebar">
            <h3><TicketIcon size={24} color="var(--primary)" /> Ticket Tiers</h3>
            
            <div className="tier-list">
              {event.tickets?.map((tier) => {
                const available = tier.quantity - tier.sold;
                return (
                  <div key={tier.name} className="tier-card">
                    <div className="tier-header">
                      <strong>{tier.name}</strong>
                      <span>₦{tier.price?.toLocaleString()}</span>
                    </div>
                    <p>{available > 0 ? `${available} tickets available` : 'Sold out'}</p>
                  </div>
                );
              })}
            </div>

         <button onClick={handleBuyClick} className="btn btn-primary buy-btn">
    Get Tickets Now
  </button>
          </div>
        </div>
      </div>

      {showPurchaseModal && (
        <TicketPurchaseModal event={event} onClose={() => setShowPurchaseModal(false)} />
      )}
    </div>
  );
};

export default EventDetails;
