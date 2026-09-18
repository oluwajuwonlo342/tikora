import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Music,
  PartyPopper,
  BriefcaseBusiness,
  Palette,
  Trophy,
  GraduationCap,
  MapPin,
  CalendarDays,
} from "lucide-react";

import { getAllEvents } from "../../services/eventService";

const categories = [
  { name: "Music", icon: Music },
  { name: "Parties", icon: PartyPopper },
  { name: "Business", icon: BriefcaseBusiness },
  { name: "Arts", icon: Palette },
  { name: "Sports", icon: Trophy },
  { name: "Education", icon: GraduationCap },
];

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingEvents = async () => {
      try {
        const data = await getAllEvents();
        const eventsList = data.events || data;
        
        // Filter out drafts and grab only the latest 3 for the homepage
        const publishedEvents = eventsList
          .filter(event => event.status !== 'draft')
          .slice(0, 3);
          
        setEvents(publishedEvents);
      } catch (err) {
        console.error("Failed to load trending events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingEvents();
  }, []);

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-badge">
            <span></span>
            Discover what's happening around you
          </div>

          <h1>
            Find your next
            <br />
            <span>unforgettable</span> event.
          </h1>

          <p>
            Discover concerts, parties, festivals, conferences,
            workshops and experiences happening around you.
          </p>

          <div className="search-box">
            <Search size={22} />
            <input
              type="text"
              placeholder="Search events, artists or experiences..."
            />
            <button className="btn btn-primary">Search</button>
          </div>

          <div className="hero-links">
            <span>Popular:</span>
            <Link to="/events?category=music">Music</Link>
            <Link to="/events?category=party">Parties</Link>
            <Link to="/events?category=business">Business</Link>
            <Link to="/events?category=festival">Festivals</Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Explore categories</h2>
              <p className="section-subtitle">
                Find something that matches your vibe.
              </p>
            </div>

            <Link to="/categories" className="view-all">
              View all <ArrowRight size={17} />
            </Link>
          </div>

          <div className="categories-grid">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  to={`/events?category=${category.name.toLowerCase()}`}
                  className="category-card"
                  key={category.name}
                >
                  <div className="category-icon">
                    <Icon size={25} />
                  </div>
                  <span>{category.name}</span>
                  <ArrowRight className="category-arrow" size={18} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="section events-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Trending events</h2>
              <p className="section-subtitle">
                Events people are talking about.
              </p>
            </div>

            <Link to="/events" className="view-all">
              Explore events <ArrowRight size={17} />
            </Link>
          </div>

          <div className="events-grid">
            {loading ? (
              <div style={{ padding: "2rem", color: "#666" }}>Loading events...</div>
            ) : events.length === 0 ? (
              <div style={{ padding: "2rem", color: "#666" }}>No upcoming events currently.</div>
            ) : (
              events.map((event) => {
                // Calculate the lowest ticket price dynamically
                const startingPrice = event.tickets?.length > 0 
                  ? Math.min(...event.tickets.map(t => t.price))
                  : 0;

                // Format the date nicely
                const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric"
                });

                return (
                  <Link
                    to={`/events/${event._id}`}
                    className="event-card"
                    key={event._id}
                  >
                    <div className="event-image">
                      {event.image ? (
                        <img src={event.image} alt={event.title} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} />
                      )}
                      <span className="event-category">
                        {event.category || 'Event'}
                      </span>
                    </div>

                    <div className="event-content">
                      <h3>{event.title}</h3>

                      <div className="event-meta">
                        <CalendarDays size={16} />
                        {formattedDate}
                      </div>

                      <div className="event-meta">
                        <MapPin size={16} />
                        {event.location || event.venue}
                      </div>

                      <div className="event-bottom">
                        <strong>From ₦{startingPrice.toLocaleString()}</strong>
                        <span className="event-arrow">
                          <ArrowRight size={18} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="creator-cta">
        <div className="container creator-inner">
          <div>
            <span className="cta-label">FOR EVENT ORGANIZERS</span>
            <h2>
              Have an event?
              <br />
              Fill the room.
            </h2>
            <p>
              Create your event, sell tickets and manage everything from one
              simple dashboard.
            </p>
            <Link to="/create-event" className="btn btn-primary">
              Create your event
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;