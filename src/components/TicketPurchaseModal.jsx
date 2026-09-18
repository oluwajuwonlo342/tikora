import React, { useState } from 'react';
import { X, Loader, Ticket, CreditCard, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { initializePurchase } from '../services/ticketService';

const TicketPurchaseModal = ({ event, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  const [primaryAttendee, setPrimaryAttendee] = useState({
    firstName: '', lastName: '', email: '', confirmEmail: '', phone: ''
  });

  const [additionalAttendees, setAdditionalAttendees] = useState([]);
  const [sameEmailForAll, setSameEmailForAll] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ticketTier = event?.tickets?.find((t) => t.name === selectedTicket);
  const subtotal = ticketTier ? ticketTier.price * quantity : 0;
  const platformFee = subtotal * 0.07;
  const totalAmount = subtotal + platformFee;

  const handleQuantityChange = (newQty) => {
    setQuantity(newQty);
    const diff = newQty - 1;
    if (diff > 0) {
      const list = Array.from({ length: diff }, () => ({
        firstName: '', lastName: '', email: '', phone: ''
      }));
      setAdditionalAttendees(list);
    } else {
      setAdditionalAttendees([]);
    }
  };

  const handleProceedToDetails = (e) => {
    e.preventDefault();
    if (!selectedTicket) return setError('Please select a ticket type.');
    setError('');
    setStep(2);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (primaryAttendee.email !== primaryAttendee.confirmEmail) {
      return setError('Primary emails do not match.');
    }

    setLoading(true);
    setError('');

    try {
      const attendeesList = [
        { 
          firstName: primaryAttendee.firstName, 
          lastName: primaryAttendee.lastName, 
          email: primaryAttendee.email, 
          phone: primaryAttendee.phone 
        }
      ];

      if (quantity > 1) {
        if (sameEmailForAll) {
          for (let i = 1; i < quantity; i++) {
            attendeesList.push({
              firstName: primaryAttendee.firstName, 
              lastName: primaryAttendee.lastName, 
              email: primaryAttendee.email, 
              phone: primaryAttendee.phone
            });
          }
        } else {
          additionalAttendees.forEach((att) => {
            attendeesList.push({
              firstName: att.firstName,
              lastName: att.lastName,
              email: att.email,
              phone: att.phone
            });
          });
        }
      }

      const payload = {
        eventId: event._id,
        ticketType: selectedTicket,
        quantity,
        attendees: attendeesList,
        callback_url: `${window.location.origin}/payment/verify`
      };

      const data = await initializePurchase(payload);
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        @media (max-width: 480px) {
          .responsive-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <div className="modal-box" style={{ 
        maxWidth: '550px', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        maxHeight: '90vh', /* Strict modal height constraint */
        overflow: 'hidden' 
      }}>
        
        <button onClick={onClose} className="modal-close-btn" style={{ zIndex: 10 }}><X size={20} /></button>
        
        {/* HEADER: Fixed at top */}
        <div className="modal-head" style={{ flexShrink: 0 }}>
          <div className="modal-icon"><Ticket size={30} /></div>
          <h2>{step === 1 ? 'Select Tickets' : 'Attendee Information'}</h2>
          <p>{event.title} • Step {step} of 2</p>
        </div>

        {/* FORM: Wraps body and footer, takes up remaining space */}
        <form onSubmit={step === 1 ? handleProceedToDetails : handleCheckout} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          flexGrow: 1, 
          overflow: 'hidden',
          minHeight: 0 
        }}>
          
          {/* BODY: Scrollable inner content */}
          <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1, padding: '20px' }}>
            {error && <div className="modal-error">{error}</div>}

            {step === 1 ? (
              <>
                <div className="input-group">
                  <label>Select Ticket Tier</label>
                  <select value={selectedTicket} onChange={(e) => setSelectedTicket(e.target.value)} required>
                    <option value="" disabled>-- Choose a ticket type --</option>
                    {event.tickets.map(tier => {
                      const available = tier.quantity - tier.sold;
                      return (
                        <option key={tier.name} value={tier.name} disabled={available <= 0}>
                          {tier.name} - ₦{tier.price.toLocaleString()} {available > 0 ? `(${available} left)` : '(Sold Out)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {ticketTier && (
                  <div className="input-group">
                    {/* Updated label to 100 */}
                    <label>Quantity (Max 100)</label>
                    <input 
                      type="number" 
                      min="1" 
                      // Updated Math.min from 10 to 100
                      max={Math.min(100, ticketTier.quantity - ticketTier.sold)} 
                      value={quantity} 
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      required
                    />
                  </div>
                )}

                {ticketTier && (
                  <div className="receipt-card">
                    <div className="receipt-row"><span>{ticketTier.name} ({quantity}x)</span><span>₦{subtotal.toLocaleString()}</span></div>
                    <div className="receipt-row" style={{color: '#999'}}><span>EVENTA Fee (7%)</span><span>₦{platformFee.toLocaleString()}</span></div>
                    <div className="receipt-divider"></div>
                    <div className="receipt-total"><span>Total Pay</span><span>₦{totalAmount.toLocaleString()}</span></div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ background: '#f8f8f6', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px', color: '#111', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="var(--primary)" /> Primary Ticket Holder (Ticket 1)
                  </h4>
                  <div className="responsive-grid">
                    <input type="text" placeholder="First Name" value={primaryAttendee.firstName} onChange={(e)=>setPrimaryAttendee({...primaryAttendee, firstName: e.target.value})} required style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}} />
                    <input type="text" placeholder="Last Name" value={primaryAttendee.lastName} onChange={(e)=>setPrimaryAttendee({...primaryAttendee, lastName: e.target.value})} required style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="email" placeholder="Email Address" value={primaryAttendee.email} onChange={(e)=>setPrimaryAttendee({...primaryAttendee, email: e.target.value})} required style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}} />
                    <input type="email" placeholder="Confirm Email Address" value={primaryAttendee.confirmEmail} onChange={(e)=>setPrimaryAttendee({...primaryAttendee, confirmEmail: e.target.value})} required style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}} />
                    <input type="tel" placeholder="Phone Number" value={primaryAttendee.phone} onChange={(e)=>setPrimaryAttendee({...primaryAttendee, phone: e.target.value})} required style={{width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:'8px'}} />
                  </div>
                </div>

                {quantity > 1 && (
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '15px' }}>
                      <input type="checkbox" checked={sameEmailForAll} onChange={(e)=>setSameEmailForAll(e.target.checked)} />
                      Send all tickets to my email address above
                    </label>

                    {!sameEmailForAll && additionalAttendees.map((att, idx) => (
                      <div key={idx} style={{ background: '#fafafa', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #eee' }}>
                        <h4 style={{ fontSize: '13px', marginBottom: '10px', color: '#555' }}>Attendee #{idx + 2} Details</h4>
                        <div className="responsive-grid">
                          <input type="text" placeholder="First Name" value={att.firstName} onChange={(e)=>{
                            const list = [...additionalAttendees];
                            list[idx].firstName = e.target.value;
                            setAdditionalAttendees(list);
                          }} required style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
                          <input type="text" placeholder="Last Name" value={att.lastName} onChange={(e)=>{
                            const list = [...additionalAttendees];
                            list[idx].lastName = e.target.value;
                            setAdditionalAttendees(list);
                          }} required style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input type="email" placeholder="Email Address" value={att.email} onChange={(e)=>{
                            const list = [...additionalAttendees];
                            list[idx].email = e.target.value;
                            setAdditionalAttendees(list);
                          }} required style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
                          <input type="tel" placeholder="Phone Number" value={att.phone} onChange={(e)=>{
                            const list = [...additionalAttendees];
                            list[idx].phone = e.target.value;
                            setAdditionalAttendees(list);
                          }} required style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER: Fixed at bottom */}
          <div className="modal-foot" style={{ display: 'flex', gap: '10px', flexShrink: 0, padding: '20px', background: 'white', borderTop: '1px solid #eee' }}>
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: '1' }}>
                <ArrowLeft size={18} /> Back
              </button>
            )}
            <button type="submit" disabled={loading || (step === 1 && !selectedTicket)} className="btn btn-primary" style={{ flex: '2', opacity: loading ? 0.6 : 1 }}>
              {loading ? <Loader className="animate-spin" size={20} /> : step === 1 ? <>Continue <ArrowRight size={18} /></> : <><CreditCard size={18} /> Pay ₦{totalAmount.toLocaleString()}</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default TicketPurchaseModal;