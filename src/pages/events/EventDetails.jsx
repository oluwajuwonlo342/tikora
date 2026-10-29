import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  Loader
} from 'lucide-react';
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
    let isMounted = true;

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const apiUrl =
          import.meta.env.VITE_API_URL ||
          'http://localhost:5000/api';

        const response = await axios.get(
          `${apiUrl}/events/${id}`
        );

        const eventData =
          response.data?.event || response.data;

        if (!eventData || typeof eventData !== 'object') {
          throw new Error('Invalid event data');
        }

        if (isMounted) {
          setEvent(eventData);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);

        if (isMounted) {
          setError('Failed to load event details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEventDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Safely format dates
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Date not available';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString('en-NG', {
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

  // Safely format ticket prices
  const formatPrice = (price) => {
    if (price === undefined || price === null || price === '') {
      return 'Price unavailable';
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
      return 'Price unavailable';
    }

    if (numericPrice === 0) {
      return 'FREE';
    }

    return `₦${numericPrice.toLocaleString('en-NG')}`;
  };

  // Get event image safely
  const getEventImage = (image) => {
    if (!image) return null;

    if (typeof image === 'string') {
      return image;
    }

    if (typeof image === 'object') {
      return image.url || image.secure_url || null;
    }

    return null;
  };

  // Open purchase modal for a specific ticket
  const handleTierClick = (ticketId) => {
    setPreSelectedTicketId(ticketId);
    setShowPurchaseModal(true);
  };

  // Open purchase modal without a selected ticket
  const handleBuyClick = () => {
    setPreSelectedTicketId(null);
    setShowPurchaseModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '100px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Loader
          size={40}
          className="animate-spin"
        />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '100px',
          color: 'red'
        }}
      >
        {error || 'Event not found'}
      </div>
    );
  }

  const eventImage = getEventImage(event.image);

  const tickets = Array.isArray(event.tickets)
    ? event.tickets
    : [];

  return (
    <div className="container event-details-container">

      {/* BACK BUTTON */}
      <Link
        to={token ? '/dashboard' : '/events'}
        className="back-link"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          textDecoration: 'none',
          color: '#555',
          fontWeight: '600'
        }}
      >
        <ArrowLeft size={18} />

        {token
          ? 'Back to Dashboard'
          : 'Back to Events'}
      </Link>

      {/* EVENT BANNER */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#0a0a0a',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '40px'
        }}
      >
        {eventImage ? (
          <img
            src={eventImage}
            alt={event.title || 'Event Banner'}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              maxHeight: '600px',
              objectFit: 'contain'
            }}
          />
        ) : (
          <div
            style={{
              padding: '100px 20px',
              color: '#fff',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            No Image Available
          </div>
        )}
      </div>

      {/* EVENT LAYOUT */}
      <div
        className="event-layout"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '40px'
        }}
      >

        {/* EVENT INFORMATION */}
        <div className="event-main">

          {/* CATEGORY */}
          <span
            className="event-badge"
            style={{
              textTransform: 'capitalize',
              background: '#eee',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#555'
            }}
          >
            {event.category || 'Event'}
          </span>

          {/* EVENT TITLE */}
          <h1
            className="event-title"
            style={{
              fontSize: '36px',
              color: '#111',
              margin: '15px 0'
            }}
          >
            {event.title || 'Untitled Event'}
          </h1>

          {/* EVENT DESCRIPTION */}
          <p
            className="event-desc"
            style={{
              color: '#555',
              lineHeight: '1.6',
              fontSize: '16px',
              marginBottom: '30px'
            }}
          >
            {event.description ||
              'No event description available.'}
          </p>

          {/* EVENT META INFORMATION */}
          <div
            className="event-meta-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >

            {/* DATE AND TIME */}
            <div
              className="meta-row"
              style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-start'
              }}
            >
              <div
                className="meta-icon"
                style={{
                  background: '#fff0eb',
                  padding: '12px',
                  borderRadius: '12px',
                  color: '#ff5a36'
                }}
              >
                <Calendar size={24} />
              </div>

              <div className="meta-info">
                <h4
                  style={{
                    margin: '0 0 5px 0',
                    fontSize: '16px',
                    color: '#111'
                  }}
                >
                  Date & Time
                </h4>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                    fontSize: '15px'
                  }}
                >
                  Start: {formatDateTime(event.date)}
                </p>

                {event.endDate && (
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      color: '#555',
                      fontSize: '15px'
                    }}
                  >
                    End: {formatDateTime(event.endDate)}
                  </p>
                )}
              </div>
            </div>

            {/* LOCATION */}
            <div
              className="meta-row"
              style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-start'
              }}
            >
              <div
                className="meta-icon"
                style={{
                  background: '#fff0eb',
                  padding: '12px',
                  borderRadius: '12px',
                  color: '#ff5a36'
                }}
              >
                <MapPin size={24} />
              </div>

              <div className="meta-info">
                <h4
                  style={{
                    margin: '0 0 5px 0',
                    fontSize: '16px',
                    color: '#111'
                  }}
                >
                  Location
                </h4>

                <p
                  style={{
                    margin: 0,
                    color: '#555',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}
                >
                  {event.venue || 'Venue not specified'}
                </p>

                <p
                  style={{
                    color: '#777',
                    fontSize: '14px',
                    margin: '4px 0 0 0'
                  }}
                >
                  {event.location ||
                    'Location not specified'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* TICKET SIDEBAR */}
        <div>
          <div
            className="ticket-sidebar"
            style={{
              background: '#f8f9fa',
              padding: '30px',
              borderRadius: '16px',
              border: '1px solid #eee'
            }}
          >

            {/* TICKET HEADING */}
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '20px',
                margin: '0 0 20px 0'
              }}
            >
              <TicketIcon
                size={24}
                color="#ff5a36"
              />

              Ticket Tiers
            </h3>

            {/* TICKET LIST */}
            <div
              className="tier-list"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginBottom: '25px'
              }}
            >
              {tickets.length > 0 ? (
                tickets.map((tier, index) => {

                  if (!tier) return null;

                  const quantity = Number(
                    tier.quantity ?? 0
                  );

                  const sold = Number(
                    tier.sold ?? 0
                  );

                  const available = quantity - sold;

                  const isAvailable =
                    Number.isFinite(available) &&
                    available > 0;

                  return (
                    <div
                      key={tier._id || tier.name || index}
                      className="tier-card"
                      onClick={() => {
                        if (isAvailable) {
                          handleTierClick(tier._id);
                        }
                      }}
                      style={{
                        cursor: isAvailable
                          ? 'pointer'
                          : 'not-allowed',
                        opacity: isAvailable ? 1 : 0.6,
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        padding: '15px',
                        borderRadius: '12px',
                        transition:
                          'border-color 0.2s ease, transform 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (isAvailable) {
                          e.currentTarget.style.borderColor =
                            '#ff5a36';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isAvailable) {
                          e.currentTarget.style.borderColor =
                            '#e5e7eb';
                        }
                      }}
                    >

                      {/* TICKET NAME AND PRICE */}
                      <div
                        className="tier-header"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '16px',
                            color: '#111'
                          }}
                        >
                          {tier.name || 'General Ticket'}
                        </strong>

                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#ff5a36',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatPrice(tier.price)}
                        </span>
                      </div>

                      {/* TICKET AVAILABILITY */}
                      <div
                        style={{
                          marginTop: '12px',
                          fontSize: '13px',
                          color: isAvailable
                            ? '#16a34a'
                            : '#dc2626',
                          fontWeight: '600'
                        }}
                      >
                        {isAvailable
                          ? `${available.toLocaleString('en-NG')} tickets available`
                          : 'Sold Out'}
                      </div>

                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: '#fff',
                    borderRadius: '12px',
                    color: '#777',
                    fontSize: '14px'
                  }}
                >
                  No ticket tiers available.
                </div>
              )}
            </div>

            {/* BUY TICKETS BUTTON */}
            <button
              onClick={handleBuyClick}
              disabled={
                !tickets.some((tier) => {
                  if (!tier) return false;

                  const quantity = Number(
                    tier.quantity ?? 0
                  );

                  const sold = Number(
                    tier.sold ?? 0
                  );

                  return (
                    Number.isFinite(quantity) &&
                    Number.isFinite(sold) &&
                    quantity > sold
                  );
                })
              }
              className="btn btn-primary buy-btn"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: '#ff5a36',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Get Tickets Now
            </button>

          </div>
        </div>

      </div>

      {/* TICKET PURCHASE MODAL */}
      {showPurchaseModal && (
        <TicketPurchaseModal
          event={event}
          onClose={() => {
            setShowPurchaseModal(false);
            setPreSelectedTicketId(null);
          }}
          initialTicketId={preSelectedTicketId}
        />
      )}

    </div>
  );
};

export default EventDetails;
