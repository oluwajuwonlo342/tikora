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