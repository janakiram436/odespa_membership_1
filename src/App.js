import React, { useRef, useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import SHA512 from 'crypto-js/sha512';
//import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'; 
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
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Configure reCAPTCHA
const setupRecaptcha = () => {
  return new Promise((resolve, reject) => {
    try {
      // Clear any existing reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      // Create new reCAPTCHA verifier
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          console.log('reCAPTCHA verified');
          resolve(response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
          reject(new Error('reCAPTCHA expired'));
        }
      });

      // Render the reCAPTCHA
      window.recaptchaVerifier.render().then(function(widgetId) {
        window.recaptchaWidgetId = widgetId;
        resolve(widgetId);
      });
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      reject(error);
    }
  });
};

const App = () => {
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const [guestId, setGuestId] = useState(null);
  const [membershipId, setMembershipId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentResult, setPaymentResult] = useState(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    const initializeRecaptcha = async () => {
      try {
        await setupRecaptcha();
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error);
      }
    };
    initializeRecaptcha();

    // Cleanup on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Fetch memberships from Zenoti API with retry logic
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const response = await axios.get(
          'https://api.zenoti.com/v1/centers/center_id/memberships?center_id=92d41019-c790-4668-9158-a693e531c1a4&show_in_catalog=true&expand=Null',
          {
            headers: {
              accept: 'application/json',
              Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
            },
          }
        );
        setMemberships(response.data.memberships);
        setError('');
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.error('Error fetching memberships:', err);
        if (err.response?.status === 429 && retryCount < MAX_RETRIES) {
          // If rate limited and haven't exceeded max retries
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchMemberships(); // Retry after delay
          }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        } else {
          setError('Failed to fetch memberships. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [retryCount]);

  // Auto scroll functionality
  useEffect(() => {
    let autoScrollInterval;
    let scrollPosition = 0;
    const cardWidth = 350 + 32; // card width + margin
    const scrollSpeed = 5;
    
    const startAutoScroll = () => {
      if (isAutoScrolling) {
        autoScrollInterval = setInterval(() => {
          if (carouselRef.current) {
            scrollPosition += scrollSpeed;
            
            if (scrollPosition >= cardWidth * memberships.length) {
              scrollPosition = 0;
            }
            
            carouselRef.current.scrollTo({
              left: scrollPosition,
              behavior: 'auto'
            });
            
            setCurrentIndex(prev => (prev + 1) % memberships.length);
          }
        }, 16);
      }
    };

    startAutoScroll();

    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [isAutoScrolling, memberships.length]);

  const handleUserInteraction = () => {
    setIsAutoScrolling(false);
    setTimeout(() => {
      setIsAutoScrolling(true);
    }, 5000);
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.children[0].offsetWidth + 32;
      carouselRef.current.scrollBy({ 
        left: direction === 'right' ? cardWidth : -cardWidth, 
        behavior: 'smooth' 
      });
      setCurrentIndex(prev => {
        const newIndex = direction === 'right' 
          ? (prev + 1) % memberships.length 
          : (prev - 1 + memberships.length) % memberships.length;
        return newIndex;
      });
    }
  };

  const handleSelect = (membership) => {
    setSelectedIndex(memberships.indexOf(membership));
    setShowOTPModal(true);
    setStep(1);
    setPhone('');
    setOtp('');
    setOtpVerified(false);
    setShowGuestForm(false);
    setGuestInfo(null);
    setMembershipId(membership.id);
    handleUserInteraction();
  };

  const sendOtp = async () => {
    try {
      if (!phone || phone.length !== 10) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }

      // Reset and setup new reCAPTCHA
      try {
        await setupRecaptcha();
      } catch (error) {
        console.error('Failed to setup reCAPTCHA:', error);
        alert('Failed to setup verification. Please try again.');
        return;
      }

      const formattedPhone = '+91' + phone;
      const appVerifier = window.recaptchaVerifier;
      
      if (!appVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
      
      // Check if guest exists
      const response = await axios.get(
        `https://api.zenoti.com/v1/guests/search?phone=${phone}`,
        {
          headers: {
            Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
            accept: 'application/json',
          },
        }
      );
      const guests = response.data.guests;
      if (guests.length > 0) {
        setGuestId(guests[0].id);
        createInvoice(guests[0].id);
      } else {
        setShowGuestForm(true);
      }
    } catch (err) {
      console.error("Error in OTP sending", err);
      if (err.code === 'auth/invalid-app-credential') {
        alert('Verification failed. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        alert('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/quota-exceeded') {
        alert('SMS quota exceeded. Please try again later.');
      } else {
        alert('Error sending OTP. Please try again.');
      }
      
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmationResult.confirm(otp);
      setOtpVerified(true);
      // After OTP verification, check if guest exists
      const response = await axios.get(
        `https://api.zenoti.com/v1/guests/search?phone=${phone}`,
        {
          headers: {
            Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
            accept: 'application/json',
          },
        }
      );
      const guests = response.data.guests;
      if (guests.length > 0) {
        setGuestId(guests[0].id);
        createInvoice(guests[0].id);
      } else {
        setShowGuestForm(true);
      }
    } catch (err) {
      console.error(err);
      //alert('Incorrect OTP');
    }
  };

  const generateHash = (paymentData, salt) => {
      const { key, txnid, amount, productinfo, firstname, email, phone, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '' } = paymentData;
      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
      return SHA512(hashString).toString();
    };
  
  
    const fetchPayment = (guestDetails) => {
      const paymentData = {
        key: '26sF13CI',
        txnid: invoiceId, //'TXN' + Math.random().toString(36).substring(7),
        amount: "1",//guestDetails.price,
        productinfo: guestDetails.membership,
        firstname: guestDetails.firstName,
        email: '',
        phone: phone,
        udf1: '', udf2: '', udf3: '', udf4: '', udf5: '',
        salt: '0Rd0lVQEvO',
        surl: "https://odespa-backend1.onrender.com/api/payu/success",
        furl: "https://odespa-backend1.onrender.com/api/payu/failure",
      };
  
  
      const hash = generateHash(paymentData, paymentData.salt);
      paymentData.hash = hash;
  
  
      const form = document.createElement('form');
      form.action = 'https://secure.payu.in/_payment';
      form.method = 'POST';
      //form.target = '_blank';
  
  
      for (const key in paymentData) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = paymentData[key];
        form.appendChild(input);
      }
  
  
      document.body.appendChild(form);
      form.submit();
    };

  const fetchGuestId = async () => {
    try {
      const response = await axios.get(
        `https://api.zenoti.com/v1/guests/search?phone=${phone}`,
        {
          headers: {
            Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
            accept: 'application/json',
          },
        }
      );
      const guests = response.data.guests;
      if (guests.length > 0) {
        setGuestId(guests[0].id);
        //alert('Guest is present');
        createInvoice(guests[0].id);
      } else {
        setShowGuestForm(true);
        //alert('You don\'t have an account. Please create one.');
      }
    } catch (err) {
      console.error('Error searching guest:', err);
      if (err.response?.status === 429) {
        //alert('Too many requests. Please try again in a few moments.');
      } else {
        //alert('Failed to search guest. Please try again.');
      }
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
          gender: gender === 1 ? 1 : 0
        }
      };
      const response = await axios.post(
        'https://api.zenoti.com/v1/guests',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
          }
        }
      );
      setGuestInfo(response.data);
      setGuestId(response.data.id);
      //alert('Guest created successfully!');
      createInvoice(response.data.id);
    } catch (err) {
      console.error('Error creating guest:', err);
      if (err.response?.status === 429) {
        //alert('Too many requests. Please try again in a few moments.');
      } else {
        //alert('Guest creation failed. Please try again.');
      }
    }
  };

  const createInvoice = async (guestId) => {
    try {
      const payload = {
        center_id: "92d41019-c790-4668-9158-a693e531c1a4",
        membership_ids: membershipId,
        user_id: guestId,
      };

      const response = await fetch('https://api.zenoti.com/v1/invoices/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'apikey 061fb3b3f6974acc828ced31bef595cca3f57e5bc194496785492e2b70362283',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }

      const data = await response.json();

      if (data.success) {
        setInvoiceId(data.invoice_id);
        console.log(data.invoice_id)
        //alert(`Invoice created successfully with ID: ${data.invoice_id}`);
        fetchInvoiceDetails(data.invoice_id);
      } else {
        //alert('Invoice creation failed: ' + (data.error.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      if (err.message === 'RATE_LIMIT') {
        //alert('Too many requests. Please try again in a few moments.');
      } else {
        //alert('Invoice creation failed. Please try again.');
      }
    }
  };

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
          membership: data.invoice.invoice_items[0].name,
          netPrice:data.invoice.invoice_items[0].price.sales,
          tax:data.invoice.invoice_items[0].price.tax,
          price:data.invoice.invoice_items[0].price.final,
        });
        setShowOTPModal(true);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
    }
  };

  // Load guestInfo and showOTPModal from localStorage on mount
  useEffect(() => {
    const storedGuestInfo = localStorage.getItem('guestInfo');
    const storedShowOTPModal = localStorage.getItem('showOTPModal');
    if (storedGuestInfo) {
      setGuestInfo(JSON.parse(storedGuestInfo));
    }
    if (storedShowOTPModal === 'true') {
      setShowOTPModal(true);
    }
  }, []);

  // Persist guestInfo and showOTPModal to localStorage when they change
  useEffect(() => {
    if (guestInfo) {
      localStorage.setItem('guestInfo', JSON.stringify(guestInfo));
    } else {
      localStorage.removeItem('guestInfo');
    }
    localStorage.setItem('showOTPModal', showOTPModal ? 'true' : 'false');
  }, [guestInfo, showOTPModal]);

  // When cancel icon is clicked, close modal and clear guestInfo from localStorage
  const handleCloseModal = () => {
    setShowOTPModal(false);
    setGuestInfo(null);
    localStorage.removeItem('guestInfo');
    localStorage.setItem('showOTPModal', 'false');
  };

  // Add payment result handling
  useEffect(() => {
    const handlePaymentResult = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const status = queryParams.get("status");
      const error_message = queryParams.get("error_message");
      const sisinvoiceid = queryParams.get("sisinvoiceid");
      const productinfo = queryParams.get("productinfo");
      const amount = queryParams.get("amount");

      if (status) {
        setPaymentResult({
          status,
          error_message,
          sisinvoiceid,
          productinfo,
          amount,
          invoiceStatus: sisinvoiceid === 'true' ? 'closed' : 'pending'
        });
        setShowOTPModal(false); // Hide OTP/User modal if pe
      }
    };

    handlePaymentResult();
  }, []);

  // Close payment result modal
  const handleClosePaymentResult = () => {
    setPaymentResult(null);
    // Clear query params from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="membership-section">
      <h1 className="heading">Your Perfect Package Ode Spa Membership</h1>
      {loading ? (
        <div className="center-spinner">
          <div className="lds-spinner">
            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
          </div>
        </div>
      ) : error ? <p>{error}</p> : (
        <div 
          className="carousel-container"
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
        >
          <button
            className="arrow left"
            onClick={() => {
              scrollCarousel('left');
              handleUserInteraction();
            }}
          >
            <FiArrowLeft className="arrow-icon" />
          </button>
          <div 
            className="carousel-wrapper" 
            ref={carouselRef}
            onTouchStart={() => setIsAutoScrolling(false)}
            onTouchEnd={() => setTimeout(() => setIsAutoScrolling(true), 5000)}
          >
            {memberships.map((m, idx) => (
              <div
                className={`service-style3 membership-type ${selectedIndex === idx ? 'selected' : ''}`}
                key={m.id}
                onClick={() => handleSelect(m)}
              >
                <div>
                  <h2>INR {m.price.sales.toLocaleString()}</h2>
                </div>
                <div>
                  <p>
                    Discount on services - {m.discount_percentage || 50}%
                    <br className="d-xs-none d-lg-block" />
                    Validity - {m.validity_in_months || 12} months
                  </p>
                </div>
                <div>
                  <button className="select-location">
                    Take Membership
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="arrow right"
            onClick={() => {
              scrollCarousel('right');
              handleUserInteraction();
            }}
          >
            <FiArrowRight className="arrow-icon" />
          </button>
        </div>
      )}

      {/* Payment Result Modal */}
      {paymentResult && (
        <div className="modern-modal">
          <div className="modern-modal-card animate-modal-in" style={{maxWidth: 380, padding: '2.5rem 2rem 2rem 2rem', textAlign: 'center', position: 'relative'}}>
            <span
              className="modern-modal-close"
              onClick={handleClosePaymentResult}
              style={{position: 'absolute', top: 18, right: 18, fontSize: 24, color: '#ff4d4f', cursor: 'pointer'}}
              title="Close"
            >&#10006;</span>
            
            {paymentResult.status === 'success' ? (
              <>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#4BB543',
                  marginBottom: '1.2rem',
                  letterSpacing: '0.01em',
                }}>Payment Successful</h2>
                <div style={{margin: '1.2rem 0', fontSize: '1.1rem'}}>
                  <div style={{
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <div><strong>Payment Status:</strong> Successful</div>
                    <div><strong>Invoice Status:</strong> {paymentResult.invoiceStatus === 'closed' ? 'Closed' : 'Pending'}</div>
                    {paymentResult.sisinvoiceid === 'true' && (
                      <>
                        <div><strong>Product:</strong> {paymentResult.productinfo}</div>
                        <div><strong>Amount:</strong> ₹{paymentResult.amount}</div>
                      </>
                    )}
                  </div>
                  {paymentResult.invoiceStatus === 'closed' ? (
                    <div style={{color: '#4BB543'}}>
                      Your membership has been activated successfully!
                    </div>
                  ) : (
                    <div style={{color: '#ff9800'}}>
                      Your invoice is still open. Please contact support if this persists.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#ff4d4f',
                  marginBottom: '1.2rem',
                  letterSpacing: '0.01em',
                }}>Payment Failed</h2>
                {paymentResult.error_message && (
                  <div style={{
                    color: '#ff4d4f',
                    background: '#fff0f0',
                    borderRadius: 8,
                    padding: '0.8rem 1rem',
                    margin: '1.2rem 0',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                  }}>{paymentResult.error_message}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* User Details/OTP Modal (unchanged) */}
      {showOTPModal && guestInfo && (
        <div className="modern-modal">
          <div className="modern-modal-card animate-modal-in">
            <span className="modern-modal-close" onClick={handleCloseModal}>&#10006;</span>
            <div className="modern-modal-header">
              <div className="modern-modal-check">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4BB543" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="#eafaf1"/><path d="M8 12l2 2l4-4"/></svg>
              </div>
              <h2>User Details</h2>
            </div>
            <div className="modern-modal-details">
              <div className="modern-modal-row"><span>Name:</span> <strong>{guestInfo?.firstName} {guestInfo?.lastName}</strong></div>
              <div className="modern-modal-row"><span>Phone:</span> <strong>{guestInfo?.phone?.includes('+91') ? guestInfo.phone.replace('+91', '').trim() : guestInfo?.phone}</strong></div>
              <div className="modern-modal-row"><span>Selected Membership:</span> <strong>{guestInfo?.membership}</strong></div>
              <div className="modern-modal-row"><span>Price:</span> <strong>₹{guestInfo?.netPrice?.toLocaleString()}</strong></div>
              <div className="modern-modal-row"><span>Tax Price:</span> <strong>₹{guestInfo?.tax?.toLocaleString()}</strong></div>
              <div className="modern-modal-row"><span>Total Price:</span> <strong>₹{guestInfo?.price?.toLocaleString()}</strong></div>
            </div>
            <button className="modern-modal-confirm" onClick={() => fetchPayment(guestInfo)}>Confirm</button>
          </div>
        </div>
      )}
      {showOTPModal && !guestInfo && (step === 1 || (step === 2 && !otpVerified) || (otpVerified && showGuestForm && !guestInfo)) && (
        <div className="modern-modal">
          <div className="modern-modal-card animate-modal-in">
            <span className="modern-modal-close" onClick={handleCloseModal}>&#10006;</span>
            {step === 1 && (
              <>
                <div className="modern-modal-header">
                  <h2>Enter Mobile Number</h2>
                </div>
                <div className="modern-modal-details">
                  <input
                    type="tel"
                    className="modern-modal-input"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    style={{marginBottom: '1.2rem'}} />
                </div>
                <button className="modern-modal-confirm" onClick={sendOtp}>Continue</button>
              </>
            )}
            {step === 2 && !otpVerified && (
              <>
                <div className="modern-modal-header" style={{justifyContent: 'flex-start', gap: '0.7rem'}}>
                  <button className="modern-modal-back-icon-btn" onClick={() => setStep(1)} aria-label="Back" style={{margin: 0}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b69348" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="12" fill="#f8f3ed"/>
                      <path d="M14.5 7.5L10 12l4.5 4.5" stroke="#b69348" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <h2 style={{flex: 1, textAlign: 'center', margin: 0}}>OTP Verification</h2>
                </div>
                <div className="modern-modal-details">
                  <input
                    type="text"
                    className="modern-modal-input"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    style={{marginBottom: '1.2rem'}} />
                </div>
                <div className="modern-modal-actions" style={{justifyContent: 'center'}}>
                  <button className="modern-modal-confirm wide-btn" onClick={verifyOtp} disabled={otp.length !== 6}>Continue</button>
                </div>
              </>
            )}
            {otpVerified && showGuestForm && !guestInfo && (
              <>
                <div className="modern-modal-header">
                  <h2>Create Account</h2>
                </div>
                <div className="modern-modal-details">
                  <input
                    className="modern-modal-input"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)} />
                  <input
                    className="modern-modal-input"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)} />
                  <div style={{marginBottom: '1.2rem'}}>
                    <label style={{marginRight: '1.5rem'}}>
                      <input
                        type="radio"
                        name="gender"
                        value={1}
                        checked={gender === 1}
                        onChange={() => setGender(1)} /> Male
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value={2}
                        checked={gender === 2}
                        onChange={() => setGender(2)} /> Female
                    </label>
                  </div>
                </div>
                <button className="modern-modal-confirm" onClick={createGuest}>Submit</button>
              </>
            )}
          </div>
        </div>
      )}
      <div id="recaptcha-container" style={{ position: 'fixed', bottom: 0, right: 0, zIndex: -1, opacity: 0 }}></div>
    </div>
  );
};

export default App;
