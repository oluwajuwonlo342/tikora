import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import api from "../services/api";

// Treat datetime-local input as Nigeria wall-clock time (Africa/Lagos, UTC+1).
// Example: 2026-10-29T09:00 becomes 2026-10-29T08:00:00.000Z.
const convertNigerianTimeToISO = (value) => {
  if (!value) return "";

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00`
    : value;

  // Don't append another offset if the value already has one.
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);
  const parsedDate = new Date(hasTimezone ? normalized : `${normalized}+01:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid event date or time.");
  }

  return parsedDate.toISOString();
};

function CreateEvent() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "music",
    date: "",
    endDate: "",
    venue: "",
    location: "",
  });

  const [tickets, setTickets] = useState([
    { name: "Regular", price: "", quantity: "" },
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleTicketChange = (index, field, value) => {
    setTickets((previous) => previous.map((ticket, ticketIndex) =>
      ticketIndex === index ? { ...ticket, [field]: value } : ticket
    ));
  };

  const addTicket = () => setTickets((previous) => [
    ...previous,
    { name: "", price: "", quantity: "" },
  ]);

  const removeTicket = (index) => {
    if (tickets.length === 1) return;
    setTickets((previous) => previous.filter((_, ticketIndex) => ticketIndex !== index));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Event title is required.";
    if (!form.description.trim()) return "Event description is required.";
    if (!form.category) return "Please select an event category.";
    if (!form.date) return "Event date is required.";
    if (!form.venue.trim()) return "Venue is required.";
    if (!form.location.trim()) return "Location is required.";
    if (!imageFile) return "Please upload an event image.";

    if (form.endDate) {
      const start = new Date(convertNigerianTimeToISO(form.date));
      const end = new Date(convertNigerianTimeToISO(form.endDate));
      if (end <= start) return "End date must be after the event start date.";
    }

    if (!tickets.length) return "At least one ticket type is required.";
    for (let index = 0; index < tickets.length; index += 1) {
      const ticket = tickets[index];
      if (!ticket.name.trim()) return `Ticket ${index + 1} needs a name.`;
      if (ticket.price === "" || !Number.isFinite(Number(ticket.price)) || Number(ticket.price) < 0) {
        return `Enter a valid price for ticket ${index + 1}.`;
      }
      if (ticket.quantity === "" || !Number.isInteger(Number(ticket.quantity)) || Number(ticket.quantity) < 1) {
        return `Enter a valid quantity for ticket ${index + 1}.`;
      }
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    let validationError;
    try {
      validationError = validateForm();
    } catch (conversionError) {
      setError(conversionError.message || "Please check the event date and time.");
      return;
    }
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("description", form.description.trim());
      data.append("category", form.category);
      data.append("date", convertNigerianTimeToISO(form.date));
      if (form.endDate) data.append("endDate", convertNigerianTimeToISO(form.endDate));
      data.append("venue", form.venue.trim());
      data.append("location", form.location.trim());
      data.append("tickets", JSON.stringify(tickets.map((ticket) => ({
        name: ticket.name.trim(),
        price: Number(ticket.price),
        quantity: Number(ticket.quantity),
      }))));
      data.append("image", imageFile);

      const response = await api.post("/events", data);
      if (!response.data?.success) {
        setError(response.data?.message || "Unable to create event.");
        return;
      }

      setSuccess("Event created successfully.");
      const eventId = response.data.event?._id;
      setTimeout(() => navigate(eventId ? `/events/${eventId}` : "/my-events"), 900);
    } catch (requestError) {
      console.error("Create event error:", requestError);
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setError(requestError.response?.data?.message || requestError.message || "Unable to create event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="create-event-page">
      <div className="container">
        <header className="create-event-header">
          <span className="page-label">ORGANIZER</span>
          <h1>Create Event</h1>
          <p>Enter your event details, upload an image, and set up ticket types.</p>
        </header>

        {error && <div className="form-error" role="alert"><p>{error}</p></div>}
        {success && <div className="form-success" role="status"><p>{success}</p></div>}

        <form onSubmit={handleSubmit} className="create-event-form">
          <section className="form-section">
            <div className="form-section-header">
              <h2>Event Information</h2>
              <p>Fields marked * are required.</p>
            </div>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="title">Event title *</label>
                <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Enter event title" required />
              </div>
              <div className="form-group full-width">
                <label htmlFor="description">Description *</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows="6" placeholder="Describe your event" required />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select id="category" name="category" value={form.category} onChange={handleChange} required>
                  <option value="music">Music</option>
                  <option value="party">Party</option>
                  <option value="business">Business</option>
                  <option value="arts">Arts</option>
                  <option value="sports">Sports</option>
                  <option value="education">Education</option>
                  <option value="festival">Festival</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="date">Start date &amp; time (Nigeria time) *</label>
                <input id="date" name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End date &amp; time (optional)</label>
                <input id="endDate" name="endDate" type="datetime-local" value={form.endDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="venue">Venue *</label>
                <input id="venue" name="venue" value={form.venue} onChange={handleChange} placeholder="e.g. Shugarland" required />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Apata, Ibadan" required />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h2>Event Image</h2><p>JPG, PNG, or WEBP — maximum 5MB.</p></div>
            <div className="event-image-upload">
              {imagePreview ? <div className="image-preview"><img src={imagePreview} alt="Event preview" /></div> : <div className="image-placeholder"><ImageIcon size={40} /><p>No image selected</p></div>}
              <label htmlFor="event-image" className="image-upload-button"><ImageIcon size={18} /> {imageFile ? "Change Image" : "Choose Image *"}</label>
              <input id="event-image" type="file" accept="image/*" onChange={handleImageChange} hidden />
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header ticket-header">
              <div><h2>Ticket Types</h2><p>Set the name, price, and available quantity for each ticket.</p></div>
              <button type="button" className="btn btn-secondary" onClick={addTicket}><Plus size={17} /> Add Ticket</button>
            </div>
            <div className="ticket-edit-list">
              {tickets.map((ticket, index) => (
                <div className="ticket-edit-item" key={`ticket-${index}`}>
                  <div className="ticket-edit-title"><span>Ticket {index + 1}</span></div>
                  <div className="ticket-form-grid">
                    <div className="form-group"><label htmlFor={`ticket-name-${index}`}>Ticket name *</label><input id={`ticket-name-${index}`} value={ticket.name} onChange={(e) => handleTicketChange(index, "name", e.target.value)} placeholder="Regular" required /></div>
                    <div className="form-group"><label htmlFor={`ticket-price-${index}`}>Price (₦) *</label><input id={`ticket-price-${index}`} type="number" min="0" step="0.01" value={ticket.price} onChange={(e) => handleTicketChange(index, "price", e.target.value)} placeholder="2500" required /></div>
                    <div className="form-group"><label htmlFor={`ticket-quantity-${index}`}>Quantity *</label><input id={`ticket-quantity-${index}`} type="number" min="1" step="1" value={ticket.quantity} onChange={(e) => handleTicketChange(index, "quantity", e.target.value)} placeholder="150" required /></div>
                    <button type="button" className="remove-ticket-btn" onClick={() => removeTicket(index)} disabled={tickets.length === 1} title="Remove ticket"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="edit-event-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={18} className="loading-spinner" /> Creating...</> : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default CreateEvent;
