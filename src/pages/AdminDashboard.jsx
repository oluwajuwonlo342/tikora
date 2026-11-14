import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Calendar, Users,
  CheckCircle, XCircle, Loader, LogOut, ShieldAlert, Trash2, Menu, X, History, Mail, Bell
} from 'lucide-react';
import api from '../services/api';
import AdminEmailPanel from './AdminEmailPanel';

// Works out when a payout was approved (uses whichever date field your backend sends)
const getApprovalDate = (p) => p.approvedAt || p.rejectedAt || p.processedAt || p.paidAt || p.updatedAt || p.createdAt;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : '—';

// Short beep when a new payout request arrives (browsers may block it until the page has been clicked once)
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 400);
  } catch (error) {
    // Sound is optional, ignore failures
  }
};

const POLL_INTERVAL_MS = 30 * 1000; // how often to check for new payout requests

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
  const [eventBalances, setEventBalances] = useState({});
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [toasts, setToasts] = useState([]);

  // IDs of pending payout requests the admin has already been told about
  const knownPendingIds = useRef(new Set());
  const originalTitle = useRef(document.title);

  // Splits the full payout list into "pending" and "history" and remembers which requests are known
  const applyPayouts = (all) => {
    const pending = all.filter(p => p.status === 'pending');
    setPendingPayouts(pending);
    knownPendingIds.current = new Set(pending.map(p => p._id));

    // History = everything that is no longer pending, newest first
    const history = all
      .filter(p => p.status !== 'pending')
      .sort((a, b) => new Date(getApprovalDate(b)) - new Date(getApprovalDate(a)));
    setPayoutHistory(history);
  };

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
        const [statsRes, usersRes, eventsRes, payoutsRes, balancesRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/events'),
          api.get('/payouts/admin/all'),
          // Server-side balances: the same calculation organizers see and payouts are checked against
          api.get('/payouts/admin/event-balances').catch(() => null)
        ]);

        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (usersRes.data.success) setUsersList(usersRes.data.users);
        if (eventsRes.data.success) setEventsList(eventsRes.data.events);

        if (balancesRes?.data?.success) setEventBalances(balancesRes.data.balances);

        if (payoutsRes.data.success) {
          applyPayouts(payoutsRes.data.payouts);

          // If requests are already waiting when you open the dashboard, say so straight away
          const waiting = payoutsRes.data.payouts.filter(p => p.status === 'pending').length;
          if (waiting > 0) {
            setToasts([{
              id: 'waiting-on-login',
              title: 'Payout requests waiting',
              text: waiting === 1
                ? 'You have 1 payout request waiting for approval.'
                : `You have ${waiting} payout requests waiting for approval.`
            }]);
          }
        }
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  // ==========================================
  // NEW PAYOUT REQUEST NOTIFICATIONS
  // Checks for new requests every 30 seconds. When one arrives it shows a
  // pop-up, plays a beep, reloads the Payout Requests list and updates the
  // badge and browser tab title.
  // ==========================================
  useEffect(() => {
    if (loading) return undefined;
    let stopped = false;

    const checkForNewRequests = async () => {
      try {
        const res = await api.get('/payouts/admin/pending-summary');
        if (stopped || !res.data.success) return;

        const { count, latest } = res.data;
        const newOnes = latest.filter(p => !knownPendingIds.current.has(p._id));

        // Nothing changed since the last check
        if (newOnes.length === 0 && count === knownPendingIds.current.size) return;

        // Something changed: reload the full list so the table is up to date
        const all = await api.get('/payouts/admin/all');
        if (stopped) return;
        if (all.data.success) applyPayouts(all.data.payouts);
        refreshEventBalances();

        if (newOnes.length > 0) {
          const newToasts = newOnes.map(p => ({
            id: p._id,
            text: `${p.organizerName || 'An organizer'} requested ₦${(p.amount || 0).toLocaleString()}${p.eventTitle ? ` for ${p.eventTitle}` : ''}`
          }));

          // Pop-ups stay on screen until you click them or close them
          setToasts(prev => [...prev, ...newToasts].slice(-4));
          playBeep();
        }
      } catch (error) {
        console.error('Could not check for new payout requests', error);
      }
    };

    const intervalId = setInterval(checkForNewRequests, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [loading]);

  // Shows the number of waiting requests in the browser tab title, e.g. "(2) Admin Portal"
  useEffect(() => {
    const count = pendingPayouts.length;
    document.title = count > 0 ? `(${count}) Admin Portal` : 'Admin Portal';
  }, [pendingPayouts.length]);

  useEffect(() => {
    const title = originalTitle.current;
    return () => { document.title = title; };
  }, []);

  // Re-reads the server balances after a payout is approved or rejected
  const refreshEventBalances = async () => {
    try {
      const res = await api.get('/payouts/admin/event-balances');
      if (res.data.success) setEventBalances(res.data.balances);
    } catch (error) {
      console.error('Could not refresh event balances', error);
    }
  };

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

        knownPendingIds.current.delete(payoutId);
        setPendingPayouts(prev => prev.filter(p => p._id !== payoutId));
        refreshEventBalances();
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

  // ==========================================
  // REJECT PAYOUT
  // Asks for a reason, tells the backend, then moves the request
  // out of "Payout Requests" and into "Payout History" as rejected.
  // ==========================================
  const handleRejectPayout = async (payoutId) => {
    const reason = window.prompt(
      "Why are you rejecting this payout request? The reason is saved with the record."
    );

    if (reason === null) return; // admin cancelled

    if (!reason.trim()) {
      alert("Please enter a reason for rejecting this payout.");
      return;
    }

    try {
      const res = await api.post(`/payouts/admin/reject/${payoutId}`, {
        reason: reason.trim()
      });

      if (res.data.success) {
        const rejected = pendingPayouts.find(p => p._id === payoutId);

        if (rejected) {
          setPayoutHistory(prev => [
            {
              ...rejected,
              ...(res.data.payout || {}),
              status: 'rejected',
              rejectionReason: res.data.payout?.rejectionReason || reason.trim(),
              rejectedAt: res.data.payout?.rejectedAt || new Date().toISOString()
            },
            ...prev
          ]);
        }

        knownPendingIds.current.delete(payoutId);
        setPendingPayouts(prev => prev.filter(p => p._id !== payoutId));
        refreshEventBalances();
        alert("Payout request rejected.");
      } else {
        alert(res.data.message || "Failed to reject payout.");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Server error while rejecting payout.");
    }
  };

  // Works out the money for one event:
  //   gross       = Gross Revenue: price x number sold for every ticket type
  //                 (the 7% platform fee paid by buyers on top is NOT included)
  //   collected   = Amount Collected: all the ticket money actually received
  //                 (can be more than gross if a payment was never matched to a ticket)
  //   paidOut     = payouts already approved
  //   requested   = payouts waiting for approval
  //   amountLeft  = Gross Revenue - (paid out + requested)
  const NOT_PAID_STATUSES = ['rejected', 'failed', 'declined', 'cancelled'];

  const getEventPayoutSummary = (event) => {
    const platformFee = event.platformFee || 0;

    let gross;
    let collected;
    let paidOut;
    let requested;

    const serverBalance = eventBalances[event._id];

    if (serverBalance) {
      gross = serverBalance.grossRevenue ?? serverBalance.totalEarned;
      collected = serverBalance.amountCollected ?? gross;
      paidOut = serverBalance.paid;
      requested = serverBalance.pending;
    } else {
      // Fallback if the balances request is unavailable (less exact)
      const matchesEvent = (p) => (p.event?._id || p.event) === event._id;

      gross = event.grossEarned || 0;
      collected = gross;

      paidOut = payoutHistory
        .filter((p) => matchesEvent(p) && !NOT_PAID_STATUSES.includes(p.status))
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      requested = pendingPayouts
        .filter(matchesEvent)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    // Amount Left = Gross Revenue - (paid out + requested), but never based on
    // more than the money actually collected (the lower of the two)
    const base = Math.min(gross, collected);
    const limitedByCollected = collected < gross;
    const amountLeft = Math.max(base - paidOut - requested, 0);

    return { gross, platformFee, collected, paidOut, requested, amountLeft, limitedByCollected };
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
    const totalPaidOut = payoutHistory
      .filter((p) => !NOT_PAID_STATUSES.includes(p.status))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
      <>
        <div style={{ padding: '25px 30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '25px', display: 'inline-block', minWidth: '260px' }}>
          <span style={{ color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Paid Out</span>
          <h3 style={{ color: '#00b060', fontSize: '32px', margin: '8px 0 0 0' }}>₦{totalPaidOut.toLocaleString()}</h3>
          <span style={{ color: '#999', fontSize: '13px' }}>{payoutHistory.length} payout{payoutHistory.length === 1 ? '' : 's'}</span>
        </div>

        {renderTable(
          ['Date', 'Time', 'Organizer', 'Event', 'Amount', 'Reference / Reason', 'Status'],
          payoutHistory,
          (p) => {
            const when = getApprovalDate(p);
            const isRejected = NOT_PAID_STATUSES.includes(p.status);
            return (
              <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '20px 25px', whiteSpace: 'nowrap' }}>{formatDate(when)}</td>
                <td style={{ padding: '20px 25px', whiteSpace: 'nowrap', color: '#555' }}>{formatTime(when)}</td>
                <td style={{ padding: '20px 25px', fontWeight: '600' }}>{p.organizer?.name || 'Unknown'}</td>
                <td style={{ padding: '20px 25px' }}>{p.event?.title || 'Unknown Event'}</td>
                <td style={{ padding: '20px 25px', fontWeight: 'bold', color: isRejected ? '#999' : '#00b060', textDecoration: isRejected ? 'line-through' : 'none' }}>₦{(p.amount || 0).toLocaleString()}</td>
                {isRejected ? (
                  <td style={{ padding: '20px 25px', fontSize: '13px', color: '#cc0000', maxWidth: '260px' }}>{p.rejectionReason || '—'}</td>
                ) : (
                  <td style={{ padding: '20px 25px', fontFamily: 'monospace', fontSize: '13px' }}>{p.paymentReference || '—'}</td>
                )}
                <td style={{ padding: '20px 25px' }}>
                  <span style={{ background: isRejected ? '#ffe6e6' : '#e6f7ee', color: isRejected ? '#cc0000' : '#00b060', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
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
    events: 'Event Moderation',
    emails: 'Send Emails'
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

        {/* New payout request pop-ups */}
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 'calc(100vw - 40px)' }}>
          {toasts.map(t => (
            <div
              key={t.id}
              onClick={() => {
                setActiveTab('payouts');
                setToasts(prev => prev.filter(x => x.id !== t.id));
              }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#111', color: 'white', padding: '14px 18px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.25)', cursor: 'pointer', width: '340px', maxWidth: '100%', borderLeft: '4px solid #ff5a36' }}
            >
              <Bell size={20} color="#ff5a36" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '2px' }}>{t.title || 'New payout request'}</strong>
                <span style={{ fontSize: '13px', color: '#ccc' }}>{t.text}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts(prev => prev.filter(x => x.id !== t.id));
                }}
                aria-label="Dismiss"
                style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 0, flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Mobile Hamburger Button */}
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          {pendingPayouts.length > 0 && !isSidebarOpen && (
            <span style={{ position: 'absolute', top: '-8px', left: '-8px', background: '#cc0000', color: 'white', borderRadius: '20px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', padding: '0 5px' }}>
              {pendingPayouts.length}
            </span>
          )}
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
              { id: 'events', icon: Calendar, label: 'Event Moderation' },
              { id: 'emails', icon: Mail, label: 'Send Emails' }
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
                  {tab.id === 'payouts' && pendingPayouts.length > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#ff5a36', color: 'white', borderRadius: '20px', padding: '2px 9px', fontSize: '12px', fontWeight: 'bold' }}>
                      {pendingPayouts.length}
                    </span>
                  )}
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

          {!loading && pendingPayouts.length > 0 && activeTab !== 'payouts' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap', background: '#fff4e0', border: '1px solid #ffd9a0', borderRadius: '12px', padding: '14px 20px', marginBottom: '25px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#8a5200', fontWeight: 600, fontSize: '14px' }}>
                <Bell size={18} />
                {pendingPayouts.length === 1
                  ? 'You have 1 payout request waiting for approval.'
                  : `You have ${pendingPayouts.length} payout requests waiting for approval.`}
              </span>
              <button
                onClick={() => setActiveTab('payouts')}
                style={{ background: '#ff5a36', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                Review requests
              </button>
            </div>
          )}

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
                      <button
                        onClick={() => handleRejectPayout(p._id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ffe6e6', color: '#cc0000', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'history' && renderPayoutHistory()}

              {activeTab === 'emails' && <AdminEmailPanel />}

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
                ['Event Title', 'Organizer', 'Tickets Sold', 'Ticket Types (Sold)', 'Gross Revenue', 'Platform Fee (7%)', 'Amount Collected', 'Requested / Paid Out', 'Amount Left', 'Action'],
                eventsList,
                (e) => {
                  const totalSold = e.tickets && e.tickets.length > 0
                    ? e.tickets.reduce((sum, tier) => sum + (tier.sold || 0), 0)
                    : (e.eventTicketsSold || 0);

                  // Amount Left = Gross Revenue - (paid out + requested). Amount Collected is shown separately.
                  const { gross: grossEarned, platformFee, collected, paidOut, requested, amountLeft, limitedByCollected } = getEventPayoutSummary(e);

                  return (
                    <tr key={e._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '20px 25px', fontWeight: '600' }}>{e.title}</td>
                      <td style={{ padding: '20px 25px' }}>{e.organizer?.name || 'Unknown'}</td>
                      <td style={{ padding: '20px 25px', fontWeight: 'bold' }}>{totalSold}</td>
                      <td style={{ padding: '20px 25px', minWidth: '220px' }}>
                        {e.tickets && e.tickets.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {e.tickets.map((tier) => (
                              <div
                                key={tier._id || tier.name}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#f8f9fa', border: '1px solid #eee', borderRadius: '8px', padding: '6px 12px' }}
                              >
                                <span style={{ fontWeight: '600', color: '#111' }}>{tier.name}</span>
                                <span style={{ whiteSpace: 'nowrap' }}>
                                  <strong style={{ color: '#ff5a36' }}>{tier.sold || 0}</strong>
                                  {tier.quantity !== undefined && (
                                    <span style={{ color: '#999', fontSize: '12px' }}> / {tier.quantity}</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>No ticket types</span>
                        )}
                      </td>
                      <td style={{ padding: '20px 25px', fontWeight: 'bold' }}>₦{grossEarned.toLocaleString()}</td>
                      <td style={{ padding: '20px 25px', fontWeight: 'bold', color: '#e65100' }}>₦{platformFee.toLocaleString()}</td>
                      <td style={{ padding: '20px 25px', whiteSpace: 'nowrap' }}>
                        <strong>₦{collected.toLocaleString()}</strong>
                        {collected > grossEarned && (
                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#b36b00' }}>
                            ₦{(collected - grossEarned).toLocaleString()} not matched to a ticket
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '20px 25px', whiteSpace: 'nowrap' }}>
                        <strong>₦{(paidOut + requested).toLocaleString()}</strong>
                        {(paidOut > 0 || requested > 0) && (
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            {paidOut > 0 && <span style={{ color: '#00b060' }}>₦{paidOut.toLocaleString()} paid</span>}
                            {paidOut > 0 && requested > 0 && <span style={{ color: '#999' }}> · </span>}
                            {requested > 0 && <span style={{ color: '#b36b00' }}>₦{requested.toLocaleString()} pending</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '20px 25px', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: amountLeft > 0 ? '#00b060' : '#999' }}>₦{amountLeft.toLocaleString()}</strong>
                        {limitedByCollected && (
                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#b36b00' }}>
                            Limited to Amount Collected
                          </div>
                        )}
                      </td>
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
