import React, { useState, useEffect, useMemo } from 'react';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const formatNaira = (value) => `₦${(Number(value) || 0).toLocaleString()}`;

const PayoutRequestForm = ({ eventId, availableBalance = 0, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // The real balance, asked from the server. It uses the exact same
  // calculation the server checks when the request is submitted, so the
  // number shown here can never disagree with the "insufficient balance" check.
  // The availableBalance prop is only used while this is loading.
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Bank list — fetched live from Paystack via our backend
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const available = balance ? balance.available : Number(availableBalance) || 0;

  // Fetch the live balance for this event
  useEffect(() => {
    let cancelled = false;

    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const response = await api.get(`/payouts/balance/${eventId}`);
        if (!cancelled && response.data.success) {
          setBalance(response.data.balance);
        }
      } catch (err) {
        console.error('Could not load payout balance:', err.response?.data || err.message);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    };

    fetchBalance();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Fetch the bank list once on mount
  useEffect(() => {
    const fetchBanks = async () => {
      setBanksLoading(true);
      setBanksError('');
      try {
        const response = await api.get('/payouts/banks');
        if (response.data.success) {
          setBanks(response.data.banks);
        } else {
          setBanksError('Could not load the list of banks.');
        }
      } catch (err) {
        setBanksError(err.response?.data?.message || 'Could not load the list of banks.');
      } finally {
        setBanksLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const q = bankSearch.trim().toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, bankSearch]);

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

    if (Number(amount) > available) {
      setError(`You cannot request more than your available balance of ${formatNaira(available)}`);
      return;
    }

    if (!accountName) {
      setError('Please wait for your bank account to be verified before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedBank = banks.find((b) => b.code === bankCode);

      const response = await api.post('/payouts/request', {
        eventId,
        amountRequested: Number(amount),
        bankDetails: {
          bankName: selectedBank?.name,
          bankCode: selectedBank?.code,
          accountNumber,
          accountName
        }
      });

      if (response.data.success) {
        setSuccess('Payout request submitted successfully!');
        setAmount('');
        setAccountNumber('');
        setBankCode('');
        setBankSearch('');
        setAccountName('');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payout request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDisabled = !accountName || isSubmitting || Number(amount) <= 0;

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #eaeaea' }}>
      <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', marginBottom: '20px' }}>
        Request Payout
      </h3>

      {/* Available Balance Display */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: balance ? '10px' : '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#666' }}>Available to Withdraw:</span>
        <strong style={{ fontSize: '18px', color: 'var(--primary, #ff5a36)' }}>
          {balanceLoading ? 'Checking...' : formatNaira(available)}
        </strong>
      </div>

      {/* Where the number comes from */}
      {balance && (
        <p style={{ color: '#888', fontSize: '12px', margin: '0 0 25px', lineHeight: 1.6 }}>
          Earned {formatNaira(balance.totalEarned)} · Paid out {formatNaira(balance.paid)} · Pending {formatNaira(balance.pending)}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

        {/* Amount Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Amount to Withdraw (₦)</label>
          <input
            type="number"
            min="100"
            max={available}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd' }}
            placeholder="e.g. 50000"
          />
        </div>

        {/* Bank Search + Dropdown */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Select Bank</label>

          {banksError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cc0000', fontSize: '13px', marginBottom: '8px' }}>
              <AlertCircle size={14} /> {banksError}
            </div>
          )}

          <input
            type="text"
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            placeholder={banksLoading ? 'Loading banks…' : 'Search for your bank...'}
            disabled={banksLoading}
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '8px' }}
          />

          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            required
            disabled={banksLoading}
            size={bankSearch ? Math.min(filteredBanks.length, 6) || 1 : 1}
            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }}
          >
            <option value="">
              {banksLoading ? 'Loading banks…' : '-- Choose your bank --'}
            </option>
            {filteredBanks.map((bank) => (
              <option key={bank.code} value={bank.code}>{bank.name}</option>
            ))}
          </select>

          {!banksLoading && filteredBanks.length === 0 && (
            <p style={{ color: '#888', fontSize: '13px', marginTop: '6px' }}>No bank matches "{bankSearch}".</p>
          )}
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
          disabled={submitDisabled}
          className="btn btn-primary"
          style={{
            marginTop: '10px',
            padding: '12px',
            opacity: submitDisabled ? 0.6 : 1,
            cursor: submitDisabled ? 'not-allowed' : 'pointer',
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