import { useEffect, useState } from "react";
import {
  CalendarDays,
  Ticket,
  Wallet,
  Plus,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  Scan,
  Link as LinkIcon // Add this
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (
      parsedUser.role === "organizer" ||
      parsedUser.role === "admin"
    ) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch live statistics and event analytics from the organizer endpoint
      const response = await api.get("/events/organizer/stats");

      if (response.data.success) {
        setStats(response.data.stats || { totalEvents: 0, totalTicketsSold: 0, totalRevenue: 0 });
        setEvents(response.data.events || []);
      }
    } catch (error) {
      console.error("Unable to load dashboard analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  const isOrganizer =
    user.role === "organizer" ||
    user.role === "admin";
    const copyEventLink = (e, eventId) => {
    e.preventDefault(); // Prevents the card's main <Link> wrapper from redirecting
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    alert("Ticket link copied! You can now paste and share this with attendees.");
  };

  return (
    <div className="dashboard">

      {/* MOBILE TOP BAR */}
      <div className="mobile-dashboard-header">
        <button
          onClick={() => setSidebarOpen(true)}
          className="dashboard-menu-btn"
        >
          <Menu size={22} />
        </button>
        <strong>Tikora</strong>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="dashboard-logo">
            EVENTA
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user.name}</strong>
            <span>
              {isOrganizer
                ? "Organizer"
                : "Ticket buyer"}
            </span>
          </div>
        </div>

        <nav className="dashboard-nav">
          <Link
            to="/dashboard"
            className="active"
            onClick={() => setSidebarOpen(false)}
          >
            <CalendarDays size={18} />
            Dashboard
          </Link>

          {isOrganizer && (
            <>
              <Link
                to="/create-event"
                onClick={() => setSidebarOpen(false)}
              >
                <Plus size={18} />
                Create Event
              </Link>

              <Link
                to="/my-events"
                onClick={() => setSidebarOpen(false)}
              >
                <CalendarDays size={18} />
                My Events
              </Link>

              <Link
                to="/organizer/scanner"
                onClick={() => setSidebarOpen(false)}
              >
                <Scan size={18} />
                Ticket Scanner
              </Link>
            </>
          )}

          <Link
            to="/my-tickets"
            onClick={() => setSidebarOpen(false)}
          >
            <Ticket size={18} />
            My Tickets
          </Link>

          {isOrganizer && (
            <Link
              to="/wallet"
              onClick={() => setSidebarOpen(false)}
            >
              <Wallet size={18} />
              Revenue
            </Link>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button
            onClick={logout}
            className="logout-btn"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              {isOrganizer ? "ORGANIZER DASHBOARD" : "MY DASHBOARD"}
            </span>
            <h1>
              Welcome back, {user.name.split(" ")[0]} 
            </h1>
            <p>
              {isOrganizer
                ? "Monitor your active events, gross earnings, and ticket metrics."
                : "Discover events and manage your tickets."}
            </p>
          </div>

          {isOrganizer && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                to="/organizer/scanner"
                className="btn btn-outline"
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "white" }}
              >
                <Scan size={18} /> Scanner
              </Link>
              <Link
                to="/create-event"
                className="btn btn-primary"
              >
                <Plus size={18} />
                Create Event
              </Link>
            </div>
          )}
        </header>

        {/* STATISTICS */}
        <section className="dashboard-stats">
          <div className="dashboard-stat">
            <div className="stat-icon">
              <CalendarDays size={20} />
            </div>
            <div>
              <span>Total Events</span>
              <strong>{stats.totalEvents}</strong>
            </div>
          </div>

          <div className="dashboard-stat">
            <div className="stat-icon">
              <Ticket size={20} />
            </div>
            <div>
              <span>Tickets Sold</span>
              <strong>{stats.totalTicketsSold.toLocaleString()}</strong>
            </div>
          </div>

          <div className="dashboard-stat">
            <div className="stat-icon">
              <Wallet size={20} />
            </div>
            <div>
              <span>Gross Revenue</span>
              <strong>₦{stats.totalRevenue.toLocaleString()}</strong>
            </div>
          </div>
        </section>

        {/* EVENTS */}
        <section className="dashboard-events">
          <div className="section-heading">
            <div>
              <span>EVENT MANAGEMENT</span>
              <h2>Your Events Performance</h2>
            </div>

            {isOrganizer && events.length > 0 && (
              <Link to="/my-events">
                View all
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="dashboard-empty">
              <p>Loading your analytics and events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="dashboard-empty">
              <div className="empty-icon">
                <CalendarDays size={28} />
              </div>
              <h3>No events yet</h3>
              <p>
                You haven't created any events.
                Start by creating your first event.
              </p>

              {isOrganizer && (
                <Link
                  to="/create-event"
                  className="btn btn-primary"
                >
                  <Plus size={18} />
                  Create your first event
                </Link>
              )}
            </div>
          ) : (
           <div className="dashboard-event-grid">
  {events.slice(0, 6).map((event) => (
    <Link
      to={`/events/${event._id}`}
      className="dashboard-event-card"
      key={event._id}
    >
      <div className="dashboard-event-image">
        <img
          src={
            event.image?.url ||
            event.image ||
            "/placeholder-event.jpg"
          }
          alt={event.title}
        />
      </div>

      <div className="dashboard-event-content">
        <span>
          {event.category || "Event"}
        </span>
        <h3>
          {event.title}
        </h3>
        <p style={{ marginBottom: "10px" }}>
          {event.venue}
        </p>

        <div style={{ background: "#f8f8f6", border: "1px solid #eee", borderRadius: "8px", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <div>
            <span style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>Sold</span>
            <strong style={{ fontSize: "13px", color: "#111" }}>{event.eventTicketsSold} / {event.eventCapacity}</strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>Earned</span>
            <strong style={{ fontSize: "13px", color: "var(--primary)" }}>₦{event.eventRevenue ? event.eventRevenue.toLocaleString() : "0"}</strong>
          </div>
        </div>

        {/* COPY TICKET LINK BUTTON */}
        <button 
          onClick={(e) => copyEventLink(e, event._id)}
          style={{ marginTop: "10px", width: "100%", padding: "10px", background: "white", border: "1px solid var(--primary)", color: "var(--primary)", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
        >
          <LinkIcon size={16} />
          Copy Ticket Link
        </button>
      </div>
    </Link>
  ))}
</div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;