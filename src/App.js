import React, { useState, useEffect } from 'react';
import SHA512 from 'crypto-js/sha512';  // For generating hash

const App = () => {
  const [status, setStatus] = useState(null); // Payment status (success/failure)
  const [showPopup, setShowPopup] = useState(false); // To control showing the popup message

  // Generate hash function for PayU
  const generateHash = (paymentData, salt) => {
    const key = paymentData.key;
    const txnid = paymentData.txnid;
    const amount = paymentData.amount;
    const productinfo = paymentData.productinfo;
    const firstname = paymentData.firstname;
    const email = paymentData.email;
    const phone = paymentData.phone;
    const udf1 = paymentData.udf1 || '';
    const udf2 = paymentData.udf2 || '';
    const udf3 = paymentData.udf3 || '';
    const udf4 = paymentData.udf4 || '';
    const udf5 = paymentData.udf5 || '';

    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    return SHA512(hashString).toString();  // Hash the string and return it
  };

  // Function to handle the payment
  const fetchPayment = () => {
    const paymentData = {
      key: '26sF13CI',  // Replace with your PayU key
      txnid: 'TXN' + Math.random().toString(36).substring(7),  // Unique txnid
      amount: '1',  // Amount to be paid
      productinfo: 'iPhone',  // Product info
      firstname: 'ram',  // User's first name
      email: '',
      phone: '9182849325',
      udf1: '',
      udf2: '',
      udf3: '',
      udf4: '',
      udf5: '',
      salt: '0Rd0lVQEvO',  // Your salt value
      surl: 'https://odespa-membership-1.vercel.app/',  // Success URL (same as your app URL)
      furl: 'https://odespa-membership-1.vercel.app/',  // Failure URL (same as your app URL)
    };

    const hash = generateHash(paymentData, paymentData.salt);
    paymentData.hash = hash;

    // Create a form dynamically to submit to PayU
    const form = document.createElement('form');
    form.action = 'https://secure.payu.in/_payment';
    form.method = 'POST';

    for (const key in paymentData) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = paymentData[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();  // Submit the form to trigger payment
  };

  // Extract URL parameters (status) to show success/failure message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status'); // Get status from URL
    const txnid = urlParams.get('txnid'); // Get transaction ID from URL
    const amount = urlParams.get('amount'); // Get amount from URL
    const productinfo = urlParams.get('productinfo'); // Get product info from URL

    if (paymentStatus) {
      console.log(`Payment Status: ${paymentStatus}`);
      console.log(`Transaction ID: ${txnid}`);
      console.log(`Amount: ${amount}`);
      console.log(`Product Info: ${productinfo}`);

      setStatus(paymentStatus);  // Set payment status (either 'success' or 'failure')
      setShowPopup(true);  // Show the pop-up with the message
    }
  }, []);

  return (
    <div className="membership-section">
      <h1 className="heading">Your Perfect Package Ode Spa Membership</h1>
      <button onClick={fetchPayment}>Make Payment</button>

      {/* Display the pop-up message if payment status is available */}
      {showPopup && (
        <div className="payment-popup">
          <h2>{status === 'success' ? 'Payment Successful' : 'Payment Failed'}</h2>
          <p>{status === 'success' ? 'Your payment was successful!' : 'Payment failed. Please try again.'}</p>
          <p>Transaction ID: {new URLSearchParams(window.location.search).get('txnid')}</p>
          <p>Amount: {new URLSearchParams(window.location.search).get('amount')}</p>
          <p>Product Info: {new URLSearchParams(window.location.search).get('productinfo')}</p>
        </div>
      )}
    </div>
  );
};

export default App;
