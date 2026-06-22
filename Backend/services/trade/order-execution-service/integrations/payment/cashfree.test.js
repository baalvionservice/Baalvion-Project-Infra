'use strict';
// Locks in the GTI consumer-gateway Cashfree adapter (Jest). No network — global.fetch is mocked.
//   • createPaymentIntent creates a REAL Cashfree order (x-client-id/secret + pinned api-version),
//     binds it to THIS GTI order via order_tags, and returns the public payment_session_id.
//   • confirmPayment is BACKEND-AUTHORITATIVE: it captures ONLY when Cashfree reports
//     order_status === 'PAID' AND the order is bound to the same orderId (never trusts the client).
//   • getProvider('cashfree') resolves the adapter.
const { getProvider } = require('./consumerProvider');

const realFetch = global.fetch;

function mockFetchOnce(jsonBody, ok = true, status = 200) {
  global.fetch = jest.fn(async () => ({ ok, status, text: async () => JSON.stringify(jsonBody) }));
}

describe('cashfree consumer provider (GTI order-execution)', () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    // Env-key path (the vault returns null with no PAYMENT_SITE_SLUG, so we fall back to env keys).
    delete process.env.PAYMENT_SITE_SLUG;
    process.env.CASHFREE_CLIENT_ID = 'cid';
    process.env.CASHFREE_CLIENT_SECRET = 'csec';
    process.env.CASHFREE_MODE = 'test';
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  test('getProvider("cashfree") returns the cashfree adapter', () => {
    expect(getProvider('cashfree').name).toBe('cashfree');
  });

  test('createPaymentIntent creates an order and returns the payment_session_id + bound order tag', async () => {
    mockFetchOnce({ order_id: 'cfo_server', payment_session_id: 'session_xyz' });
    const provider = getProvider('cashfree');
    const intent = await provider.createPaymentIntent({ orderId: 'ord-123', amount: 1917.5, currencyCode: 'INR' });

    expect(intent.intentId).toBe('cfo_server');
    expect(intent.sessionId).toBe('session_xyz');
    expect(intent.status).toBe('requires_action');

    const call = global.fetch.mock.calls[0];
    expect(String(call[0])).toMatch(/\/pg\/orders$/);
    expect(call[1].headers['x-client-id']).toBe('cid');
    expect(call[1].headers['x-client-secret']).toBe('csec');
    expect(call[1].headers['x-api-version']).toBeTruthy();
    const body = JSON.parse(call[1].body);
    expect(body.order_amount).toBe(1917.5); // MAJOR units
    expect(body.order_tags.orderId).toBe('ord-123'); // bound to THIS GTI order
  });

  test('confirmPayment captures ONLY when Cashfree reports PAID for the bound order', async () => {
    mockFetchOnce({ order_id: 'cfo_1', order_status: 'PAID', order_tags: { orderId: 'ord-1' } });
    const provider = getProvider('cashfree');
    const res = await provider.confirmPayment({ intentId: 'cfo_1', orderId: 'ord-1' });
    expect(res.status).toBe('captured');
    expect(res.transactionId).toBe('cfo_1');
  });

  test('confirmPayment refuses to capture when the order is not PAID', async () => {
    mockFetchOnce({ order_id: 'cfo_1', order_status: 'ACTIVE', order_tags: { orderId: 'ord-1' } });
    const res = await getProvider('cashfree').confirmPayment({ intentId: 'cfo_1', orderId: 'ord-1' });
    expect(res.status).toBe('failed');
    expect(res.reason).toMatch(/cashfree_status_active/);
  });

  test('confirmPayment rejects an order bound to a DIFFERENT GTI order (anti-IDOR)', async () => {
    mockFetchOnce({ order_id: 'cfo_1', order_status: 'PAID', order_tags: { orderId: 'someone-else' } });
    const res = await getProvider('cashfree').confirmPayment({ intentId: 'cfo_1', orderId: 'ord-1' });
    expect(res.status).toBe('failed');
    expect(res.reason).toBe('order_mismatch');
  });

  test('confirmPayment FAILS CLOSED when the Cashfree order carries no binding tag', async () => {
    mockFetchOnce({ order_id: 'cfo_1', order_status: 'PAID' }); // no order_tags
    const res = await getProvider('cashfree').confirmPayment({ intentId: 'cfo_1', orderId: 'ord-1' });
    expect(res.status).toBe('failed');
    expect(res.reason).toBe('order_mismatch');
  });

  test('createPaymentIntent rejects a non-positive amount before any network call', async () => {
    global.fetch = jest.fn();
    await expect(getProvider('cashfree').createPaymentIntent({ orderId: 'ord-1', amount: 0, currencyCode: 'INR' }))
      .rejects.toThrow(/invalid order amount/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
