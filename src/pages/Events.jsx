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
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getAllEvents();
        const eventsList = data.events || data;

        let filtered = eventsList.filter(event => event.status !== 'draft');

        if (selectedCategory && selectedCategory !== 'all') {
          filtered = filtered.filter(
            event => event.category?.toLowerCase() === selectedCategory.toLowerCase()
          );
        }

        setEvents(filtered);
      } catch (err) {
        setError('Failed to load events. Please check your connection.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCategory]);

  const handleCategoryChange = (category) => {
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const displayedEvents = events.filter(event => 
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['all', 'music', 'party', 'business', 'arts', 'sports', 'education', 'festival'];

  return (
    <div className="discover-page">
      
      {/* Premium Dark Header */}
      <div className="discover-banner">
        <h1>Explore Amazing Events</h1>
        <p>Discover and book tickets for concerts, parties, workshops, and unmissable experiences around you.</p>

        <div className="discover-search-wrapper">
          <Search size={22} />
          <input 
            type="text"
            placeholder="Search by event title, venue, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="container">
        
        {/* Category Filter Pills */}
        <div className="category-filters">
          <Filter size={18} className="filter-icon" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`filter-pill ${selectedCategory === cat || (cat === 'all' && !searchParams.get('category')) ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic State Rendering */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--primary)' }}>
            <Loader className="animate-spin" size={45} style={{ margin: '0 auto 15px' }} />
            <p style={{ color: '#777', fontWeight: '600' }}>Finding events...</p>
          </div>
        ) : error ? (
          <div className="discover-empty">
            <p style={{ color: '#d33', fontWeight: 'bold' }}>{error}</p>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="discover-empty">
            <Calendar size={50} color="#ddd" style={{ margin: '0 auto' }} />
            <h3>No events found</h3>
            <p>Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          
          /* The Standard Event Grid */
          <div className="events-grid">
            {displayedEvents.map((event) => {
              const startingPrice = event.tickets?.length > 0 
                ? Math.min(...event.tickets.map(t => t.price))
                : 0;

              const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
              });

              return (
                <Link key={event._id} to={`/events/${event._id}`} className="event-card">
                  <div className="event-image">
                    {event.image ? (
                      <img src={event.image} alt={event.title} />
                    ) : (
                      <div style={{width: '100%', height: '100%', background: '#eee', display: 'grid', placeItems: 'center', color: '#999'}}>No Image</div>
                    )}
                    <span className="event-category">{event.category || 'Event'}</span>
                  </div>

                  <div className="event-content">
                    <h3>{event.title}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                      <div className="event-meta">
                        <Calendar size={16} style={{ color: 'var(--primary)' }} />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="event-meta">
                        <MapPin size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.venue}, {event.location}
                        </span>
                      </div>
                    </div>

                    <div className="event-bottom">
                      <div>
                        <span style={{ fontSize: '10px', color: '#999', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
                          Ticket Price
                        </span>
                        <strong style={{ fontSize: '18px', color: '#111' }}>
                          ₦{startingPrice.toLocaleString()}
                        </strong>
                      </div>
                      <span className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
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