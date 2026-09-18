import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { verifyPurchase } from '../services/ticketService';

const VerifyPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your payment and generating tickets...');
  
  // Use a ref to prevent double-firing in React StrictMode
  const hasVerified = useRef(false); 

  useEffect(() => {
    const reference = searchParams.get('reference');
    
    if (!reference) {
      setStatus('error');
      setMessage('Invalid payment reference missing.');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyTransaction = async () => {
      try {
        await verifyPurchase(reference);
        setStatus('success');
        setMessage('Payment successful! Your tickets are ready.');
        
        // Redirect to My Tickets after 3 seconds
        setTimeout(() => {
          navigate('/my-tickets');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Payment verification failed. Please contact support.');
      }
    };

    verifyTransaction();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-sm text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <Loader className="animate-spin text-blue-600 mb-4" size={48} />
            <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-gray-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="text-green-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <p className="text-sm text-gray-400">Redirecting you to your tickets...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-red-500 mb-6">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPayment;