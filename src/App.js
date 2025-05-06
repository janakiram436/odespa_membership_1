import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import SHA512 from 'crypto-js/sha512';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC14KBARTHpl2H63sFT9y9fBKBV9lA8fvM",
  authDomain: "ode-spa-webapp.firebaseapp.com",
  projectId: "ode-spa-webapp",
  storageBucket: "ode-spa-webapp.firebasestorage.app",
  messagingSenderId: "758935829641",
  appId: "1:758935829641:web:fd73be8e6c576e1a939a58",
  measurementId: "G-TC6MK1Y6FV"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);  // Initialize Firebase Authentication
const analytics = getAnalytics(app);  // Initialize Firebase Analytics


const App = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestInfo, setGuestInfo] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [guestId, setGuestId] = useState(null);  // Storing the guest ID
  const [membershipId, setMembershipId] = useState(null);  // Storing the selected membership ID
  const [invoiceId, setInvoiceId] = useState(null);
  const carouselRef = useRef(null);


  useEffect(() => {
    axios.get('https://api.zenoti.com/v1/centers/center_id/memberships?center_id=92d41019-c790-4668-9158-a693e531c1a4&show_in_catalog=true&expand=Null', {
      headers: {
        accept: 'application/json',
        Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
      },
    })
      .then((res) => setMemberships(res.data.memberships))
      .catch(() => setError('Failed to fetch memberships.'))
      .finally(() => setLoading(false));
  }, []);


  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };


  const handleSelect = (membership) => {
    setSelected(membership);
    setShowOTPModal(true);
    setStep(1);
    setPhone('');
    setOtp('');
    setOtpVerified(false);
    setShowGuestForm(false);
    setGuestInfo(null);
    setMembershipId(membership.id);  // Store selected membership ID
  };


  const sendOtp = async () => {
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const formattedPhone = '+91' + phone;  // Ensure correct phone format (e.g. +91)
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      alert('OTP sent successfully');
      setStep(2);
    } catch (err) {
      console.error("Error in OTP sending", err);
      alert('Failed to send OTP');
    }
  };


  const verifyOtp = async () => {
    try {
      await confirmationResult.confirm(otp);
      setOtpVerified(true);
      fetchGuestId();
    } catch (err) {
      console.error(err);
      alert('Incorrect OTP');
    }
  };

  // Generate the hash to be sent to PayU
  
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


  // Fetch user details using the invoice ID after invoice creation
  const fetchInvoiceDetails = async (invoiceId) => {
    try {
      const url = `https://api.zenoti.com/v1/invoices/${invoiceId}?expand=InvoiceItems&expand=Transactions`;
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283'
        }
      };


      const response = await fetch(url, options);
      const data = await response.json();


      if (data.invoice && data.invoice.guest) {
        setGuestInfo({
          firstName: data.invoice.guest.first_name,
          lastName: data.invoice.guest.last_name,
          phone: data.invoice.guest.mobile_phone,
          membership: data.invoice.invoice_items[0].name, // Assuming first item is the membership
        });
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
    }
  };


  const createInvoice = async (guestId) => {
    try {
      // Prepare the invoice API payload
      const payload = {
        center_id: "92d41019-c790-4668-9158-a693e531c1a4",
        membership_ids: membershipId,  // Use the selected membership ID
        user_id: guestId,  // Use the guest ID
      };


      console.log('Creating invoice with the following details:', payload);


      const response = await fetch('https://api.zenoti.com/v1/invoices/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
        },
        body: JSON.stringify(payload),
      });


      const data = await response.json();


      if (data.success) {
        setInvoiceId(data.invoice_id);  // Store the Invoice ID after creation
        alert(`Invoice created successfully with ID: ${data.invoice_id}`);
        fetchInvoiceDetails(data.invoice_id);
      } else {
        alert('Invoice creation failed: ' + (data.error.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Invoice creation failed.');
    }
  };




  const fetchGuestId = async () => {
    try {
      const response = await axios.get(`https://api.zenoti.com/v1/guests/search?phone=${phone}`, {
        headers: {
          Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
          accept: 'application/json',
        }
      });
      const guests = response.data.guests;
      if (guests.length > 0) {
        setGuestId(guests[0].id);  // Set guest ID if found
        alert('Guest is present');
        createInvoice(guests[0].id);  // Create invoice if guest exists
      } else {
        setShowGuestForm(true);
        alert('You don\'t have an account. Please create one.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to search guest.');
    }
  };


  const createGuest = async () => {
    try {
      const payload = {
        center_id: "92d41019-c790-4668-9158-a693e531c1a4",
        personal_info: {
          first_name: firstName,
          last_name: lastName,
          mobile_phone: {
            country_code: 95,
            number: phone
          },
          gender: gender === 1 ? 1 : 0  // Gender check for male (1) or female (0)
        }
      };
      const response = await axios.post('https://api.zenoti.com/v1/guests', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
        }
      });
      setGuestInfo(response.data);
      setGuestId(response.data.id);  // Store the newly created guest ID
      alert('Guest created successfully!');
      createInvoice(response.data.id);  // Create invoice after guest creation
    } catch (err) {
      console.error(err);
      alert('Guest creation failed.');
    }
  };


 
 
  return (
    <div className="membership-section">
      <h1 className="heading">Your Perfect Package Ode Spa Membership</h1>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
        <div className="carousel-container">
          <button className="arrow left" onClick={() => scrollCarousel('left')}>&lt;</button>
          <div className="carousel-wrapper" ref={carouselRef}>
            {memberships.map((m) => (
              <div
                className={`card-carousel ${selected?.id === m.id ? 'active' : ''}`}
                key={m.id}
                onClick={() => handleSelect(m)}
                style={{ backgroundColor: selected?.id === m.id ? 'rgb(182, 147, 72)' : '#f8f3ed' }}
              >
                <div className="price">INR {m.price.final.toLocaleString()}</div>
                <div className="details">
                  <p>Discount on services - {m.discount_percentage || 50}%</p>
                  <p>Validity - {m.validity_in_months || 12} months</p>
                </div>
                <button className="btn">Take a Membership</button>
              </div>
            ))}
          </div>
          <button className="arrow right" onClick={() => scrollCarousel('right')}>&gt;</button>
        </div>
      )}


      {showOTPModal && (
        <div className="otp-modal">
          <div className="otp-box">
            <span className="close-cross" onClick={() => setShowOTPModal(false)}>&#10006;</span>
            <h3>{guestInfo ? <div className="user-details">
          <h2>User Details</h2>
          <p>Name: {guestInfo.firstName} {guestInfo.lastName}</p>
          <p>Phone: {guestInfo.phone}</p>
          <p>Selected Membership: {guestInfo.membership}</p>
          <button onClick={fetchPayment}>Confirm</button>
        </div> : 'Verify Your Mobile'}</h3>
            {step === 1 && (
              <>
                <input
                  type="tel"
                  className="input"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button className="btn" onClick={sendOtp}>Continue</button>
              </>
            )}
            {step === 2 && !otpVerified && (
              <>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button className="btn" onClick={verifyOtp}>Verify OTP</button>
              </>
            )}
            {otpVerified && showGuestForm && !guestInfo && (
              <>
                <h4>No guest found. Please create an account.</h4>
                <input
                  className="input"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <div>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value={1}
                      onChange={() => setGender(1)}
                    /> Male
                  </label>
                  <label style={{ marginLeft: '1rem' }}>
                    <input
                      type="radio"
                      name="gender"
                      value={2}
                      onChange={() => setGender(2)}
                    /> Female
                  </label>
                </div>
                <button className="btn" onClick={createGuest}>Submit</button>
              </>
            )}
          </div>
        </div>
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
};


export default App;



