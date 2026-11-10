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
  //   gross       = Gross Revenue: what the organizer earned from ticket sales
  //                 (the 7% platform fee paid by buyers on top is NOT included)
  //   paidOut     = payouts already approved
  //   requested   = payouts waiting for approval
  //   amountLeft  = gross - (paid out + requested)
  const NOT_PAID_STATUSES = ['rejected', 'failed', 'declined', 'cancelled'];

  const getEventPayoutSummary = (event) => {
    const platformFee = event.platformFee || 0;

    let gross;
    let paidOut;
    let requested;

    // Preferred: the server's figures. Gross is what buyers actually paid for the
    // organizer's tickets (price saved at purchase), so editing a ticket price
    // later cannot change it. It is the same Gross Revenue the organizer sees.
    const serverBalance = eventBalances[event._id];

    if (serverBalance) {
      gross = serverBalance.totalEarned;
      paidOut = serverBalance.paid;
      requested = serverBalance.pending;
    } else {
      // Fallback if the balances request is unavailable (less exact)
      const matchesEvent = (p) => (p.event?._id || p.event) === event._id;

      gross = Math.max((event.grossEarned || 0) - platformFee, 0);

      paidOut = payoutHistory
        .filter((p) => matchesEvent(p) && !NOT_PAID_STATUSES.includes(p.status))
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      requested = pendingPayouts
        .filter(matchesEvent)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    // Always worked out from the numbers shown, so the table adds up on screen
    const amountLeft = Math.max(gross - paidOut - requested, 0);

    return { gross, platformFee, paidOut, requested, amountLeft };
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