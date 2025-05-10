import React, { useEffect, useState } from "react";

const PaymentResult = () => {
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    // Extract the query parameters from the URL
    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get("status");
    const txnid = queryParams.get("txnid");
    const amount = queryParams.get("amount");
    const error_message = queryParams.get("error_message");

    // Set the payment data
    setPaymentData({
      status,
      txnid,
      amount,
      error_message
    });
  }, []);

  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="modern-payment-result-bg">
      <div className="modern-payment-result-card animate-modal-in">
        {paymentData ? (
          <>
            <div className="modern-payment-result-icon">
              {paymentData.status === "success" ? (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4BB543" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="12" fill="#eafaf1"/><path d="M8 12l3 3l5-5" stroke="#4BB543" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="12" fill="#fff0f0"/><path d="M15 9l-6 6M9 9l6 6" stroke="#ff4d4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>
            <h2 className={paymentData.status === "success" ? "success-text" : "failure-text"}>
              {paymentData.status === "success" ? "Payment Successful" : "Payment Failed"}
            </h2>
            <div className="modern-payment-result-details">
              <div><span>Status:</span> <strong className={paymentData.status === "success" ? "success-text" : "failure-text"}>{paymentData.status}</strong></div>
              <div><span>Transaction ID:</span> <strong>{paymentData.txnid}</strong></div>
              <div><span>Amount:</span> <strong>{paymentData.amount ? paymentData.amount : "-"}</strong></div>
              {paymentData.error_message && (
                <div className="error-message">{paymentData.error_message}</div>
              )}
            </div>
            <button className="modern-payment-result-btn" onClick={goHome}>
              {paymentData.status === "success" ? "Go to Home" : "Try Again"}
            </button>
          </>
        ) : (
          <p>Loading payment details...</p>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
