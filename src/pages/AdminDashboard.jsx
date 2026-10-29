import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Calendar, Users,
  CheckCircle, Loader, LogOut, ShieldAlert, Trash2, Menu, X, History
} from 'lucide-react';
import api from '../services/api';

// Works out when a payout was approved (uses whichever date field your backend sends)
const getApprovalDate = (p) => p.approvedAt || p.processedAt || p.paidAt || p.updatedAt || p.createdAt;

// Nigeria timezone
const TIME_ZONE = 'Africa/Lagos';

// Safely format dates in Nigerian time
const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-NG', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Safely format times in Nigerian time
const formatTime = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-NG', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
};

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
  const [payoutHistory, setPayoutHistory] = useState([]);

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
          const all = payoutsRes.data.payouts;

          setPendingPayouts(all.filter(p => p.status === 'pending'));

          // History = everything that is no longer pending, newest first
          const history = all
            .filter(p => p.status !== 'pending')
            .sort((a, b) => new Date(getApprovalDate(b)) - new Date(getApprovalDate(a)));
          setPayoutHistory(history);
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

  // ==========================================
  // APPROVE PAYOUT — MANUAL TRANSFER
  //
  // The backend no longer calls Paystack's Transfer API (Starter Business
  // accounts can't send to third parties). Instead, you send the money
  // yourself via your own bank app using the bank details shown in the
  // table below, then enter that transfer's reference here as proof
  // before the payout is marked approved.
  // ==========================================
  const handleApprovePayout = async (payoutId) => {
    const paymentReference = window.prompt(
      "Enter the bank transaction reference for the transfer you just sent to the organizer:"
    );

    if (paymentReference === null) return; // user cancelled

    if (!paymentReference.trim()) {
      alert("A payment reference is required to approve this payout.");
      return;
    }

    try {
      const res = await api.post(`/payouts/admin/approve/${payoutId}`, {
        paymentReference: paymentReference.trim()
      });
      if (res.data.success) {
        const approved = pendingPayouts.find(p => p._id === payoutId);

        if (approved) {
          // Add it to the history straight away with the time of approval
          setPayoutHistory(prev => [
            {
              ...approved,
              ...(res.data.payout || {}),
              status: res.data.payout?.status || 'approved',
              paymentReference: res.data.payout?.paymentReference || paymentReference.trim(),
              approvedAt: res.data.payout?.approvedAt || new Date().toISOString()
            },
            ...prev
          ]);
        }

        setPendingPayouts(prev => prev.filter(p => p._id !== payoutId));
        alert("Payout marked as approved and paid.");
        setActiveTab('history'); // show the history right after approving
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

  const renderPayoutHistory = () => {
    const totalPaidOut = payoutHistory.reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
      <>
        <div style={{ padding: '25px 30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '25px', display: 'inline-block', minWidth: '260px' }}>
          <span style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Paid Out</span>
          <h3 style={{ color: '#00b060', fontSize: '32px', margin: '8px 0 0 0' }}>₦{totalPaidOut.toLocaleString()}</h3>
          <span style={{ color: '#999', fontSize: '13px' }}>{payoutHistory.length} payout{payoutHistory.length === 1 ? '' : 's'}</span>
        </div>

        {renderTable(
          ['Date', 'Time', 'Organizer', 'Event', 'Amount', 'Payment Reference', 'Status'],
          payoutHistory,
          (p) => {
            const when = getApprovalDate(p);
            return (
              <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '20px 25px', whiteSpace: 'nowrap' }}>{formatDate(when)}</td>
                <td style={{ padding: '20px 25px', whiteSpace: 'nowrap', color: '#555' }}>{formatTime(when)}</td>
                <td style={{ padding: '20px 25px', fontWeight: '600' }}>{p.organizer?.name || 'Unknown'}</td>
                <td style={{ padding: '20px 25px' }}>{p.event?.title || 'Unknown Event'}</td>
                <td style={{ padding: '20px 25px', fontWeight: 'bold', color: '#00b060' }}>₦{(p.amount || 0).toLocaleString()}</td>
                <td style={{ padding: '20px 25px', fontFamily: 'monospace', fontSize: '13px' }}>{p.paymentReference || '—'}</td>
                <td style={{ padding: '20px 25px' }}>
                  <span style={{ background: '#e6f7ee', color: '#00b060', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {p.status}
                  </span>
                </td>
              </tr>
            );
          }
        )}
      </>
    );
  };

  const tabTitles = {
    overview: 'Platform Overview',
    payouts: 'Payout Requests',
    history: 'Payout History',
    users: 'Manage Users',
    events: 'Event Moderation'
  };

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
              { id: 'history', icon: History, label: 'Payout History' },
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
            <h1 style={{ fontSize: '32px', color: '#111', margin: 0 }}>
              {tabTitles[activeTab] || activeTab}
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
                ['Organizer', 'Event', 'Amount', 'Bank', 'Account Number', 'Account Name', 'Action'],
                pendingPayouts,
                (p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '20px 25px' }}>{p.organizer?.name || 'Unknown'}</td>
                    <td style={{ padding: '20px 25px' }}>{p.event?.title || 'Unknown Event'}</td>
                    <td style={{ padding: '20px 25px', fontWeight: 'bold' }}>₦{p.amount.toLocaleString()}</td>
                    <td style={{ padding: '20px 25px' }}>{p.bankDetails?.bankName || '—'}</td>
                    <td style={{ padding: '20px 25px', fontFamily: 'monospace' }}>{p.bankDetails?.accountNumber || '—'}</td>
                    <td style={{ padding: '20px 25px' }}>{p.bankDetails?.accountName || '—'}</td>
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

              {activeTab === 'history' && renderPayoutHistory()}

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
                ['Event Title', 'Organizer', 'Tickets Sold', 'Gross Amount', 'Platform Fee (7%)', 'Action'],
                eventsList,
                (e) => {
                  const totalSold = e.tickets && e.tickets.length > 0
                    ? e.tickets.reduce((sum, tier) => sum + (tier.sold || 0), 0)
                    : (e.eventTicketsSold || 0);

                  // Use variables computed in the backend, default to 0 if not yet available
                  const grossEarned = e.grossEarned || 0;
                  const platformFee = e.platformFee || 0;

                  return (
                    <tr key={e._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '20px 25px', fontWeight: '600' }}>{e.title}</td>
                      <td style={{ padding: '20px 25px' }}>{e.organizer?.name || 'Unknown'}</td>
                      <td style={{ padding: '20px 25px', fontWeight: 'bold' }}>{totalSold}</td>
                      <td style={{ padding: '20px 25px', fontWeight: 'bold' }}>₦{grossEarned.toLocaleString()}</td>
                      <td style={{ padding: '20px 25px', fontWeight: 'bold', color: '#e65100' }}>₦{platformFee.toLocaleString()}</td>
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
