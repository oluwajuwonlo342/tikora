import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CreditCard, Calendar, Users, 
  CheckCircle, Loader, LogOut, ShieldAlert, Trash2, Menu, X
} from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // Live State Data
  const [stats, setStats] = useState({ totalRevenue: 0, totalUsers: 0, activeEvents: 0 });
  const [usersList, setUsersList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/admin/login');
      return;
    }
    const user = JSON.parse(userString);
    if (user.role !== 'admin') {
      navigate('/dashboard'); 
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [statsRes, usersRes, eventsRes, payoutsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/events'),
          api.get('/payouts/admin/all')
        ]);

        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (usersRes.data.success) setUsersList(usersRes.data.users);
        if (eventsRes.data.success) setEventsList(eventsRes.data.events);
        
        if (payoutsRes.data.success) {
           const pending = payoutsRes.data.payouts.filter(p => p.status === 'pending');
           setPendingPayouts(pending);
        }
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleApprovePayout = async (payoutId) => {
    if (!window.confirm("Are you sure you want to approve and transfer these funds?")) return;
    try {
      const res = await api.post(`/payouts/admin/approve/${payoutId}`);
      if (res.data.success) {
        alert("Payout approved successfully!");
        setPendingPayouts(prev => prev.filter(p => p._id !== payoutId));
      } else {
        alert(res.data.message || "Failed to approve payout.");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Server error while processing payout.");
    }
  };

  // --- RENDERERS ---

  const renderOverview = () => (
    <div className="stat-grid">
      <div style={{ padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <span style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Revenue (7% Fees)</span>
        <h3 style={{ color: '#111', fontSize: '36px', margin: '10px 0 0 0' }}>₦{stats.totalRevenue.toLocaleString()}</h3>
      </div>
      <div style={{ padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <span style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Registered Users</span>
        <h3 style={{ color: 'var(--primary)', fontSize: '36px', margin: '10px 0 0 0' }}>{stats.totalUsers}</h3>
      </div>
      <div style={{ padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <span style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Events</span>
        <h3 style={{ color: '#00b060', fontSize: '36px', margin: '10px 0 0 0' }}>{stats.activeEvents}</h3>
      </div>
    </div>
  );

  const renderTable = (headers, data, renderRow) => (
    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table style={{ width: '100%', minWidth: '700px', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
          <tr>
            {headers.map((h, i) => <th key={i} style={{ padding: '18px 25px', color: '#555', fontSize: '14px', whiteSpace: 'nowrap' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map(renderRow) : (
            <tr><td colSpan={headers.length} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No records found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <style>{`
        /* BASE LAYOUT */
        .admin-layout { display: flex; height: 100vh; width: 100vw; background: #f4f7f6; overflow: hidden; }
        
        /* SIDEBAR */
        .admin-sidebar { 
          width: 280px; 
          min-width: 280px; 
          background: #0a0a0a; 
          color: white; 
          display: flex; 
          flex-direction: column; 
          padding: 30px 20px; 
          transition: transform 0.3s ease; 
          z-index: 1000; 
        }
        
        /* MAIN CONTENT AREA */
        .admin-main { 
          flex: 1; 
          padding: 50px; 
          overflow-y: auto; 
          position: relative; 
          min-width: 0; /* CRITICAL FIX: prevents flexbox children from breaking past the screen width */
        }
        
        /* MOBILE MENU BUTTON & OVERLAY */
        .mobile-menu-btn { 
          display: none; 
          position: fixed; 
          top: 20px; 
          right: 20px; 
          z-index: 1001; 
          background: #ff5a36; 
          color: white; 
          border: none; 
          padding: 10px; 
          border-radius: 8px; 
          cursor: pointer; 
          box-shadow: 0 4px 10px rgba(255,90,54,0.3);
        }
        
        .overlay { 
          display: none; 
          position: fixed; 
          inset: 0; 
          background: rgba(0,0,0,0.6); 
          z-index: 999; 
          backdrop-filter: blur(2px);
        }
        
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; }
        
        /* RESPONSIVE BREAKPOINTS (Tablet & Mobile) */
        @media (max-width: 992px) {
          .admin-sidebar { position: fixed; height: 100vh; top: 0; left: 0; transform: translateX(-100%); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { padding: 80px 20px 30px; }
          .mobile-menu-btn { display: flex; align-items: center; justify-content: center; }
          .overlay.open { display: block; }
          .stat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="admin-layout">
        
        {/* Mobile Overlay */}
        <div className={`overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

        {/* Mobile Hamburger Button */}
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* PROFESSIONAL SIDEBAR */}
        <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px', marginBottom: '40px' }}>
            <ShieldAlert size={28} color="#ff5a36" />
            <h2 style={{ fontSize: '22px', margin: 0, letterSpacing: '1px' }}>Admin<span style={{ color: '#ff5a36' }}>Portal</span></h2>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Platform Overview' },
              { id: 'payouts', icon: CreditCard, label: 'Payout Requests' },
              { id: 'users', icon: Users, label: 'Manage Users' },
              { id: 'events', icon: Calendar, label: 'Event Moderation' }
            ].map(tab => (
              <li key={tab.id}>
                <button 
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false); // Auto-close menu on mobile after clicking a tab
                  }} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '15px', 
                    background: activeTab === tab.id ? 'rgba(255, 90, 54, 0.1)' : 'transparent', 
                    color: activeTab === tab.id ? '#ff5a36' : '#999', 
                    border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    fontWeight: activeTab === tab.id ? '600' : '400',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <tab.icon size={20} /> {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '15px', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut size={20} /> Secure Logout
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="admin-main">
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', color: '#111', margin: 0, textTransform: 'capitalize' }}>
              {activeTab.replace('-', ' ')}
            </h1>
            <p style={{ color: '#777', marginTop: '8px' }}>Manage and monitor your platform's activity.</p>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <Loader className="animate-spin" size={50} color="#ff5a36" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              
              {activeTab === 'payouts' && renderTable(
                ['Organizer', 'Event', 'Amount', 'Action'],
                pendingPayouts,
                (p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '20px 25px' }}>{p.organizer?.name || 'Unknown'}</td>
                    <td style={{ padding: '20px 25px' }}>{p.event?.title || 'Unknown Event'}</td>
                    <td style={{ padding: '20px 25px', fontWeight: 'bold' }}>₦{p.amount.toLocaleString()}</td>
                    <td style={{ padding: '20px 25px', display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleApprovePayout(p._id)} 
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#00b060', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'users' && renderTable(
                ['Name', 'Email', 'Role', 'Status', 'Action'],
                usersList,
                (u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '20px 25px', fontWeight: '600' }}>{u.name}</td>
                    <td style={{ padding: '20px 25px', color: '#555' }}>{u.email}</td>
                    <td style={{ padding: '20px 25px' }}><span style={{ background: u.role === 'admin' ? '#ff5a36' : '#eee', color: u.role === 'admin' ? 'white' : '#333', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>{u.role}</span></td>
                    <td style={{ padding: '20px 25px', color: u.isActive ? '#00b060' : '#cc0000', fontWeight: 'bold' }}>{u.isActive ? 'Active' : 'Suspended'}</td>
                    <td style={{ padding: '20px 25px' }}>
                      <button style={{ color: '#cc0000', background: '#ffe6e6', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Ban User</button>
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'events' && renderTable(
                ['Event Title', 'Organizer', 'Tickets Sold', 'Action'],
                eventsList,
                (e) => {
                  const totalSold = e.tickets && e.tickets.length > 0 
                    ? e.tickets.reduce((sum, tier) => sum + (tier.sold || 0), 0) 
                    : (e.eventTicketsSold || 0);

                  return (
                    <tr key={e._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '20px 25px', fontWeight: '600' }}>{e.title}</td>
                      <td style={{ padding: '20px 25px' }}>{e.organizer?.name || 'Unknown'}</td>
                      <td style={{ padding: '20px 25px', fontWeight: 'bold' }}>{totalSold}</td>
                      <td style={{ padding: '20px 25px' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'white', background: '#cc0000', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;