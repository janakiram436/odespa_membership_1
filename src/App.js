import React, { useRef, useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

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
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'invisible',
    'callback': (response) => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      // Response expired. Ask user to solve reCAPTCHA again.
      console.log('reCAPTCHA expired');
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
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    setupRecaptcha();
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
      if (!window.recaptchaVerifier) {
        setupRecaptcha();
      }

      const formattedPhone = '+91' + phone;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      alert('OTP sent successfully');
      setStep(2);
    } catch (err) {
      console.error("Error in OTP sending", err);
      if (err.code === 'auth/captcha-check-failed') {
        // Reset reCAPTCHA if it fails
        window.recaptchaVerifier = null;
        setupRecaptcha();
        alert('Please try again. reCAPTCHA verification failed.');
      } else {
        alert('Failed to send OTP. Please try again.');
      }
    }
  };

  const verifyOtp = async () => {
    try {
      await confirmationResult.confirm(otp);
      setOtpVerified(true);
      fetchGuestId();
      // If no guest form and no guestInfo, close modal after a short delay
      setTimeout(() => {
        if (!showGuestForm && !guestInfo) {
          setShowOTPModal(false);
        }
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Incorrect OTP');
    }
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
        alert('Guest is present');
        createInvoice(guests[0].id);
      } else {
        setShowGuestForm(true);
        alert('You don\'t have an account. Please create one.');
      }
    } catch (err) {
      console.error('Error searching guest:', err);
      if (err.response?.status === 429) {
        alert('Too many requests. Please try again in a few moments.');
      } else {
        alert('Failed to search guest. Please try again.');
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
      alert('Guest created successfully!');
      createInvoice(response.data.id);
    } catch (err) {
      console.error('Error creating guest:', err);
      if (err.response?.status === 429) {
        alert('Too many requests. Please try again in a few moments.');
      } else {
        alert('Guest creation failed. Please try again.');
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
        alert(`Invoice created successfully with ID: ${data.invoice_id}`);
        fetchInvoiceDetails(data.invoice_id);
      } else {
        alert('Invoice creation failed: ' + (data.error.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      if (err.message === 'RATE_LIMIT') {
        alert('Too many requests. Please try again in a few moments.');
      } else {
        alert('Invoice creation failed. Please try again.');
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

  return (
    <div className="membership-section">
      <h1 className="heading">Your Perfect Package Ode Spa Membership</h1>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
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
                  <h2>INR {m.price.final.toLocaleString()}</h2>
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
                    Take a Membership
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
              <div className="modern-modal-row"><span>Phone:</span> <strong>+91 {guestInfo?.phone}</strong></div>
              <div className="modern-modal-row"><span>Selected Membership:</span> <strong>{guestInfo?.membership}</strong></div>
            </div>
            <button className="modern-modal-confirm" onClick={() => alert('Confirmed')}>Confirm</button>
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
                  <div className="modern-modal-check">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b69348" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="#f8f3ed"/><path d="M12 8v8M8 12h8"/></svg>
                  </div>
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
                    style={{marginBottom: '1.2rem'}}
                  />
                </div>
                <button className="modern-modal-confirm" onClick={sendOtp}>Continue</button>
              </>
            )}
            {step === 2 && !otpVerified && (
              <>
                <div className="modern-modal-header">
                  <div className="modern-modal-check">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b69348" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="#f8f3ed"/><path d="M12 8v8M8 12h8"/></svg>
                  </div>
                  <h2>OTP Verification</h2>
                </div>
                <div className="modern-modal-details">
                  <input
                    type="text"
                    className="modern-modal-input"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    style={{marginBottom: '1.2rem'}}
                  />
                </div>
                <div className="modern-modal-actions">
                  <button className="modern-modal-back-icon-btn" onClick={() => setStep(1)} aria-label="Back">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="12" fill="#b69348"/>
                      <path d="M14.5 7.5L10 12l4.5 4.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="modern-modal-confirm" onClick={verifyOtp}>Continue</button>
                </div>
              </>
            )}
            {otpVerified && showGuestForm && !guestInfo && (
              <>
                <div className="modern-modal-header">
                  <div className="modern-modal-check">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b69348" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="#f8f3ed"/><path d="M12 8v8M8 12h8"/></svg>
                  </div>
                  <h2>Create Account</h2>
                </div>
                <div className="modern-modal-details">
                  <input
                    className="modern-modal-input"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    className="modern-modal-input"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <div style={{marginBottom: '1.2rem'}}>
                    <label style={{marginRight: '1.5rem'}}>
                      <input
                        type="radio"
                        name="gender"
                        value={1}
                        checked={gender === 1}
                        onChange={() => setGender(1)}
                      /> Male
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value={2}
                        checked={gender === 2}
                        onChange={() => setGender(2)}
                      /> Female
                    </label>
                  </div>
                </div>
                <button className="modern-modal-confirm" onClick={createGuest}>Submit</button>
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
