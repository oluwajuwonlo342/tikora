import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Plus,
  Trash2,
  CalendarDays,
  MapPin,
  Ticket,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PICK_BYTES = 25 * 1024 * 1024; // refuse absurdly large originals before shrinking
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const UPLOAD_TIMEOUT_MS = 120000;

// Shrinks a photo in the browser so uploads are fast on slow mobile data.
// Falls back to the original file if anything goes wrong.
const compressImage = (file, maxSide = 1600, quality = 0.85) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 500 * 1024) return resolve(file); // already small

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

// "2026-11-05T19:00" (local time) -> "2026-11-05T18:00:00.000Z"
const toIso = (value) => (value ? new Date(value).toISOString() : "");

// Value for the min attribute of datetime-local inputs, in local time
const nowForInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const describeError = (error) => {
  if (error.response) {
    if (error.response.status === 401) return "Your session has expired. Please log in again.";
    return (
      error.response.data?.message ||
      error.response.data?.error ||
      `Could not create the event (error ${error.response.status}).`
    );
  }
  if (error.code === "ECONNABORTED") {
    return "The upload took too long. Try again on a stronger connection.";
  }
  return "Could not reach the server. It may be waking up, so please try again in a moment.";
};

function CreateEvent() {
  const navigate = useNavigate();
  const errorRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "music",
    date: "",
    endDate: "",
    venue: "",
    location: "",
  });

  const [tickets, setTickets] = useState([{ name: "Regular", price: "", quantity: "" }]);

  // Release the preview URL when it changes or the page closes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const showError = (message) => {
    setError(message);
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return showError("Please choose a PNG, JPG or WEBP image.");
    }
    if (file.size > MAX_PICK_BYTES) {
      return showError("That image is too large. Please choose one under 25MB.");
    }

    setError("");
    setPreparing(true);
    const prepared = await compressImage(file);
    setPreparing(false);

    if (prepared.size > MAX_IMAGE_BYTES) {
      return showError("That image is still over 5MB after shrinking. Please choose a smaller one.");
    }

    setImage(prepared);
    setPreview(URL.createObjectURL(prepared));
  };

  const addTicket = () => setTickets((prev) => [...prev, { name: "", price: "", quantity: "" }]);

  const removeTicket = (index) => {
    if (tickets.length === 1) return;
    setTickets((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTicket = (index, field, value) => {
    setTickets((prev) => prev.map((ticket, i) => (i === index ? { ...ticket, [field]: value } : ticket)));
  };

  // Returns an error message, or "" when everything is fine
  const validate = () => {
    if (!formData.title.trim()) return "Give your event a title.";
    if (!image) return "Please upload an event poster.";

    const start = new Date(formData.date);
    if (!formData.date || Number.isNaN(start.getTime())) return "Choose a start date and time.";
    if (start.getTime() <= Date.now()) return "The event date must be in the future.";

    if (formData.endDate) {
      const end = new Date(formData.endDate);
      if (Number.isNaN(end.getTime())) return "The end date is not valid.";
      if (end.getTime() <= start.getTime()) return "The end date must be after the start date.";
    }

    const names = new Set();
    for (let i = 0; i < tickets.length; i += 1) {
      const t = tickets[i];
      const label = `Ticket ${i + 1}`;
      const name = t.name.trim();
      const price = Number(t.price);
      const quantity = Number(t.quantity);

      if (!name) return `${label}: give it a name.`;
      if (names.has(name.toLowerCase())) return `Two tickets are named "${name}". Give each type its own name.`;
      names.add(name.toLowerCase());

      if (t.price === "" || !Number.isFinite(price) || price < 0) return `${label}: enter a valid price (0 for free).`;
      if (t.quantity === "" || !Number.isInteger(quantity) || quantity < 1) {
        return `${label}: quantity must be a whole number of at least 1.`;
      }
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || preparing) return;

    const problem = validate();
    if (problem) return showError(problem);

    setError("");
    setLoading(true);
    setProgress(0);

    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("description", formData.description.trim());
      data.append("category", formData.category.toLowerCase());
      data.append("date", toIso(formData.date));
      data.append("endDate", toIso(formData.endDate));
      data.append("venue", formData.venue.trim());
      data.append("location", formData.location.trim());
      data.append(
        "tickets",
        JSON.stringify(
          tickets.map((t) => ({
            name: t.name.trim(),
            price: Number(t.price),
            quantity: Number(t.quantity),
          }))
        )
      );
      data.append("image", image);

      // Attach the token only if there is one. If your api service already adds it
      // for every request, you can delete the next three lines and the headers entry.
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "multipart/form-data" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await api.post("/events", data, {
        headers,
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });

      const body = response.data || {};
      const created = body.event || body.data?.event;

      if (created?._id) {
        navigate(`/events/${created._id}`);
      } else if (body.success || body.status === "success") {
        navigate("/dashboard"); // created, but the response had a different shape
      } else {
        showError(body.message || "The event could not be created. Please try again.");
      }
    } catch (err) {
      console.error("Create event error:", err.response?.status, err.response?.data, err.code);
      showError(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const minDate = nowForInput();

  return (
    <main className="create-event-page">
      <div className="container">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="create-event-header">
          <div>
            <span className="page-label">ORGANIZER</span>
            <h1>Create your event</h1>
            <p>Tell people what makes your event worth experiencing.</p>
          </div>
        </div>

        <form className="event-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              ref={errorRef}
              role="alert"
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "12px 14px",
                marginBottom: "16px",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "14px",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{error}</span>
            </div>
          )}

          {/* BASIC INFORMATION */}
          <section className="form-section">
            <div className="form-section-title">
              <div>
                <h2>Event information</h2>
                <p>Give your event a great first impression.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="title">Event title</label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Afrobeat Summer Night"
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    background: "#fff",
                    fontSize: "16px",
                  }}
                >
                  <option value="music">Music</option>
                  <option value="party">Party</option>
                  <option value="business">Business</option>
                  <option value="arts">Arts</option>
                  <option value="sports">Sports</option>
                  <option value="education">Education</option>
                  <option value="festival">Festival</option>
                </select>
              </div>

              <div className="form-group full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your event..."
                  rows="6"
                  required
                />
              </div>
            </div>
          </section>

          {/* IMAGE */}
          <section className="form-section">
            <div className="form-section-title">
              <div>
                <h2>Event poster</h2>
                <p>Use a high-quality image to attract attendees.</p>
              </div>
            </div>

            <label className="image-upload" style={{ cursor: "pointer" }}>
              {preview ? (
                <img src={preview} alt="Event preview" />
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">
                    <Upload size={25} />
                  </div>
                  <strong>{preparing ? "Preparing image..." : "Upload event poster"}</strong>
                  <span>PNG, JPG or WEBP. Large photos are shrunk automatically.</span>
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>
            {preview && (
              <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>
                Tap the poster to choose a different image.
              </p>
            )}
          </section>

          {/* DATE & LOCATION */}
          <section className="form-section">
            <div className="form-section-title">
              <div>
                <h2>Date & location</h2>
                <p>Where and when is your event happening?</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="date">
                  <CalendarDays size={15} /> Event date
                </label>
                <input
                  id="date"
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  min={minDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  <CalendarDays size={15} /> End date (optional)
                </label>
                <input
                  id="endDate"
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  min={formData.date || minDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="venue">
                  <MapPin size={15} /> Venue
                </label>
                <input
                  id="venue"
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Eko Hotel"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  <MapPin size={15} /> Location
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Victoria Island, Lagos"
                  required
                />
              </div>
            </div>
          </section>

          {/* TICKETS */}
          <section className="form-section">
            <div className="form-section-title">
              <div>
                <h2>Ticket types</h2>
                <p>Create different ticket options for your attendees.</p>
              </div>

              <button type="button" className="add-ticket-btn" onClick={addTicket}>
                <Plus size={17} /> Add ticket
              </button>
            </div>

            <div className="ticket-builder">
              {tickets.map((ticket, index) => (
                <div className="ticket-row" key={index}>
                  <div className="ticket-number">
                    <Ticket size={17} />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`ticket-name-${index}`}>Ticket name</label>
                    <input
                      id={`ticket-name-${index}`}
                      type="text"
                      value={ticket.name}
                      onChange={(e) => updateTicket(index, "name", e.target.value)}
                      placeholder="Regular"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`ticket-price-${index}`}>Price (₦)</label>
                    <input
                      id={`ticket-price-${index}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={ticket.price}
                      onChange={(e) => updateTicket(index, "price", e.target.value)}
                      placeholder="5000"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor={`ticket-qty-${index}`}>Quantity</label>
                    <input
                      id={`ticket-qty-${index}`}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={ticket.quantity}
                      onChange={(e) => updateTicket(index, "quantity", e.target.value)}
                      placeholder="500"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    className="delete-ticket"
                    onClick={() => removeTicket(index)}
                    disabled={tickets.length === 1}
                    aria-label={`Remove ticket ${index + 1}`}
                    style={tickets.length === 1 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SUBMIT */}
          <div className="form-submit">
            <p>Your event will be published immediately after creation.</p>

            {loading && progress > 0 && progress < 100 && (
              <p style={{ fontSize: "13px", color: "#6b7280" }}>Uploading poster... {progress}%</p>
            )}

            <button
              type="submit"
              className="btn btn-primary publish-btn"
              disabled={loading || preparing}
            >
              {preparing ? "Preparing image..." : loading ? "Publishing..." : "Publish Event"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default CreateEvent;
