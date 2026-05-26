const Razorpay = require('razorpay');
const crypto = require('crypto');
const store = require('./platformStore');

let transactions = null;
try {
  const models = require('../models');
  transactions = models.transactions;
} catch (error) {
  transactions = null;
}

const LOG_API_CALLS = process.env.LOG_API_CALLS === 'true';
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}


// Create a new Razorpay order (legacy, kept for backward compat)
const createOrder = async (userId, planId) => {
  try {
    if (!razorpay) {
      return { success: false, message: 'Razorpay not configured' };
    }

    const plans = await store.getCollection('plans');
    const plan = plans.find((item) => item.id === planId || item.slug === planId);
    if (!plan) {
      return { success: false, message: 'Plan not found' };
    }

    const order = await razorpay.orders.create({
      amount: Math.round(plan.monthlyPrice * 100),
      currency: 'USD',
      receipt: `legacy_${userId}_${Date.now()}`,
      notes: { user_id: String(userId), plan_slug: plan.slug },
    });

    return {
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan,
    };
  } catch (error) {
    console.error('Create Order Error:', error);
    throw error;
  }
};


// Verify Razorpay payment signature and activate subscription (legacy, kept for backward compat)
const verifyPayment = async (
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  planId
) => {
  try {
    if (!razorpay) {
      return { success: false, message: 'Razorpay not configured' };
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return { success: false, message: 'Signature mismatch' };
    }

    return {
      success: true,
      message: 'Payment verified',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planId,
    };
  } catch (error) {
    console.error("Verify Payment Error:", error);
    throw error;
  }
};


// Get all transactions for a user
const getUserTransactions = async (userId) => {
  try {
    if (!transactions) {
      return [];
    }

    if (!/^\d+$/.test(String(userId))) {
      return [];
    }

    const userTransactions = await transactions.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    return userTransactions;

  } catch (error) {
    console.error("Get Transactions Error:", error);
    throw error;
  }
};

const getPlans = async () => store.getCollection('plans');

const getPaymentMethods = async (orgId) => store.getCollection('paymentMethods', orgId);


module.exports = {
    createOrder,
    verifyPayment,
    getUserTransactions,
  getPlans,
  getPaymentMethods,
};
