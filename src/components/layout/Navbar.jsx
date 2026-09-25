import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, Ticket, Plus, LogOut } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem("token");

  // Lock background scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleCreateEventClick = (e) => {
    e.preventDefault(); 
    const userString = localStorage.getItem('user');

    if (!userString) {
      alert("You need to create an account as an Organizer to host events.");
      navigate('/register'); 
      return;
    }

    const user = JSON.parse(userString);
    if (user.role !== 'organizer' && user.role !== 'admin') {
      alert("Only Organizer accounts can create events. Please register a new account as an organizer.");
      navigate('/register'); 
      return;
    }
    navigate('/create-event');
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  // HIDE NAVBAR ON ALL ADMIN PAGES
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* 
        ✅ ONLY injects styles for the Slick Drawer and Mobile Hiding. 
        Your original .logo, .logo-icon, and .navbar classes remain untouched! 
      */}
      <style>{`
        /* Slick Drawer Overlay */
        .slick-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 998;
          opacity: 0; visibility: hidden; transition: all 0.3s ease;
          backdrop-filter: blur(2px);
        }
        .slick-overlay.open { opacity: 1; visibility: visible; }

        /* Slick Drawer Menu */
        .slick-drawer {
          position: fixed; top: 0; right: -100%; width: 85%; max-width: 320px;
          height: 100vh; background: white; z-index: 999;
          padding: 25px 20px; display: flex; flex-direction: column;
          box-shadow: -5px 0 25px rgba(0,0,0,0.1);
          transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }
        .slick-drawer.open { right: 0; }

        .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .drawer-links { display: flex; flex-direction: column; gap: 20px; }
        .drawer-links a, .drawer-links button {
          font-size: 16px; font-weight: 500; color: #333; text-decoration: none;
          background: none; border: none; text-align: left; padding: 0; cursor: pointer;
        }

        /* Hide desktop elements smoothly on mobile */
        @media (max-width: 850px) {
          .desktop-nav { display: none !important; }
          .nav-actions > *:not(.mobile-menu) { display: none !important; }
          .mobile-menu { display: flex !important; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; color: #111; }
        }
      `}</style>

      <header className="navbar">
        <div className="container navbar-inner">

          {/* PRESERVED: Your exact original logo structure with the rectangle intact */}
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
            <button onClick={handleCreateEventClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              + Create Event
            </button>

            {token ? (
              <>
                <Link to="/my-tickets" className="login-link">My Tickets</Link>
                <Link to="/dashboard" className="login-link">Dashboard</Link>
                <button onClick={handleLogout} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}>
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-link">Login</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}

          {/* Mobile Hamburger Trigger */}
<button className="mobile-menu" onClick={() => setIsOpen(!isOpen)} style={{ zIndex: 1000, position: 'relative' }}>
  {isOpen ? <X size={28} /> : <Menu size={28} />}
</button>
          </div>

        </div>
      </header>

      {/* --- NEW SLICK MOBILE DRAWER --- */}
      <div className={`slick-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      
      <div className={`slick-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          {/* Drawer Logo (Matches desktop) */}
          <Link to="/" className="logo" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: '#111', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="logo-icon" style={{ display: 'flex', background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px' }}>
              <Ticket size={20} />
            </span>
            <span>Tickora</span>
          </Link>
          <button onClick={() => setIsOpen(false)} style={{ background: '#f5f5f5', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
            <X size={20} color="#333" />
          </button>
        </div>

        <div className="drawer-links">
          <Link to="/events" onClick={() => setIsOpen(false)}>Discover</Link>
          <Link to="/categories" onClick={() => setIsOpen(false)}>Categories</Link>
          <Link to="/about" onClick={() => setIsOpen(false)}>About</Link>
          
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '5px 0' }} />
          
          <button onClick={(e) => { setIsOpen(false); handleCreateEventClick(e); }} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
            + Create Event
          </button>

          {token ? (
            <>
              <Link to="/my-tickets" onClick={() => setIsOpen(false)}>My Tickets</Link>
              <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <button 
                onClick={() => { setIsOpen(false); handleLogout(); }} 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '10px', padding: '12px', borderRadius: '8px' }}
              >
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn btn-outline" style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', width: '100%' }}>Login</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ textAlign: 'center', padding: '12px', borderRadius: '8px', width: '100%' }}>Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
