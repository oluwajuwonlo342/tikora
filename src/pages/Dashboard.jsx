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
  Link as LinkIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const EMPTY_STATS = {
  totalEvents: 0,
  totalTicketsSold: 0,
  totalRevenue: 0,
};

// ✅ BULLETPROOF NUMBER FORMATTER: This prevents the 'toLocaleString' crash!
function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-NG") : "0";
}

function getEventImage(event) {
  if (typeof event?.image === "string") return event.image;
  return event?.image?.url || "/placeholder-event.jpg";
}

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copyingId, setCopyingId] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          navigate("/login", { replace: true });
          return;
        }

        let parsedUser;

        try {
          parsedUser = JSON.parse(storedUser);
        } catch {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        if (!parsedUser || typeof parsedUser !== "object") {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        if (cancelled) return;

        setUser(parsedUser);

        const isOrganizer =
          parsedUser.role === "organizer" ||
          parsedUser.role === "admin";

        if (!isOrganizer) return;

        const response = await api.get("/events/organizer/stats");

        if (cancelled) return;

        const data = response.data || {};

        // Support common API response structures.
        const result = data.stats || data.data?.stats || {};
        const eventList =
          data.events ||
          data.data?.events ||
          (Array.isArray(data.data) ? data.data : []);

        setStats({
          totalEvents: Number(result.totalEvents) || 0,
          totalTicketsSold: Number(result.totalTicketsSold) || 0,
          totalRevenue: Number(result.totalRevenue) || 0,
        });

        setEvents(Array.isArray(eventList) ? eventList : []);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Unable to load dashboard analytics:",
            error.response?.data || error.message || error
          );
          setEvents([]);
          setStats(EMPTY_STATS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const copyEventLink = async (eventId) => {
    if (!eventId) {
      setCopyMessage("Unable to copy: event ID is missing.");
      return;
    }

    const url = `${window.location.origin}/events/${eventId}`;

    try {
      setCopyingId(eventId);

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for browsers where Clipboard API is unavailable.
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!copied) throw new Error("Copy command failed");
      }

      setCopyMessage("Ticket link copied successfully!");
    } catch (error) {
      console.error("Unable to copy ticket link:", error);
      setCopyMessage("Copy failed. Please copy this link manually: " + url);
    } finally {
      setCopyingId(null);
    }
  };

  if (!user) return null;

  const isOrganizer =
    user.role === "organizer" || user.role === "admin";

  const userName =
    typeof user.name === "string" && user.name.trim()
      ? user.name.trim()
      : "User";

  const firstName = userName.split(/\s+/)[0];

  return (
    <div className="dashboard">
      {/* MOBILE TOP BAR */}
      <div className="mobile-dashboard-header">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="dashboard-menu-btn"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>
        <strong>Tikora</strong>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="sidebar-top">
          <div className="dashboard-logo">TIKORA</div>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{userName}</strong>
            <span>{isOrganizer ? "Organizer" : "Ticket buyer"}</span>
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

              <Link
                to="/wallet"
                onClick={() => setSidebarOpen(false)}
              >
                <Wallet size={18} />
                Revenue
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
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
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

            <h1>Welcome back, {firstName}</h1>

            <p>
              {isOrganizer
                ? "Monitor your events, ticket sales, and revenue."
                : "Discover events and manage your tickets."}
            </p>
          </div>

          {isOrganizer && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/organizer/scanner"
                className="btn btn-outline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "white",
                }}
              >
                <Scan size={18} />
                Scanner
              </Link>

              <Link to="/create-event" className="btn btn-primary">
                <Plus size={18} />
                Create Event
              </Link>
            </div>
          )}
        </header>

        {/* ORGANIZER STATISTICS */}
        {isOrganizer && (
          <section className="dashboard-stats">
            <div className="dashboard-stat">
              <div className="stat-icon">
                <CalendarDays size={20} />
              </div>
              <div>
                <span>Total Events</span>
                <strong>{formatNumber(stats.totalEvents)}</strong>
              </div>
            </div>

            <div className="dashboard-stat">
              <div className="stat-icon">
                <Ticket size={20} />
              </div>
              <div>
                <span>Tickets Sold</span>
                <strong>{formatNumber(stats.totalTicketsSold)}</strong>
              </div>
            </div>

            <div className="dashboard-stat">
              <div className="stat-icon">
                <Wallet size={20} />
              </div>
              <div>
                <span>Gross Revenue</span>
                <strong>₦{formatNumber(stats.totalRevenue)}</strong>
              </div>
            </div>
          </section>
        )}

        {/* EVENTS */}
        <section className="dashboard-events">
          <div className="section-heading">
            <div>
              <span>
                {isOrganizer ? "EVENT MANAGEMENT" : "YOUR TICKETS"}
              </span>
              <h2>
                {isOrganizer ? "Your Events Performance" : "Manage Your Tickets"}
              </h2>
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
              <p>Loading your dashboard...</p>
            </div>
          ) : !isOrganizer ? (
            <div className="dashboard-empty">
              <div className="empty-icon">
                <Ticket size={28} />
              </div>
              <h3>Ready for your next event?</h3>
              <p>Explore upcoming events and find your next experience.</p>
              <Link to="/events" className="btn btn-primary">
                Explore Events
              </Link>
            </div>
          ) : events.length === 0 ? (
            <div className="dashboard-empty">
              <div className="empty-icon">
                <CalendarDays size={28} />
              </div>
              <h3>No events yet</h3>
              <p>
                You haven't created any events yet. Start by creating your
                first event.
              </p>
              <Link to="/create-event" className="btn btn-primary">
                <Plus size={18} />
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="dashboard-event-grid">
              {events.slice(0, 6).map((event) => {
                const eventId = event._id || event.id;
                const sold = Number(event.eventTicketsSold) || 0;
                const capacity = Number(event.eventCapacity);

                return (
                  <article
                    className="dashboard-event-card"
                    key={eventId}
                  >
                    <Link
                      to={`/events/${eventId}`}
                      className="dashboard-event-card-link"
                    >
                      <div className="dashboard-event-image">
                        <img
                          src={getEventImage(event)}
                          alt={event.title || "Event"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder-event.jpg";
                          }}
                        />
                      </div>

                      <div className="dashboard-event-content">
                        <span>{event.category || "Event"}</span>
                        <h3>{event.title || "Untitled event"}</h3>
                        <p style={{ marginBottom: "10px" }}>
                          {event.venue || event.location || "Venue not specified"}
                        </p>
                      </div>
                    </Link>

                    <div
                      style={{
                        background: "#f8f8f6",
                        border: "1px solid #eee",
                        borderRadius: "8px",
                        padding: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        marginTop: "auto",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#888",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                            display: "block",
                          }}
                        >
                          Sold
                        </span>
                        <strong style={{ fontSize: "13px", color: "#111" }}>
                          {formatNumber(sold)} /{" "}
                          {Number.isFinite(capacity)
                            ? formatNumber(capacity)
                            : "N/A"}
                        </strong>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#888",
                            textTransform: "uppercase",
                            fontWeight: "bold",
                            display: "block",
                          }}
                        >
                          Earned
                        </span>
                        <strong
                          style={{
                            fontSize: "13px",
                            color: "var(--primary)",
                          }}
                        >
                          ₦{formatNumber(event.eventRevenue)}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyEventLink(eventId)}
                      disabled={!eventId || copyingId === eventId}
                      style={{
                        marginTop: "10px",
                        width: "100%",
                        padding: "10px",
                        background: "white",
                        border: "1px solid var(--primary)",
                        color: "var(--primary)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: "bold",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <LinkIcon size={16} />
                      {copyingId === eventId ? "Copying..." : "Copy Ticket Link"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {copyMessage && (
            <p
              role="status"
              style={{ marginTop: "12px", overflowWrap: "anywhere" }}
            >
              {copyMessage}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
