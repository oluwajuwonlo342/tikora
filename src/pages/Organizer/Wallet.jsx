import { Loader, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import PayoutRequestForm from '../../components/PayoutRequestForm';

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    platformFees: 0,
    netPayout: 0,
    ticketsSold: 0,
    eventsList: [],
    transactions: []
  });
  const [error, setError] = useState('');
  
  const [selectedEventForPayout, setSelectedEventForPayout] = useState(null);

  // Pagination State for Transactions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/organizer/stats');
      
      if (response.data.success) {
        const stats = response.data.stats;
        const events = response.data.events || [];
        const transactions = response.data.transactions || [];
        
        const gross = stats.totalGrossEarned || stats.totalRevenue || 0;
        const fees = gross * 0.07; 
        const net = stats.totalRevenue || (gross - fees);

        setRevenueData({
          totalRevenue: gross,
          platformFees: fees,
          netPayout: net,
          ticketsSold: stats.totalTicketsSold || 0,
          eventsCount: stats.totalEvents || 0,
          eventsList: events,
          transactions: transactions
        });
      }
    } catch (err) {
      setError('Failed to load wallet data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const totalPages = Math.ceil((revenueData.transactions?.length || 0) / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = revenueData.transactions?.slice(indexOfFirstItem, indexOfLastItem) || [];

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Loader className="animate-spin" size={45} style={{ margin: '0 auto 15px', color: 'var(--primary)' }} />
        <p style={{ color: '#777', fontWeight: '600' }}>Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="container wallet-page" style={{ padding: '30px 15px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Responsive Styles Injection */}
      <style>{`
        .wallet-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #111;
          color: white;
          padding: 40px;
          border-radius: 16px;
          margin-bottom: 30px;
        }
        .wallet-hero h1 {
          font-size: 48px;
          margin: 10px 0;
        }
        .wallet-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .wallet-card {
          padding: 25px;
          background: white;
          border-radius: 12px;
          border: 1px solid #eee;
        }
        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          background: white;
          border-radius: 12px;
          border: 1px solid #eee;
        }

        @media (max-width: 768px) {
          .wallet-hero {
            padding: 25px 20px;
            flex-direction: column;
            align-items: flex-start;
          }
          .wallet-hero h1 {
            font-size: 36px;
          }
          .wallet-card {
            padding: 20px;
          }
        }
      `}</style>

      {/* Hero Banner */}
      <div className="wallet-hero">
        <div className="wallet-hero-left">
          <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#ff5a36', fontWeight: '600' }}>Organizer Wallet & Earnings</span>
          <h1>₦{revenueData.netPayout.toLocaleString()}</h1>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Available Net Payout (Organizer Earnings After Withdrawals)</p>
        </div>
      </div>

      {error && <div style={{ color: '#d33', background: '#fff0f0', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>{error}</div>}

      {/* Metric Cards */}
      <div className="wallet-grid">
        <div className="wallet-card">
          <span style={{ color: '#666', fontSize: '14px' }}>Organizer Total Earnings</span>
          <h3 style={{ color: '#111', fontSize: '24px', marginTop: '10px' }}>₦{revenueData.totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="wallet-card">
          <span style={{ color: '#666', fontSize: '14px' }}>Platform Fees Paid by Buyers</span>
          <h3 style={{ color: '#e65100', fontSize: '24px', marginTop: '10px' }}>₦{revenueData.platformFees.toLocaleString()}</h3>
        </div>

        <div className="wallet-card">
          <span style={{ color: '#666', fontSize: '14px' }}>Total Tickets Sold</span>
          <h3 style={{ color: 'var(--primary)', fontSize: '24px', marginTop: '10px' }}>{revenueData.ticketsSold.toLocaleString()}</h3>
        </div>
      </div>

      {/* Dynamic Payout Form Injection */}
      {selectedEventForPayout && (
        <div style={{ marginBottom: '40px', padding: '20px', border: '2px dashed var(--primary)', borderRadius: '16px', position: 'relative', background: '#fff' }}>
          <button 
            onClick={() => setSelectedEventForPayout(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}
          >
            <X size={24} />
          </button>
          
          <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>Withdraw Funds for: {selectedEventForPayout.title}</h3>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>Please provide your bank details below to receive your earnings.</p>
          
          <PayoutRequestForm 
            eventId={selectedEventForPayout._id} 
            availableBalance={selectedEventForPayout.eventRevenue} 
            onSuccess={() => {
              setSelectedEventForPayout(null);
              fetchRevenueData();
            }}
          />
        </div>
      )}

      {/* Event Revenue Breakdown Table */}
      <div className="transactions-section" style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '22px', fontFamily: 'Space Grotesk, sans-serif' }}>Event Revenue Breakdown</h2>
        
        {revenueData.eventsList?.length === 0 ? (
          <p style={{ color: '#777', fontSize: '14px' }}>No revenue records found yet.</p>
        ) : (
          <div className="table-responsive-wrapper">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '15px', fontSize: '13px', color: '#555' }}>Event Title</th>
                  <th style={{ padding: '15px', fontSize: '13px', color: '#555' }}>Tickets Sold</th>
                  <th style={{ padding: '15px', fontSize: '13px', color: '#555' }}>Available Earnings</th>
                  <th style={{ padding: '15px', fontSize: '13px', color: '#555' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.eventsList?.map((evt) => {
                  const netEventRevenue = evt.eventRevenue;
                  
                  return (
                    <tr key={evt._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px', fontSize: '14px' }}><strong>{evt.title}</strong></td>
                      <td style={{ padding: '15px', fontSize: '14px' }}>{evt.eventTicketsSold} / {evt.eventCapacity}</td>
                      <td style={{ padding: '15px', fontSize: '14px' }}><strong>₦{netEventRevenue.toLocaleString()}</strong></td>
                      <td style={{ padding: '15px' }}>
                        <button 
                          onClick={() => setSelectedEventForPayout(evt)}
                          disabled={netEventRevenue <= 0}
                          style={{ 
                            background: netEventRevenue > 0 ? 'var(--primary)' : '#ccc', 
                            color: 'white', 
                            padding: '8px 16px', 
                            borderRadius: '6px', 
                            border: 'none', 
                            cursor: netEventRevenue > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          Withdraw
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRANSACTION HISTORY TABLE WITH PAGINATION */}
      <div style={{ marginTop: '40px', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #eee' }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', marginBottom: '20px' }}>Transaction History</h3>
        
        <div className="table-responsive-wrapper" style={{ border: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Description</th>
                <th style={{ padding: '15px' }}>Type</th>
                <th style={{ padding: '15px' }}>Amount</th>
                <th style={{ padding: '15px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', color: '#555', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '15px', fontWeight: '500', fontSize: '14px' }}>
                    {tx.description}
                  </td>
                  <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                      background: tx.type === 'credit' ? '#e6f9f0' : '#ffe6e6',
                      color: tx.type === 'credit' ? '#00b060' : '#cc0000'
                    }}>
                      {tx.type === 'credit' ? '+ Money In' : '- Money Out'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    ₦{tx.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '15px', whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      textTransform: 'capitalize', fontWeight: 'bold', fontSize: '13px',
                      color: tx.status === 'pending' ? '#f5a623' : tx.status === 'rejected' ? '#cc0000' : '#00b060' 
                    }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              
              {(!revenueData.transactions || revenueData.transactions.length === 0) && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                    No transactions found. Sell tickets or request a payout to see history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              onClick={handlePrev} 
              disabled={currentPage === 1}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '6px', 
                border: '1px solid #ddd', 
                background: 'white', 
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              ← Previous
            </button>
            
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button 
              onClick={handleNext} 
              disabled={currentPage === totalPages}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '6px', 
                border: '1px solid #ddd', 
                background: 'white', 
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default Wallet;
