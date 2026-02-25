import { Cashfree } from 'cashfree-pg';
import crypto from 'crypto';

// Configure SDK — credentials read at call time via getters to ensure dotenv is loaded
const initCashfree = () => {
  Cashfree.XClientId     = process.env.CASHFREE_APP_ID;
  Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
  Cashfree.XEnvironment  = process.env.CASHFREE_ENV === 'PROD' ? 'PRODUCTION' : 'SANDBOX';
  console.log('Cashfree init → ENV:', Cashfree.XEnvironment, '| AppID:', process.env.CASHFREE_APP_ID?.slice(0, 10) + '...');
};

// ── Create a Cashfree Payment Order ───────────────────────
export const createCashfreeOrder = async ({ orderId, amount, customerName, customerEmail, customerPhone }) => {
  // Cashfree customer_id must be alphanumeric only
  const customerId = customerEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 50);

  const orderRequest = {
    order_id:       orderId,
    order_amount:   amount,
    order_currency: 'INR',
    customer_details: {
      customer_id:    customerId,
      customer_name:  customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || '9999999999',
    },
    order_meta: {
      return_url: `${process.env.CLIENT_URL}/tenant/payments?order_id={order_id}`,
    },
  };

  initCashfree();
  const response = await Cashfree.PGCreateOrder('2023-08-01', orderRequest);
  return response.data; // Contains payment_session_id
};

// ── Verify Webhook Signature ───────────────────────────────
export const verifyCashfreeWebhook = (rawBody, signature, timestamp) => {
  const signedPayload  = `${timestamp}${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
    .update(signedPayload)
    .digest('base64');
  return expectedSignature === signature;
};

// ── Get Order Status ───────────────────────────────────────
export const getCashfreeOrderStatus = async (orderId) => {
  const response = await Cashfree.PGFetchOrder('2023-08-01', orderId);
  return response.data;
};
