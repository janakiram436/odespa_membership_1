import React, { useEffect, useState } from 'react';
import SHA512 from 'crypto-js/sha512';

const App = () => {
  const [paymentStatus, setPaymentStatus] = useState(null); // To store payment details
  const [paymentDetails, setPaymentDetails] = useState(null); // To store transaction details for display

  // Generate the hash to be sent to PayU
  const generateHash = (paymentData, salt) => {
    const { key, txnid, amount, productinfo, firstname, email, phone, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '' } = paymentData;
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    return SHA512(hashString).toString();  // Hash the string and return it
  };

  // Function to submit the form to PayU
  const fetchPayment = () => {
    const paymentData = {
      key: '26sF13CI',
      txnid: 'TXN' + Math.random().toString(36).substring(7),  // Generate unique txnid
      amount: '1',
      productinfo: 'iPhone',
      firstname: 'ram',
      email: '',
      phone: '9182849325',
      udf1: '',
      udf2: '',
      udf3: '',
      udf4: '',
      udf5: '',
      salt: '0Rd0lVQEvO',
      // Redirect URLs after payment
      surl:"https://odespa-membership-1.vercel.app/",  // Redirect back to the same page for success
      furl:"https://odespa-membership-1.vercel.app/",  // Redirect back to the same page for failure
    };

    // Generate the hash for the payment
    const hash = generateHash(paymentData, paymentData.salt);
    paymentData.hash = hash;

    // Create a form dynamically
    const form = document.createElement('form');
    form.action = 'https://secure.payu.in/_payment';
    form.method = 'POST';

    // Append payment data to the form as hidden inputs
    for (const key in paymentData) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = paymentData[key];
      form.appendChild(input);
    }

    // Append the form to the body and submit it
    document.body.appendChild(form);
    form.submit();  // Submit the form to redirect to PayU
  };

  // Function to handle PayU response after payment completion
  const handlePaymentResponse = async (paymentResponse) => {
    try {
      // Handle the response object from PayU API
      if (paymentResponse.status === 'success') {
        setPaymentStatus({
          transactionId: paymentResponse.txnid,
          status: paymentResponse.status,
          amount: paymentResponse.amount,
          productinfo: paymentResponse.productinfo,
        });
      } else {
        setPaymentStatus({
          status: paymentResponse.status,
          errorMessage: paymentResponse.error_message,
        });
      }
    } catch (error) {
      console.error('Error handling payment response:', error);
    }
  };

  // Example listener or callback handler for the post-payment API response
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentResponse = {
      status: queryParams.get('status'),
      txnid: queryParams.get('txnid'),
      amount: queryParams.get('amount'),
      productinfo: queryParams.get('productinfo'),
      error_message: queryParams.get('error_message'),
    };

    // If there's a payment response, handle it
    if (paymentResponse.status) {
      setPaymentDetails(paymentResponse); // Store the payment details
      handlePaymentResponse(paymentResponse); // Handle the payment response
    }
  }, []);

  return (
    <div className="membership-section">
      <h1 className="heading">Your Perfect Package Ode Spa Membership</h1>
      <button onClick={fetchPayment}>Make Payment</button>

      {/* Conditional UI based on payment status */}
      {paymentStatus ? (
        <div>
          <h3>Payment Status</h3>
          <p>Transaction ID: {paymentStatus.transactionId}</p>
          <p>Status: {paymentStatus.status}</p>
          <p>Amount: {paymentStatus.amount}</p>
          <p>Product Info: {paymentStatus.productinfo}</p>
          {paymentStatus.errorMessage && <p>Error: {paymentStatus.errorMessage}</p>}
        </div>
      ) : (
        <div>
          <h3>Awaiting Payment Status</h3>
          <p>We are processing your payment, please wait...</p>
        </div>
      )}

      {paymentDetails && !paymentStatus && (
        <div>
          <h3>Payment Details:</h3>
          <p>Status: {paymentDetails.status}</p>
          <p>Transaction ID: {paymentDetails.txnid}</p>
          <p>Amount: {paymentDetails.amount}</p>
          <p>Product Info: {paymentDetails.productinfo}</p>
          {paymentDetails.error_message && <p>Error: {paymentDetails.error_message}</p>}
        </div>
      )}
    </div>
  );
};

export default App;
