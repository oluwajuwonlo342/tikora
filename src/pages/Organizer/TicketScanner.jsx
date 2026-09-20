import React, { useState, useEffect } from 'react';
import { Search, Scan, CheckCircle, XCircle, AlertTriangle, Loader, Camera, Keyboard, UserPlus, X, ArrowLeft } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TicketScanner = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('camera'); 
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Authenticator Modal State
  const [showModal, setShowModal] = useState(false);
  const [authData, setAuthData] = useState({ name: '', email: '', eventId: '' });
  const [myEvents, setMyEvents] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Load user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch events for the dropdown when modal opens
  useEffect(() => {
    if (showModal && myEvents.length === 0) {
      api.get('/events/my-events').then(res => setMyEvents(res.data.events)).catch(err => console.log(err));
    }
  }, [showModal]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await api.post(`/events/${authData.eventId}/authenticator`, {
        name: authData.name,
        email: authData.email
      });
      alert(`Invitation sent to ${authData.email}!`);
      setShowModal(false);
      setAuthData({ name: '', email: '', eventId: '' });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send invite.");
    } finally {
      setInviteLoading(false);
    }
  };

  const verifyCode = async (code) => {
    if (!code) return;
    setLoading(true);
    setScanResult(null);
    try {
      const response = await api.post('/tickets/scan', { ticketCode: code });
      setScanResult(response.data);
      if (mode === 'manual') setTicketCode(''); 
    } catch (error) {
      setScanResult(error.response?.data || { success: false, statusType: 'INVALID', message: 'Network error or invalid code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verifyCode(ticketCode);
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0 && !loading) {
      verifyCode(detectedCodes[0].rawValue);
    }
  };

  const isOrganizer = user?.role === "organizer" || user?.role === "admin";

  return (
    <div className="container" style={{ padding: '30px 20px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Responsive Inline Styles for Mobile Layout Adjustments */}
      <style>{`
        .scanner-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .scanner-input-group {
          display: flex;
          gap: 10px;
          max-width: 500px;
          margin: 0 auto 20px;
          width: 100%;
        }
        .scanner-input-group input {
          flex: 1;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-size: 15px;
        }
        .scan-result-card {
          margin-top: 25px;
          padding: 25px;
          border-radius: 16px;
          text-align: center;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #eee;
        }
        .scan-result-card.valid { border-color: #00b060; background: #f0fdf4; }
        .scan-result-card.invalid { border-color: #cc0000; background: #fef2f2; }
        .scan-result-card.already_used, .scan-result-card.cancelled { border-color: #f5a623; background: #fffbeb; }
        
        @media (max-width: 480px) {
          .scanner-input-group {
            flex-direction: column;
          }
          .scanner-input-group button {
            width: 100%;
          }
        }
      `}</style>

      {/* Back to Dashboard Link */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/dashboard" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#555', fontWeight: '500' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>

      <div className="scanner-header-row">
        <div>
          <h1 style={{ fontSize: '28px', fontFamily: 'Space Grotesk, sans-serif', marginBottom: '5px' }}>Organizer Ticket Scanner</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Scan or manually type ticket codes to verify entry permissions.</p>
        </div>

        {/* ONLY SHOWS FOR ORGANIZERS / ADMINS */}
        {isOrganizer && (
          <button 
            onClick={() => setShowModal(true)} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <UserPlus size={16} /> Add Authenticator
          </button>
        )}
      </div>

      {/* SCANNER ICON */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '25px 0 15px' }}>
        <div style={{ background: '#fff0eb', color: 'var(--primary)', padding: '15px', borderRadius: '20px' }}>
          <Scan size={36} />
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => setMode('camera')} className={`btn ${mode === 'camera' ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={18} /> Camera
        </button>
        <button onClick={() => setMode('manual')} className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Keyboard size={18} /> Manual
        </button>
      </div>

      {/* Camera Mode */}
      {mode === 'camera' && (
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto 20px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #eee', background: '#000' }}>
          <Scanner onScan={handleScan} allowMultiple={true} scanDelay={2000} />
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="scanner-input-group">
          <input type="text" placeholder="Enter code (e.g. EVT-ABCD)" value={ticketCode} onChange={(e) => setTicketCode(e.target.value)} autoFocus />
          <button type="submit" className="btn btn-primary" disabled={loading || !ticketCode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {loading ? <Loader className="animate-spin" size={20} /> : <><Search size={18} /> Verify</>}
          </button>
        </form>
      )}

      {/* RESULT DISPLAY */}
      {scanResult && (
        <div className={`scan-result-card ${scanResult.statusType?.toLowerCase()}`}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            {scanResult.statusType === 'VALID' && <CheckCircle size={45} color="#00b060" />}
            {scanResult.statusType === 'INVALID' && <XCircle size={45} color="#cc0000" />}
            {(scanResult.statusType === 'ALREADY_USED' || scanResult.statusType === 'CANCELLED') && <AlertTriangle size={45} color="#f5a623" />}
          </div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
            {scanResult.statusType === 'VALID' ? 'TICKET VALID' : scanResult.statusType === 'ALREADY_USED' ? 'ALREADY USED' : 'INVALID TICKET'}
          </h2>
          <p style={{ color: '#555', fontSize: '15px' }}>{scanResult.message}</p>
        </div>
      )}

      {/* ADD AUTHENTICATOR MODAL */}
      {showModal && isOrganizer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <X size={20} color="#777" />
            </button>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: '5px', fontSize: '22px' }}>Add Authenticator</h2>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>Invite a helper to scan tickets at the gate.</p>
            
            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Select Event</label>
                <select 
                  required 
                  value={authData.eventId} 
                  onChange={(e) => setAuthData({...authData, eventId: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', background: '#fff' }}
                >
                  <option value="">-- Choose Event --</option>
                  {myEvents.map(evt => <option key={evt._id} value={evt._id}>{evt.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Helper Name</label>
                <input required type="text" placeholder="Full Name" value={authData.name} onChange={(e) => setAuthData({...authData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Email Address</label>
                <input required type="email" placeholder="helper@email.com" value={authData.email} onChange={(e) => setAuthData({...authData, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }} />
              </div>
              <button type="submit" disabled={inviteLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '12px' }}>
                {inviteLoading ? 'Sending...' : 'Send Access Link'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketScanner;
