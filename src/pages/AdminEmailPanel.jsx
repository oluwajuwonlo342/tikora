import React, { useEffect, useState } from 'react';
import { Send, Users, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AUDIENCES = [
  { id: 'all', label: 'All users', desc: 'Everyone with an active account' },
  { id: 'organizers', label: 'Organizers', desc: 'Users who create events' },
  { id: 'attendees', label: 'Ticket buyers', desc: 'Regular users (attendees)' },
  { id: 'new_users', label: 'New users', desc: 'People who joined recently' },
  { id: 'custom', label: 'Specific emails', desc: 'Type in the addresses yourself' },
];

const getTemplates = () => {
  const month = new Date().toLocaleString('en-US', { month: 'long' });

  return [
    {
      id: 'welcome',
      label: 'Welcome email',
      audience: 'new_users',
      subject: 'Welcome to Tickora, {{name}}!',
      message:
        "Hi {{name}},\n\nWelcome to Tickora! We're so glad to have you.\n\nYou can now discover events, buy tickets in seconds, and keep all your tickets in one place. If you're an organizer, you can create your first event and start selling right away.\n\nIf you ever need help, contact our support team and we'll sort you out.\n\nEnjoy the experience,\nThe Tickora Team",
    },
    {
      id: 'new-month',
      label: 'Happy New Month',
      audience: 'all',
      subject: 'Happy New Month, {{name}}! 🎉',
      message: `Hi {{name}},\n\nHappy new month! Wishing you a ${month} filled with great events, good vibes and unforgettable moments.\n\nCheck out what's happening and grab your tickets before they sell out. To our organizers, may this month bring full venues and record sales.\n\nWith love,\nThe Tickora Team`,
    },
    {
      id: 'blank',
      label: 'Blank email',
      audience: null,
      subject: '',
      message: '',
    },
  ];
};

const cardStyle = {
  background: 'white',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  padding: '28px',
  marginBottom: '24px',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#555',
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #ddd',
  borderRadius: '10px',
  fontSize: '15px',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const AdminEmailPanel = () => {
  const [audience, setAudience] = useState('all');
  const [days, setDays] = useState(7);
  const [customEmails, setCustomEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const templates = getTemplates();

  // Re-count recipients whenever the audience settings change
  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/admin/email/preview', { audience, days, customEmails });
        if (!cancelled) setPreview(res.data.success ? res.data : null);
      } catch (error) {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [audience, days, customEmails]);

  const applyTemplate = (template) => {
    setSubject(template.subject);
    setMessage(template.message);
    if (template.audience) setAudience(template.audience);
    setResult(null);
  };

  const handleSend = async () => {
    setResult(null);

    if (!subject.trim() || !message.trim()) {
      setResult({ type: 'error', text: 'Please write a subject and a message first.' });
      return;
    }

    if (!preview || preview.count === 0) {
      setResult({ type: 'error', text: 'No recipients match this selection.' });
      return;
    }

    if (preview.overLimit) {
      setResult({
        type: 'error',
        text: `That is ${preview.count} people. The limit per send is ${preview.limit}. Narrow the audience.`,
      });
      return;
    }

    const confirmed = window.confirm(
      `Send "${subject.trim()}" to ${preview.count} recipient(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setSending(true);
      const res = await api.post('/admin/email/send', {
        audience,
        days,
        customEmails,
        subject,
        message,
      });

      setResult({
        type: res.data.failed > 0 ? 'warning' : 'success',
        text: res.data.message,
        failedEmails: res.data.failedEmails,
      });
    } catch (error) {
      setResult({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send emails.',
      });
    } finally {
      setSending(false);
    }
  };

  const resultColors = {
    success: { bg: '#e6f7ee', color: '#00804a' },
    warning: { bg: '#fff4e0', color: '#b36b00' },
    error: { bg: '#ffe6e6', color: '#cc0000' },
  };

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* TEMPLATES */}
      <div style={cardStyle}>
        <span style={labelStyle}>Start from a template</span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #ddd',
                background: '#f8f9fa',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                color: '#111',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* AUDIENCE */}
      <div style={cardStyle}>
        <span style={labelStyle}>Who should receive it?</span>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {AUDIENCES.map((a) => {
            const active = audience === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAudience(a.id)}
                style={{
                  textAlign: 'left',
                  padding: '14px',
                  borderRadius: '12px',
                  border: active ? '2px solid #ff5a36' : '2px solid #eee',
                  background: active ? '#fff0eb' : 'white',
                  cursor: 'pointer',
                }}
              >
                <strong style={{ display: 'block', color: '#111', fontSize: '15px' }}>
                  {a.label}
                </strong>
                <span style={{ color: '#777', fontSize: '12px' }}>{a.desc}</span>
              </button>
            );
          })}
        </div>

        {audience === 'new_users' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Joined in the last (days)</label>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              style={{ ...inputStyle, maxWidth: '160px' }}
            />
          </div>
        )}

        {audience === 'custom' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email addresses (separate with commas, spaces or new lines)</label>
            <textarea
              rows={3}
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="john@example.com, mary@example.com"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8f9fa',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            color: '#333',
          }}
        >
          {previewLoading ? (
            <>
              <Loader size={18} className="animate-spin" /> Counting recipients...
            </>
          ) : preview ? (
            <>
              <Users size={18} color="#ff5a36" />
              <span>
                <strong>{preview.count}</strong> recipient{preview.count === 1 ? '' : 's'}
                {preview.sample?.length > 0 && (
                  <span style={{ color: '#888' }}>
                    {' '}
                    (e.g. {preview.sample.slice(0, 2).join(', ')}
                    {preview.count > 2 ? ', ...' : ''})
                  </span>
                )}
              </span>
              {preview.overLimit && (
                <span style={{ color: '#cc0000', fontWeight: 600 }}>
                  Over the {preview.limit} limit per send
                </span>
              )}
            </>
          ) : (
            <span style={{ color: '#888' }}>Could not count recipients.</span>
          )}
        </div>
      </div>

      {/* MESSAGE */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Subject</label>
          <input
            style={inputStyle}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Happy New Month, {{name}}!"
            maxLength={150}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={labelStyle}>Message</label>
          <textarea
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            maxLength={5000}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>
        <p style={{ margin: '0 0 20px', color: '#888', fontSize: '12px' }}>
          Use <code>{'{{name}}'}</code> anywhere in the subject or message and it is replaced with
          each person's first name. Leave a blank line between paragraphs.
        </p>

        {result && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '14px',
              background: resultColors[result.type].bg,
              color: resultColors[result.type].color,
            }}
          >
            {result.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <div>
              <div>{result.text}</div>
              {result.failedEmails?.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '12px' }}>
                  Failed: {result.failedEmails.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ff5a36',
            color: 'white',
            border: 'none',
            padding: '14px 26px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? (
            <>
              <Loader size={18} className="animate-spin" /> Sending...
            </>
          ) : (
            <>
              <Send size={18} /> Send email
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminEmailPanel;
