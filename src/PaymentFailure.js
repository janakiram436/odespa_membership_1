import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PaymentFailure = ({ setStatus }) => {
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('status');  // Check if payment failed

    if (paymentStatus === 'failure') {
      setStatus('Payment Failed. Please try again.');
    }
  }, [location, setStatus]);

  return (
    <div>
      <h1>Payment Failure</h1>
      <p>Something went wrong. Please check your payment details and try again.</p>
    </div>
  );
};

export default PaymentFailure;
