/**
 * Example usage and test scenarios for E-Wallet Payment Integration
 * This file demonstrates how to test the e-wallet payment flow
 *
 * NOTE: This is a reference/example file only - not meant to be compiled or run directly.
 * Copy the patterns shown here into your actual frontend/test code.
 *
 * @file ewallet-usage.example.ts
 * @example
 */

/* eslint-disable */
// @ts-nocheck

// Example 1: Creating an E-Wallet Payment (Desktop/QR Code)
async function exampleCreatePaymentForDesktop() {
  const response = await fetch(
    'http://localhost:3000/shop/ewallet/create/package-id-123',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer YOUR_SESSION_TOKEN',
      },
    },
  );

  const payment = await response.json();
  console.log('Payment Created:', payment);

  // Display QR Code
  // <img src={payment.qrCodeUrl} alt="Scan to Pay" />

  // Expected response:
  // {
  //   transactionId: "clxxx...",
  //   orderId: "ORDER-1706...",
  //   amount: 50000,
  //   tokenAmount: 100,
  //   status: "PENDING",
  //   paymentMethod: "GOPAY",
  //   qrCodeUrl: "https://api.sandbox.midtrans.com/v2/gopay/.../qr-code",
  //   deeplinkUrl: "https://simulator.sandbox.midtrans.com/gopay/...",
  //   expiryTime: "2026-01-23T10:30:00.000Z",
  //   packageName: "100 Tokens Package"
  // }
}

// Example 2: Creating an E-Wallet Payment (Mobile/Deeplink)
async function exampleCreatePaymentForMobile() {
  const callbackUrl = 'myapp://payment-success';

  const response = await fetch(
    `http://localhost:3000/shop/ewallet/create/package-id-123?callback_url=${encodeURIComponent(callbackUrl)}`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer YOUR_SESSION_TOKEN',
      },
    },
  );

  const payment = await response.json();

  // Redirect to GoPay app
  // window.location.href = payment.deeplinkUrl;

  // After payment, user will be redirected to:
  // myapp://payment-success?order_id=ORDER-1706...&result=success
}

// Example 3: Polling Payment Status
async function pollPaymentStatus(transactionId: string) {
  const checkStatus = async () => {
    const response = await fetch(
      `http://localhost:3000/shop/check/${transactionId}`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer YOUR_SESSION_TOKEN',
        },
      },
    );

    const payment = await response.json();
    console.log('Payment Status:', payment.status);

    if (payment.status === 'CONFIRMED') {
      console.log('✅ Payment successful! Tokens credited.');
      return true;
    } else if (
      payment.status === 'CANCELLED' ||
      payment.status === 'DECLINED'
    ) {
      console.log('❌ Payment failed or cancelled');
      return true;
    }

    return false;
  };

  // Poll every 3 seconds for up to 15 minutes
  const interval = setInterval(async () => {
    const isDone = await checkStatus();
    if (isDone) {
      clearInterval(interval);
    }
  }, 3000);

  setTimeout(() => clearInterval(interval), 15 * 60 * 1000);
}

// Example 4: Simulating Midtrans Webhook (for testing)
async function simulateMidtransWebhook(orderId: string) {
  const crypto = require('crypto');

  const statusCode = '200';
  const grossAmount = '50000.00';
  const serverKey = process.env.SERVER_KEY || 'YOUR_SERVER_KEY_HERE';

  // Generate signature
  const signatureKey = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');

  const notification = {
    transaction_time: '2026-01-23 10:15:00',
    transaction_status: 'settlement',
    transaction_id: 'midtrans-txn-id-123',
    status_code: statusCode,
    signature_key: signatureKey,
    payment_type: 'gopay',
    order_id: orderId,
    merchant_id: 'G144808749',
    gross_amount: grossAmount,
    fraud_status: 'accept',
    currency: 'IDR',
  };

  const response = await fetch(
    'http://localhost:3000/shop/midtrans/notification',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    },
  );

  const result = await response.json();
  console.log('Webhook Response:', result);
  // Expected: { success: true, message: "Payment confirmed and tokens credited" }
}

// Example 5: Testing in Sandbox
async function testInSandbox() {
  console.log('=== Testing E-Wallet Payment in Sandbox ===\n');

  // Step 1: Create payment
  console.log('1. Creating payment...');
  const createResponse = await fetch(
    'http://localhost:3000/shop/ewallet/create/package-id-here',
    {
      method: 'POST',
      headers: { Authorization: 'Bearer YOUR_TOKEN' },
    },
  );
  const payment = await createResponse.json();
  console.log('   ✓ Payment created:', payment.orderId);

  // Step 2: Open QR Code URL in browser
  console.log('\n2. Open this URL in browser to simulate payment:');
  console.log('   ', payment.qrCodeUrl);
  console.log('   or');
  console.log('   ', payment.deeplinkUrl);

  // Step 3: Click "Pay" on simulator page
  console.log('\n3. On the simulator page, click "Pay" button');

  // Step 4: Webhook will be triggered automatically
  console.log('\n4. Webhook will be triggered and payment will be confirmed');

  // Step 5: Check payment status
  console.log('\n5. Checking payment status...');
  setTimeout(async () => {
    const statusResponse = await fetch(
      `http://localhost:3000/shop/check/${payment.transactionId}`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer YOUR_TOKEN' },
      },
    );
    const status = await statusResponse.json();
    console.log('   ✓ Final status:', status.status);
  }, 5000);
}

// Export examples
export {
  exampleCreatePaymentForDesktop,
  exampleCreatePaymentForMobile,
  pollPaymentStatus,
  simulateMidtransWebhook,
  testInSandbox,
};
