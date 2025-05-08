import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';  // Importing React Router components
import SHA512 from 'crypto-js/sha512';  // For generating hash

import PaymentSuccess from './PaymentSuccess';  // Success component
import PaymentFailure from './PaymentFailure';  // Failure component

const App = () => {
  const [status, setStatus] = useState(null);  // For storing payment status (Success/Failure)

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
      salt: '0Rd0lVQEvO',  // Your salt value
      surl: 'http://localhost:3000/payment-success',  // Success URL
      furl: 'http://localhost:3000/payment-failure',  // Failure URL
    };

    const hash = generateHash(paymentData, paymentData.salt);
    paymentData.hash = hash;

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

  return (
    <Router>
      <div className="membership-section">
        <h1 className="heading">Your Perfect Package Ode Spa Membership</h1>
        <button onClick={fetchPayment}>Make Payment</button>
        
        {/* Use Routes instead of Switch */}
        <Routes>
          <Route path="/payment-success" element={<PaymentSuccess setStatus={setStatus} />} />
          <Route path="/payment-failure" element={<PaymentFailure setStatus={setStatus} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
