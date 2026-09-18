import { useState } from "react";
import {
  Upload,
  Plus,
  Trash2,
  CalendarDays,
  MapPin,
  Ticket,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

function CreateEvent() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

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

  const [tickets, setTickets] = useState([
    {
      name: "Regular",
      price: "",
      quantity: "",
    },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB.");
      return;
    }

    setImage(file);

    setPreview(URL.createObjectURL(file));
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
    if (tickets.length === 1) return;

    setTickets((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const updateTicket = (index, field, value) => {
    setTickets((prev) =>
      prev.map((ticket, i) =>
        i === index
          ? {
              ...ticket,
              [field]: value,
            }
          : ticket
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      alert("Please upload an event poster.");
      return;
    }

    if (tickets.length === 0) {
      alert("Please add at least one ticket type.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("date", formData.date);
      data.append("endDate", formData.endDate);
      data.append("venue", formData.venue);
      data.append("location", formData.location);

      data.append(
        "tickets",
        JSON.stringify(
          tickets.map((ticket) => ({
            name: ticket.name,
            price: Number(ticket.price),
            quantity: Number(ticket.quantity),
          }))
        )
      );

      data.append("image", image);

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/events",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert("Event created successfully!");

        navigate(
          `/events/${response.data.event._id}`
        );
      }
    } catch (error) {
      console.error("Create event error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to create event."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-event-page">

      <div className="container">

        <Link
          to="/dashboard"
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="create-event-header">

          <div>
            <span className="page-label">
              ORGANIZER
            </span>

            <h1>Create your event</h1>

            <p>
              Tell people what makes your event worth
              experiencing.
            </p>
          </div>

        </div>

        <form
          className="event-form"
          onSubmit={handleSubmit}
        >

          {/* BASIC INFORMATION */}

          <section className="form-section">

            <div className="form-section-title">

              <div>
                <h2>Event information</h2>

                <p>
                  Give your event a great first impression.
                </p>
              </div>

            </div>

            <div className="form-grid">

              <div className="form-group full">

                <label>
                  Event title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Afrobeat Summer Night"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="music">
                    Music & Concerts
                  </option>

                  <option value="party">
                    Party & Nightlife
                  </option>

                  <option value="business">
                    Business & Tech
                  </option>

                  <option value="arts">
                    Arts & Culture
                  </option>

                  <option value="sports">
                    Sports & Fitness
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

              <div className="form-group full">

                <label>
                  Description
                </label>

                <textarea
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

                <p>
                  Use a high-quality image to attract
                  attendees.
                </p>
              </div>

            </div>

            <label className="image-upload">

              {preview ? (
                <img
                  src={preview}
                  alt="Event preview"
                />
              ) : (
                <div className="upload-placeholder">

                  <div className="upload-icon">
                    <Upload size={25} />
                  </div>

                  <strong>
                    Upload event poster
                  </strong>

                  <span>
                    PNG, JPG or JPEG • Maximum 5MB
                  </span>

                </div>
              )}

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
              />

            </label>

          </section>


          {/* DATE & LOCATION */}

          <section className="form-section">

            <div className="form-section-title">

              <div>
                <h2>Date & location</h2>

                <p>
                  Where and when is your event happening?
                </p>
              </div>

            </div>

            <div className="form-grid">

              <div className="form-group">

                <label>
                  <CalendarDays size={15} />
                  Event date
                </label>

                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  <CalendarDays size={15} />
                  End date
                </label>

                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />

              </div>

              <div className="form-group">

                <label>
                  <MapPin size={15} />
                  Venue
                </label>

                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Eko Hotel"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  <MapPin size={15} />
                  Location
                </label>

                <input
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

                <p>
                  Create different ticket options
                  for your attendees.
                </p>
              </div>

              <button
                type="button"
                className="add-ticket-btn"
                onClick={addTicket}
              >
                <Plus size={17} />
                Add ticket
              </button>

            </div>


            <div className="ticket-builder">

              {tickets.map((ticket, index) => (

                <div
                  className="ticket-row"
                  key={index}
                >

                  <div className="ticket-number">
                    <Ticket size={17} />
                  </div>

                  <div className="form-group">

                    <label>
                      Ticket name
                    </label>

                    <input
                      type="text"
                      value={ticket.name}
                      onChange={(e) =>
                        updateTicket(
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
                        updateTicket(
                          index,
                          "price",
                          e.target.value
                        )
                      }
                      placeholder="5000"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={ticket.quantity}
                      onChange={(e) =>
                        updateTicket(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      placeholder="500"
                      required
                    />

                  </div>

                  <button
                    type="button"
                    className="delete-ticket"
                    onClick={() =>
                      removeTicket(index)
                    }
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              ))}

            </div>

          </section>


          {/* SUBMIT */}

          <div className="form-submit">

            <p>
              Your event will be published immediately
              after creation.
            </p>

            <button
              type="submit"
              className="btn btn-primary publish-btn"
              disabled={loading}
            >
              {loading
                ? "Publishing..."
                : "Publish Event"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}

export default CreateEvent;