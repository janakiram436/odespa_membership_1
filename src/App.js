import React from 'react';
import SHA512 from 'crypto-js/sha512';

const App = () => {
  
  // Generate the hash to be sent to PayU
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

  // Function to submit the form to PayU
  const fetchPayment = () => {
    const paymentData = {
      key: '26sF13CI',
      txnid: 'TXN' + Math.random().toString(36).substring(7),  // Generate unique txnid
      amount: '100',
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
      surl: 'https://test-payment-middleware.payu.in/simulatorResponse',
      furl: 'https://test-payment-middleware.payu.in/simulatorResponse',
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

  return (
    <div className="membership-section">
      <h1 className="heading">Your Perfect Package Ode Spa Membership</h1>
      <button onClick={fetchPayment}>Make Payment</button>
    </div>
  );
};

export default App;
