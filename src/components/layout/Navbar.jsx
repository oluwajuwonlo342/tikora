import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Menu, X, Ticket, Plus, LogOut } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const token = localStorage.getItem("token");

  // Lock body scroll when mobile menu is open
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
      {/* Responsive Styles Injection */}
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .navbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
          padding: 0 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 20px;
          color: #111;
          text-decoration: none;
        }
        .logo-icon {
          color: var(--primary);
          display: flex;
        }
        .desktop-nav {
          display: flex;
          gap: 25px;
        }
        .desktop-nav a {
          text-decoration: none;
          color: #555;
          font-weight: 500;
          transition: color 0.2s;
        }
        .desktop-nav a:hover { color: var(--primary); }
        
        .nav-actions-desktop {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #111;
        }

        /* --- SLICK MOBILE DRAWER --- */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 99;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(2px);
        }
        .drawer-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        .mobile-drawer {
          position: fixed;
          top: 0;
          right: -100%;
          width: 85%;
          max-width: 320px;
          height: 100vh;
          background: white;
          z-index: 100;
          padding: 25px 20px;
          display: flex;
          flex-direction: column;
          box-shadow: -5px 0 25px rgba(0,0,0,0.1);
          transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }
        .mobile-drawer.open {
          right: 0;
        }
        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .drawer-links {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .drawer-links a, .drawer-links button {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          text-decoration: none;
          background: none;
          border: none;
          text-align: left;
          padding: 0;
          cursor: pointer;
        }

        /* --- RESPONSIVE BREAKPOINTS --- */
        @media (max-width: 850px) {
          .desktop-nav, .nav-actions-desktop {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .navbar-inner {
            height: 60px; /* Slimmer header on mobile */
            padding: 0 15px;
          }
        }
      `}</style>

      <header className="navbar">
        <div className="navbar-inner">

          {/* LOGO */}
          <Link to="/" className="logo">
            <span className="logo-icon"><Ticket size={24} /></span>
            <span>Tickora</span>
          </Link>

          {/* DESKTOP CENTER NAV */}
          <nav className="desktop-nav">
            <Link to="/events">Discover</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/about">About</Link>
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="nav-actions-desktop">
            <button 
              onClick={handleCreateEventClick}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600', color: '#333' }}
            >
              + Create Event
            </button>

            {token ? (
              <>
                <Link to="/my-tickets" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>My Tickets</Link>
                <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>Dashboard</Link>
                <button onClick={handleLogout} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px' }}>
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ textDecoration: 'none', color: '#333', fontWeight: '600' }}>Login</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '8px 18px', borderRadius: '8px' }}>Get Started</Link>
              </>
            )}
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
            <Menu size={28} />
          </button>

        </div>
      </header>

      {/* --- MOBILE SLICK DRAWER --- */}
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      
      <div className={`mobile-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
            <span className="logo-icon"><Ticket size={24} /></span>
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
          
          {/* ✅ Now properly uses your role-checking logic inside the mobile menu */}
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
