
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Loader, Search, Filter } from 'lucide-react';
import { getAllEvents } from '../services/eventService';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getAllEvents();

        // Support common API response structures.
        const eventsList = Array.isArray(data)
          ? data
          : Array.isArray(data?.events)
            ? data.events
            : Array.isArray(data?.data?.events)
              ? data.data.events
              : null;

        if (!eventsList) {
          throw new Error('The server returned an unexpected events response.');
        }

        // Hide draft events from public discovery.
        let filtered = eventsList.filter(
          (event) => event && event.status !== 'draft'
        );

        if (selectedCategory !== 'all') {
          filtered = filtered.filter(
            (event) =>
              event.category?.toLowerCase() ===
              selectedCategory.toLowerCase()
          );
        }

        if (isMounted) {
          setEvents(filtered);
        }
      } catch (err) {
        console.error('Failed to load events:', err);

        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Failed to load events. Please check your connection.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const handleCategoryChange = (category) => {
    const updatedParams = new URLSearchParams(searchParams);

    if (category === 'all') {
      updatedParams.delete('category');
    } else {
      updatedParams.set('category', category);
    }

    setSearchParams(updatedParams);
  };

  const displayedEvents = events.filter((event) => {
    const query = searchTerm.toLowerCase().trim();

    return (
      event.title?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query) ||
      event.venue?.toLowerCase().includes(query)
    );
  });

  const categories = [
    'all',
    'music',
    'party',
    'business',
    'arts',
    'sports',
    'education',
    'festival',
  ];

  const formatEventDate = (dateValue) => {
    if (!dateValue) return 'Date to be announced';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Date to be announced';
    }

    return date.toLocaleDateString('en-NG', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (tickets) => {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return null;
    }

    const prices = tickets
      .map((ticket) => Number(ticket.price))
      .filter((price) => Number.isFinite(price) && price >= 0);

    return prices.length ? Math.min(...prices) : null;
  };

  return (
    <div className="discover-page">
      {/* Discover Banner */}
      <div className="discover-banner">
        <h1>Explore Amazing Events</h1>

        <p>
          Discover and book tickets for concerts, parties, workshops,
          and unmissable experiences around you.
        </p>

        <div className="discover-search-wrapper">
          <Search size={22} />

          <input
            type="text"
            placeholder="Search by event title, venue, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search events"
          />
        </div>
      </div>

      <div className="container">
        {/* Category Filters */}
        <div className="category-filters">
          <Filter size={18} className="filter-icon" />

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`filter-pill ${
                selectedCategory === cat ? 'active' : ''
              }`}
              style={{ textTransform: 'capitalize' }}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '100px 0',
              color: 'var(--primary)',
            }}
          >
            <Loader
              className="animate-spin"
              size={45}
              style={{ margin: '0 auto 15px' }}
            />

            <p style={{ color: '#777', fontWeight: '600' }}>
              Finding events...
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="discover-empty">
            <p style={{ color: '#d33', fontWeight: 'bold' }}>{error}</p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : displayedEvents.length === 0 ? (
          /* Empty State */
          <div className="discover-empty">
            <Calendar
              size={50}
              color="#ddd"
              style={{ margin: '0 auto' }}
            />

            <h3>No events found</h3>

            <p>
              Try adjusting your search query or category filter.
            </p>
          </div>
        ) : (
          /* Events Grid */
          <div className="events-grid">
            {displayedEvents.map((event) => {
              const startingPrice = formatPrice(event.tickets);

              return (
                <Link
                  key={event._id}
                  to={`/events/${event._id}`}
                  className="event-card"
                >
                  <div className="event-image">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title || 'Event'}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: '#eee',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#999',
                        }}
                      >
                        No Image
                      </div>
                    )}

                    <span
                      className="event-category"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {event.category || 'Event'}
                    </span>
                  </div>

                  <div className="event-content">
                    <h3>{event.title || 'Untitled Event'}</h3>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginBottom: '15px',
                      }}
                    >
                      <div className="event-meta">
                        <Calendar
                          size={16}
                          style={{ color: 'var(--primary)' }}
                        />

                        <span>{formatEventDate(event.date)}</span>
                      </div>

                      <div className="event-meta">
                        <MapPin
                          size={16}
                          style={{ color: 'var(--primary)' }}
                        />

                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {[event.venue, event.location]
                            .filter(Boolean)
                            .join(', ') || 'Location to be announced'}
                        </span>
                      </div>
                    </div>

                    <div className="event-bottom">
                      <div>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#999',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            display: 'block',
                          }}
                        >
                          Ticket Price
                        </span>

                        <strong
                          style={{ fontSize: '18px', color: '#111' }}
                        >
                          {startingPrice === null
                            ? 'Price unavailable'
                            : `₦${startingPrice.toLocaleString('en-NG')}`}
                        </strong>
                      </div>

                      <span
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                      >
                        Get Tickets
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
