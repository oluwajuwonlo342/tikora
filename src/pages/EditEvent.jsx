import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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
    status: "published",
  });

  const [tickets, setTickets] = useState([
    {
      name: "Regular",
      price: "",
      quantity: "",
    },
  ]);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/events/${id}`);

      if (!response.data.success) {
        setError(
          response.data.message || "Unable to load event."
        );
        return;
      }

      const event = response.data.event;

      setForm({
        title: event.title || "",
        description: event.description || "",
        category: event.category || "music",
        date: formatDateForInput(event.date),
        endDate: event.endDate
          ? formatDateForInput(event.endDate)
          : "",
        venue: event.venue || "",
        location: event.location || "",
        status: event.status || "published",
      });

      setTickets(
        event.tickets?.length
          ? event.tickets.map((ticket) => ({
              _id: ticket._id,
              name: ticket.name || "",
              price: ticket.price ?? "",
              quantity: ticket.quantity ?? "",
              sold: ticket.sold || 0,
            }))
          : [
              {
                name: "Regular",
                price: "",
                quantity: "",
              },
            ]
      );

      setImagePreview(event.image || "");
    } catch (error) {
      console.error("Fetch event error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load event."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();
    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");
    const hours = String(
      parsedDate.getHours()
    ).padStart(2, "0");
    const minutes = String(
      parsedDate.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTicketChange = (
    index,
    field,
    value
  ) => {
    setTickets((prev) =>
      prev.map((ticket, ticketIndex) =>
        ticketIndex === index
          ? {
              ...ticket,
              [field]: value,
            }
          : ticket
      )
    );
  };

  const addTicket = () => {
    setTickets((prev) => [
      ...prev,
      {
        name: "",
        price: "",
        quantity: "",
      },
    ]);
  };

  const removeTicket = (index) => {
    if (tickets.length === 1) {
      return;
    }

    setTickets((prev) =>
      prev.filter(
        (_, ticketIndex) =>
          ticketIndex !== index
      )
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be less than 5MB."
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    setError("");
    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Event title is required.";
    }

    if (!form.description.trim()) {
      return "Event description is required.";
    }

    if (!form.category) {
      return "Please select an event category.";
    }

    if (!form.date) {
      return "Event date is required.";
    }

    if (!form.venue.trim()) {
      return "Venue is required.";
    }

    if (!form.location.trim()) {
      return "Location is required.";
    }

    if (form.endDate) {
      const startDate = new Date(form.date);
      const endDate = new Date(form.endDate);

      if (endDate <= startDate) {
        return "End date must be after the event start date.";
      }
    }

    if (!tickets.length) {
      return "At least one ticket type is required.";
    }

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];

      if (!ticket.name.trim()) {
        return `Ticket ${i + 1} needs a name.`;
      }

      if (
        ticket.price === "" ||
        Number(ticket.price) < 0
      ) {
        return `Enter a valid price for ticket ${
          i + 1
        }.`;
      }

      if (
        ticket.quantity === "" ||
        Number(ticket.quantity) < 1
      ) {
        return `Enter a valid quantity for ticket ${
          i + 1
        }.`;
      }

      if (
        ticket.sold &&
        Number(ticket.quantity) < Number(ticket.sold)
      ) {
        return `Ticket quantity cannot be less than tickets already sold for "${ticket.name}".`;
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "category",
        form.category
      );

      formData.append(
        "date",
        form.date
      );

      if (form.endDate) {
        formData.append(
          "endDate",
          form.endDate
        );
      }

      formData.append(
        "venue",
        form.venue.trim()
      );

      formData.append(
        "location",
        form.location.trim()
      );

      formData.append(
        "status",
        form.status
      );

      const cleanTickets = tickets.map(
        (ticket) => ({
          ...(ticket._id
            ? { _id: ticket._id }
            : {}),
          name: ticket.name.trim(),
          price: Number(ticket.price),
          quantity: Number(ticket.quantity),
          sold: Number(ticket.sold || 0),
        })
      );

      formData.append(
        "tickets",
        JSON.stringify(cleanTickets)
      );

      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      console.log("Updating event:", id);

      const response = await api.put(
        `/events/${id}`,
        formData
      );

      console.log(
        "UPDATE EVENT RESPONSE:",
        response.data
      );

      if (response.data.success) {
        setSuccess(
          "Event updated successfully."
        );

        setTimeout(() => {
          navigate(`/events/${id}`);
        }, 1000);
      } else {
        setError(
          response.data.message ||
            "Unable to update event."
        );
      }
    } catch (error) {
      console.error(
        "Update event error:",
        error
      );

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to update event. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="edit-event-page">
        <div className="container">
          <div className="events-loading">
            <Loader2
              size={28}
              className="loading-spinner"
            />
            <p>Loading event...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="edit-event-page">
      <div className="container">

        <Link
          to="/my-events"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to My Events
        </Link>

        <div className="edit-event-header">
          <div>
            <span className="page-label">
              ORGANIZER
            </span>

            <h1>Edit Event</h1>

            <p>
              Update your event information,
              tickets, and event image.
            </p>
          </div>
        </div>

        {error && (
          <div className="form-error">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="form-success">
            <p>{success}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="edit-event-form"
        >

          {/* EVENT INFORMATION */}

          <section className="form-section">
            <div className="form-section-header">
              <h2>Event Information</h2>
              <p>
                Update the basic information
                about your event.
              </p>
            </div>

            <div className="form-grid">

              <div className="form-group full-width">
                <label htmlFor="title">
                  Event title *
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">
                  Description *
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your event"
                  rows="6"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  Category *
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="music">
                    Music
                  </option>

                  <option value="party">
                    Party
                  </option>

                  <option value="business">
                    Business
                  </option>

                  <option value="arts">
                    Arts
                  </option>

                  <option value="sports">
                    Sports
                  </option>

                  <option value="education">
                    Education
                  </option>

                  <option value="festival">
                    Festival
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">
                  Event Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date">
                  Start date & time *
                </label>

                <input
                  id="date"
                  name="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  End date & time
                </label>

                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="venue">
                  Venue *
                </label>

                <input
                  id="venue"
                  name="venue"
                  type="text"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="e.g. Shugarland"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  Location *
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Apata, Ibadan"
                  required
                />
              </div>

            </div>
          </section>


          {/* EVENT IMAGE */}

          <section className="form-section">
            <div className="form-section-header">
              <h2>Event Image</h2>

              <p>
                Upload a new image if you want
                to replace the current one.
              </p>
            </div>

            <div className="event-image-upload">

              {imagePreview ? (
                <div className="image-preview">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    onError={(e) => {
                      e.currentTarget.src =
                        "/placeholder-event.jpg";
                    }}
                  />
                </div>
              ) : (
                <div className="image-placeholder">
                  <ImageIcon size={40} />
                  <p>No image selected</p>
                </div>
              )}

              <label
                htmlFor="event-image"
                className="image-upload-button"
              >
                <ImageIcon size={18} />
                {imageFile
                  ? "Change Image"
                  : "Choose New Image"}
              </label>

              <input
                id="event-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />

              <small>
                JPG, PNG, WEBP — maximum 5MB
              </small>
            </div>
          </section>


          {/* TICKETS */}

          <section className="form-section">
            <div className="form-section-header ticket-header">
              <div>
                <h2>Ticket Types</h2>

                <p>
                  Manage the tickets available
                  for your event.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={addTicket}
              >
                <Plus size={17} />
                Add Ticket
              </button>
            </div>

            <div className="ticket-edit-list">

              {tickets.map(
                (ticket, index) => (
                  <div
                    className="ticket-edit-item"
                    key={
                      ticket._id ||
                      `ticket-${index}`
                    }
                  >

                    <div className="ticket-edit-title">
                      <span>
                        Ticket {index + 1}
                      </span>

                      {ticket.sold > 0 && (
                        <small>
                          {ticket.sold} sold
                        </small>
                      )}
                    </div>

                    <div className="ticket-form-grid">

                      <div className="form-group">
                        <label>
                          Ticket name
                        </label>

                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Regular"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Price (₦)
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={ticket.price}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "price",
                              e.target.value
                            )
                          }
                          placeholder="2500"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Quantity
                        </label>

                        <input
                          type="number"
                          min={ticket.sold || 1}
                          value={ticket.quantity}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          placeholder="150"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        className="remove-ticket-btn"
                        onClick={() =>
                          removeTicket(index)
                        }
                        disabled={
                          tickets.length === 1
                        }
                        title="Remove ticket"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>
                  </div>
                )
              )}

            </div>
          </section>


          {/* ACTIONS */}

          <div className="edit-event-actions">

            <Link
              to="/my-events"
              className="btn btn-secondary"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="loading-spinner"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}

export default EditEvent;