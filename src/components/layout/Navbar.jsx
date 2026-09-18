import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, Ticket, Plus, LogOut } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();

  const handleCreateEventClick = (e) => {
    e.preventDefault(); // Stop the default link navigation

    const userString = localStorage.getItem('user');

    // 1. If they are a completely unauthenticated guest
    if (!userString) {
      alert("You need to create an account as an Organizer to host events.");
      navigate('/register'); 
      return;
    }

    const user = JSON.parse(userString);

    // 2. If they are logged in, but as a regular attendee/user
    if (user.role !== 'organizer' && user.role !== 'admin') {
      alert("Only Organizer accounts can create events. Please register a new account as an organizer.");
      navigate('/register'); 
      return;
    }

    // 3. If they are an organizer, let them through
    navigate('/create-event');
  };
  // ✅ 1. INITIALIZE LOCATION HOOK
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if user is logged in
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Redirect to home and refresh to clear any cached states
    navigate("/");
    window.location.reload();
  };

  // ✅ 2. HIDE NAVBAR ON ALL ADMIN PAGES
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">

        <Link to="/" className="logo">
          <span className="logo-icon">
            <Ticket size={20} />
          </span>
          <span>Tickora</span>
        </Link>

        <nav className="desktop-nav">
          <Link to="/events">Discover</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/about">About</Link>
        </nav>

        <div className="nav-actions">
          <button 
  onClick={handleCreateEventClick}
  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} // Adjust styles to match your current nav link
>
  + Create Event
</button>

          {token ? (
            <>
              <Link to="/my-tickets" className="login-link">
                My Tickets
              </Link>
              <Link to="/dashboard" className="login-link">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}

          <button className="mobile-menu" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {isOpen && (
        <div className="mobile-dropdown-menu" style={{
          background: 'white',
          borderBottom: '1px solid #ddd',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
        }}>
          <Link to="/events" onClick={() => setIsOpen(false)} style={{ fontSize: '16px', fontWeight: '500' }}>Discover</Link>
          <Link to="/categories" onClick={() => setIsOpen(false)} style={{ fontSize: '16px', fontWeight: '500' }}>Categories</Link>
          <Link to="/about" onClick={() => setIsOpen(false)} style={{ fontSize: '16px', fontWeight: '500' }}>About</Link>
          <hr style={{ borderColor: '#eee' }} />
          <Link to="/create-event" onClick={() => setIsOpen(false)} style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>Create Event</Link>

          {token ? (
            <>
              <Link to="/my-tickets" onClick={() => setIsOpen(false)} style={{ fontSize: '16px', fontWeight: '500' }}>My Tickets</Link>
              <Link to="/dashboard" onClick={() => setIsOpen(false)} style={{ fontSize: '16px', fontWeight: '500' }}>Dashboard</Link>
              <button onClick={() => { setIsOpen(false); handleLogout(); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>Login</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;