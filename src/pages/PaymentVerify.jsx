import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';

// ✅ DEFINED OUTSIDE THE COMPONENT: Survives React Strict Mode, but resets on page refresh!
let hasAttemptedVerify = false;

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your payment and generating tickets...');

  useEffect(() => {
    const verifyTransaction = async () => {
      if (!reference) {
        setStatus('error');
        setMessage('No transaction reference found.');
        return;
      }

      // ✅ BLOCK DUPLICATES: Only allow this to run exactly once per page load
      if (hasAttemptedVerify) return;
      hasAttemptedVerify = true;

      try {
        const response = await api.post('/tickets/purchase/verify', { reference });
        
        if (response.data.success || response.status === 201 || response.status === 200) {
          setStatus('success');
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Server error while verifying payment.');
      }
    };

    verifyTransaction();
  }, [reference]);

  return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px' }}>
      <div style={{ background: 'white', border: '1px solid #eaeaea', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}>
        
        {status === 'verifying' && (
          <>
            <Loader className="animate-spin" size={50} style={{ margin: '0 auto 20px', color: 'var(--primary)' }} />
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', marginBottom: '10px' }}>Processing Payment</h2>
            <p style={{ color: '#666' }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ background: '#e6f9f0', color: '#00b060', width: '70px', height: '70px', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={40} />
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', marginBottom: '10px', color: '#111' }}>Payment Successful!</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>Your ticket has been sent to your mail.</p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/" className="btn btn-primary">
                Back to Homepage
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ background: '#ffe6e6', color: '#cc0000', width: '70px', height: '70px', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <XCircle size={40} />
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', marginBottom: '10px', color: '#cc0000' }}>Verification Failed</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>{message}</p>
            <Link to="/events" className="btn btn-primary">
              Back to Events
            </Link>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentVerify;