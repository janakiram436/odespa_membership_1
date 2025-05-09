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

  return (
    <div className="payment-result">
      <h1>Payment Result</h1>
      {paymentData ? (
        <div>
          <p>Status: {paymentData.status}</p>
          <p>Transaction ID: {paymentData.txnid}</p>
          <p>Amount: {paymentData.amount}</p>
          {paymentData.error_message && (
            <p>Error Message: {paymentData.error_message}</p>
          )}
        </div>
      ) : (
        <p>Loading payment details...</p>
      )}
    </div>
  );
};

export default PaymentResult;
