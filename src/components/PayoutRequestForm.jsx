import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

// Popular Nigerian Banks (Paystack Codes)
const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '050', name: 'Ecobank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '058', name: 'Guaranty Trust Bank (GTB)' },
  { code: '082', name: 'Keystone Bank' },
  { code: '090328', name: 'Moniepoint' },
  { code: '090267', name: 'Kuda Bank' },
  { code: '999992', name: 'OPay' },
  { code: '100039', name: 'PalmPay' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' }
];

const PayoutRequestForm = ({ eventId, availableBalance = 0, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-verify account when 10 digits are entered and bank is selected
  useEffect(() => {
    const verifyAccount = async () => {
      if (accountNumber.length === 10 && bankCode) {
        setIsVerifying(true);
        setError('');
        setAccountName('');
        
        try {
          const response = await api.post('/payouts/verify-bank', {
            accountNumber,
            bankCode
          });
          
          if (response.data.success) {
            setAccountName(response.data.accountName);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Could not verify account details.');
        } finally {
          setIsVerifying(false);
        }
      } else {
        setAccountName(''); // Reset if number changes
      }
    };

    // Debounce the verification slightly
    const timeoutId = setTimeout(() => {
      verifyAccount();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [accountNumber, bankCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(amount) > availableBalance) {
      setError(`You cannot request more than your available balance of ₦${availableBalance}`);
      return;
    }

    if (!accountName) {
      setError('Please wait for your bank account to be verified before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedBank = NIGERIAN_BANKS.find(b => b.code === bankCode);
      
      const response = await api.post('/payouts/request', {
        eventId,
        amountRequested: Number(amount),
        bankDetails: {
          bankName: selectedBank.name,
          bankCode: selectedBank.code,
          accountNumber,
          accountName
        }
      });

      if (response.data.success) {
        setSuccess('Payout request submitted successfully!');
        setAmount('');
        setAccountNumber('');
        setBankCode('');
        setAccountName('');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payout request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #eaeaea' }}>
      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', marginBottom: '20px' }}>
        Request Payout
      </h3>

      {/* Available Balance Display */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#666' }}>Available to Withdraw:</span>
        <strong style={{ fontSize: '18px', color: 'var(--primary, #ff5a36)' }}>
          ₦{availableBalance.toLocaleString()}
        </strong>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Amount Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Amount to Withdraw (₦)</label>
          <input 
            type="number" 
            min="100"
            max={availableBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd' }}
            placeholder="e.g. 50000"
          />
        </div>

        {/* Bank Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Select Bank</label>
          <select 
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }}
          >
            <option value="">-- Choose your bank --</option>
            {NIGERIAN_BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>{bank.name}</option>
            ))}
          </select>
        </div>

        {/* Account Number Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Account Number</label>
          <input 
            type="text" 
            maxLength="10"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} // Only allow numbers
            required
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd' }}
            placeholder="10-digit account number"
          />
        </div>

        {/* Account Name Verification Display */}
        {isVerifying && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
            <Loader className="animate-spin" size={16} /> Verifying account details...
          </div>
        )}

        {accountName && !isVerifying && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00b060', fontSize: '14px', background: '#e6f9f0', padding: '10px', borderRadius: '6px' }}>
            <CheckCircle size={16} /> Verified Name: <strong>{accountName}</strong>
          </div>
        )}

        {/* Error / Success Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cc0000', fontSize: '14px', background: '#ffe6e6', padding: '10px', borderRadius: '6px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00b060', fontSize: '14px', background: '#e6f9f0', padding: '10px', borderRadius: '6px' }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={!accountName || isSubmitting || Number(amount) <= 0}
          className="btn btn-primary"
          style={{ 
            marginTop: '10px', 
            padding: '12px', 
            opacity: (!accountName || isSubmitting || Number(amount) <= 0) ? 0.6 : 1,
            cursor: (!accountName || isSubmitting || Number(amount) <= 0) ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isSubmitting ? <Loader className="animate-spin" size={18} /> : null}
          {isSubmitting ? 'Submitting Request...' : 'Submit Payout Request'}
        </button>
      </form>
    </div>
  );
};

export default PayoutRequestForm;