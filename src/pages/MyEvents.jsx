import { useEffect, useState } from "react";
import {
  Plus,
  CalendarDays,
  MapPin,
  Ticket,
  ArrowLeft,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function MyEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // FETCH ORGANIZER EVENTS
  // ==========================================

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/events/my-events");
      console.log("MY EVENTS RESPONSE:", response.data);

      if (response.data.success) {
        setEvents(response.data.events || []);
      } else {
        setError(response.data.message || "Unable to load your events.");
      }
    } catch (error) {
      console.error("Unable to fetch your events:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (error.response?.status === 403) {
        setError("You do not have permission to access your events.");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load your events. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DELETE EVENT
  // ==========================================

  const handleDeleteEvent = async (eventId) => {
    const event = events.find((item) => item._id === eventId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        event?.title || "this event"
      }"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(eventId);
      setError("");

      const response = await api.delete(`/events/${eventId}`);
      console.log("DELETE EVENT RESPONSE:", response.data);

      if (response.data.success) {
        setEvents((currentEvents) =>
          currentEvents.filter((item) => item._id !== eventId)
        );
        alert(response.data.message || "Event deleted successfully.");
      } else {
        setError(response.data.message || "Unable to delete event.");
      }
    } catch (error) {
      console.error("Delete event error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (error.response?.status === 403) {
        setError("You are not authorized to delete this event.");
        return;
      }

      if (error.response?.status === 404) {
        setError("Event not found.");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to delete event. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="my-events-page">
      <div className="container">
        {/* ========================================
            HEADER
        ======================================== */}
        <div className="my-events-header">
          <div>
            <Link to="/dashboard" className="back-link">
              <ArrowLeft size={17} />
              Back to dashboard
            </Link>
            <span className="page-label">ORGANIZER</span>
            <h1>My Events</h1>
            <p>Manage all the events you've created.</p>
          </div>
          <Link to="/create-event" className="btn btn-primary">
            <Plus size={18} />
            Create Event
          </Link>
        </div>

        {/* ========================================
            ERROR
        ======================================== */}
        {error && (
          <div className="my-events-error">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchMyEvents}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* ========================================
            LOADING & EMPTY STATE
        ======================================== */}
        {loading ? (
          <div className="events-loading">
            <div className="loading-spinner"></div>
            <p>Loading your events...</p>
          </div>
        ) : events.length === 0 && !error ? (
          <div className="my-events-empty">
            <div className="empty-icon">
              <CalendarDays size={28} />
            </div>
            <h2>No events yet</h2>
            <p>
              You haven't created any events yet. Create your first event and
              start selling tickets.
            </p>
            <Link to="/create-event" className="btn btn-primary">
              <Plus size={18} />
              Create your first event
            </Link>
          </div>
        ) : (
          /* ======================================
             EVENTS GRID
          ====================================== */
          <div className="my-events-grid">
            {events.map((event) => {
              const totalTickets =
                event.tickets?.reduce(
                  (total, ticket) => total + Number(ticket.quantity || 0),
                  0
                ) || 0;

              const ticketsSold =
                event.tickets?.reduce(
                  (total, ticket) => total + Number(ticket.sold || 0),
                  0
                ) || 0;

              const availableTickets =
                event.tickets?.reduce(
                  (total, ticket) =>
                    total +
                    Math.max(
                      0,
                      Number(ticket.quantity || 0) - Number(ticket.sold || 0)
                    ),
                  0
                ) || 0;

              const eventImage =
                typeof event.image === "string"
                  ? event.image
                  : event.image?.url || "/placeholder-event.jpg";

              return (
                <div key={event._id} className="my-event-card">
                  <Link
                    to={`/events/${event._id}`}
                    className="my-event-card-link"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {/* IMAGE */}
                    <div className="my-event-image">
                      <img
                        src={eventImage || "/placeholder-event.jpg"}
                        alt={event.title}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-event.jpg";
                        }}
                      />
                      <span className="event-category-badge">
                        {event.category}
                      </span>
                    </div>

                    {/* BODY */}
                    <div className="my-event-body" style={{ padding: "16px" }}>
                      <h2 style={{ marginBottom: "12px", fontSize: "1.25rem" }}>
                        {event.title}
                      </h2>

                      {/* META */}
                      <div
                        className="event-meta"
                        style={{
                          display: "flex",
                          gap: "12px",
                          color: "#6b7280",
                          fontSize: "14px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <CalendarDays size={14} />
                          {event.date
                            ? new Date(event.date).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Date not available"}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={14} />
                          {event.venue || "Venue not specified"}
                        </span>
                      </div>

                      {/* TICKET SUMMARY */}
                      <div
                        className="event-ticket-summary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#4b5563",
                          fontSize: "14px",
                        }}
                      >
                        <Ticket size={15} />
                        <span>
                          {event.tickets?.length || 0} ticket type
                          {event.tickets?.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {/* TICKET STATS GRID */}
                      <div
                        className="event-ticket-stats"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#f9fafb",
                          padding: "12px",
                          borderRadius: "6px",
                          margin: "16px 0",
                          border: "1px solid #f3f4f6"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <small style={{ color: "#6b7280", fontSize: "12px" }}>
                            Total tickets
                          </small>
                          <strong style={{ fontSize: "16px", color: "#111827" }}>
                            {totalTickets}
                          </strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <small style={{ color: "#6b7280", fontSize: "12px" }}>
                            Sold
                          </small>
                          <strong style={{ fontSize: "16px", color: "#111827" }}>
                            {ticketsSold}
                          </strong>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <small style={{ color: "#6b7280", fontSize: "12px" }}>
                            Available
                          </small>
                          <strong style={{ fontSize: "16px", color: "#111827" }}>
                            {availableTickets}
                          </strong>
                        </div>
                      </div>

                      {/* STATUS & VIEW EVENT */}
                      <div
                        className="event-card-footer"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <span
                          className={`event-status ${
                            event.status || "published"
                          }`}
                          style={{
                            textTransform: "uppercase",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            padding: "4px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {event.status || "published"}
                        </span>
                        <span
                          className="view-event"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "14px",
                            color: "#f97316",
                            fontWeight: "500",
                          }}
                        >
                          View event
                          <Eye size={15} />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* ==================================
                      EVENT ACTIONS (EDIT / DELETE)
                  ================================== */}
                  <div
                    className="my-event-actions"
                    style={{
                      display: "flex",
                      gap: "12px",
                      borderTop: "1px solid #e5e7eb",
                      padding: "16px",
                      backgroundColor: "#fff",
                      borderBottomLeftRadius: "8px",
                      borderBottomRightRadius: "8px"
                    }}
                  >
                    <Link
                      to={`/edit-event/${event._id}`}
                      className="event-edit-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "14px",
                        color: "#374151",
                        textDecoration: "none",
                        fontWeight: "500"
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Pencil size={15} />
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="event-delete-btn"
                      disabled={deletingId === event._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        border: "1px solid #fca5a5",
                        borderRadius: "4px",
                        fontSize: "14px",
                        color: "#dc2626",
                        backgroundColor: "#fef2f2",
                        cursor: "pointer",
                        fontWeight: "500"
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteEvent(event._id);
                      }}
                    >
                      {deletingId === event._id ? (
                        <>
                          <span className="button-spinner"></span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={15} />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default MyEvents;
