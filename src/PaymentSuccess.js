import React, { useEffect } from 'react';

const PaymentSuccess = ({ setStatus }) => {
  const paymentStatus = new URLSearchParams(window.location.search).get('status');
  const txnid = new URLSearchParams(window.location.search).get('txnid');
  const amount = new URLSearchParams(window.location.search).get('amount');
  const productinfo = new URLSearchParams(window.location.search).get('productinfo');

  useEffect(() => {
    if (paymentStatus === 'success') {
      console.log(`Payment Successful! Transaction ID: ${txnid}, Amount: ${amount}, Product: ${productinfo}`);
      setStatus('Payment Successful!');
      // Here you can perform any additional logic like sending data to your server
    } else {
      console.log('Payment Failed!');
      setStatus('Payment Failed!');
    }
  }, [paymentStatus, txnid, amount, productinfo, setStatus]);

  return (
    <div>
      <h2>Payment {paymentStatus === 'success' ? 'Successful' : 'Failed'}</h2>
      <p>Transaction ID: {txnid}</p>
      <p>Amount: {amount}</p>
      <p>Product Info: {productinfo}</p>
      <p>{paymentStatus === 'success' ? 'Thank you for your payment!' : 'Please try again.'}</p>
    </div>
  );
};

export default PaymentSuccess;
