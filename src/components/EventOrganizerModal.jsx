import React, { useState, useEffect } from 'react';
import { X, Download, Mail, QrCode, Users, Send, Loader, CheckCircle } from 'lucide-react';
import api from '../services/api';

const EventOrganizerModal = ({ event, onClose }) => {
  const [activeTab, setActiveTab] = useState('attendees'); // 'attendees' | 'email' | 'qrcode'
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Email Form State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  const eventId = event._id || event.id;
  const eventUrl = `${window.location.origin}/events/${eventId}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventUrl)}`;

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/attendees`);
      if (res.data.success) {
        setAttendees(res.data.attendees || []);
      }
    } catch (err) {
      console.error('Failed to load attendees', err);
    } finally {
      setLoading(false);
    }
  };

  // 📥 Export Attendee List to CSV (Spreadsheet)
  const exportToCSV = () => {
    if (attendees.length === 0) {
      alert('No attendees to export.');
      return;
    }

    const headers = ['Attendee Name', 'Email', 'Ticket Tier', 'Price (NGN)', 'Check-in Status', 'Purchase Date'];
    const rows = attendees.map(a => [
      `"${a.userName}"`,
      `"${a.userEmail}"`,
      `"${a.ticketTier}"`,
      a.price,
      `"${a.isScanned ? 'Checked In' : 'Valid'}"`,
      `"${new Date(a.purchasedAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 📧 Send Bulk Email to Attendees
  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Please fill out both the subject and message fields.');
      return;
    }

    setSendingEmail(true);
    setEmailStatus('');

    try {
      const res = await api.post(`/events/${eventId}/send-email`, {
        subject: emailSubject,
        message: emailMessage
      });

      if (res.data.success) {
        setEmailStatus('Broadcast email sent successfully!');
        setEmailSubject('');
        setEmailMessage('');
      }
    } catch (err) {
      console.error(err);
      setEmailStatus(err.response?.data?.message || 'Failed to send broadcast email.');
    } finally {
      setSendingEmail(false);
    }
  };

  // 🖼️ Download Event Link QR Code
  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.title.replace(/\s+/g, '_')}_QRCode.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to download QR code', err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '800px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#111' }}>{event.title}</h3>
            <span style={{ fontSize: '13px', color: '#666' }}>Organizer Management Panel</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X size={22} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', background: '#fff' }}>
          {[
            { id: 'attendees', icon: Users, label: `Attendees (${attendees.length})` },
            { id: 'email', icon: Mail, label: 'Send Bulk Email' },
            { id: 'qrcode', icon: QrCode, label: 'Event QR Code' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '14px', border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontWeight: '600', fontSize: '14px',
                color: activeTab === tab.id ? '#ff5a36' : '#666',
                borderBottom: activeTab === tab.id ? '3px solid #ff5a36' : '3px solid transparent'
              }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
          
          {/* TAB 1: ATTENDEE LIST & CSV EXPORT */}
          {activeTab === 'attendees' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Registered Attendees</h4>
                <button
                  onClick={exportToCSV}
                  disabled={attendees.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#00b060', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: attendees.length > 0 ? 'pointer' : 'not-allowed', opacity: attendees.length > 0 ? 1 : 0.5, fontWeight: 'bold', fontSize: '13px' }}
                >
                  <Download size={16} /> Export CSV Spreadsheet
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}><Loader size={30} className="animate-spin" color="#ff5a36" /></div>
              ) : attendees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#f9f9f9', borderRadius: '12px' }}>
                  No tickets sold for this event yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '12px' }}>Name</th>
                        <th style={{ padding: '12px' }}>Email</th>
                        <th style={{ padding: '12px' }}>Tier</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((a) => (
                        <tr key={a.ticketId} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{a.userName}</td>
                          <td style={{ padding: '12px', color: '#555' }}>{a.userEmail}</td>
                          <td style={{ padding: '12px' }}><span style={{ background: '#fff0eb', color: '#ff5a36', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{a.ticketTier}</span></td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ color: a.isScanned ? '#00b060' : '#888', fontWeight: 'bold', fontSize: '12px' }}>
                              {a.isScanned ? '✓ Checked In' : 'Valid'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#888', fontSize: '13px' }}>{new Date(a.purchasedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BULK EMAIL TO ATTENDEES */}
          {activeTab === 'email' && (
            <form onSubmit={handleSendBulkEmail} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Email Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Important Update regarding Event Venue"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>Message</label>
                <textarea
                  rows={6}
                  placeholder="Type your broadcast message to all ticket holders..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical' }}
                  required
                />
              </div>

              {emailStatus && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: emailStatus.includes('successfully') ? '#e6f7ee' : '#ffe6e6', color: emailStatus.includes('successfully') ? '#00b060' : '#cc0000', fontSize: '14px', fontWeight: 'bold' }}>
                  {emailStatus}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingEmail || attendees.length === 0}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', background: '#ff5a36', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: (sendingEmail || attendees.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: attendees.length === 0 ? 0.6 : 1 }}
              >
                {sendingEmail ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                {sendingEmail ? 'Sending Broadcast...' : `Send to ${attendees.length} Attendees`}
              </button>
            </form>
          )}

          {/* TAB 3: EVENT LINK QR CODE */}
          {activeTab === 'qrcode' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px' }}>
                Scan or download this QR code to quickly share your event link on printed posters, banners, or social media.
              </p>

              <div style={{ background: '#fff', padding: '20px', display: 'inline-block', borderRadius: '16px', border: '2px dashed #eee', marginBottom: '20px' }}>
                <img src={qrCodeImageUrl} alt="Event QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  onClick={downloadQRCode}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  <Download size={18} /> Download QR Code (PNG)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EventOrganizerModal;
