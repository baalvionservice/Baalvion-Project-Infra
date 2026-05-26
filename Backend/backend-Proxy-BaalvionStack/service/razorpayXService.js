const axios = require('axios');
const LOG_API_CALLS = process.env.LOG_API_CALLS === 'true';

const validateFundAccount = async (accountType, accountDetails) => {
    // accountType: 'vpa' for UPI, 'bank_account' for bank
    // accountDetails: { vpa: 'user@upi' } or { ifsc, account_number }
    const data = {
        account_type: accountType,
        fund_account: accountDetails
    };
    if (LOG_API_CALLS) {
        console.log('[RAZORPAYX API CALL] POST /v1/fund_accounts/validations');
        console.log('Payload:', data);
    }
    const response = await axios.post(
        'https://api.razorpay.com/v1/fund_accounts/validations',
        data,
        {
            auth: {
                username: process.env.RAZORPAY_KEY_ID,
                password: process.env.RAZORPAY_KEY_SECRET
            }
        }
    );
    if (LOG_API_CALLS) {
        console.log('[RAZORPAYX API RESPONSE] POST /v1/fund_accounts/validations');
        console.log('Response:', response.data);
    }
    return response.data;
};

const createPayout = async (payoutData) => {
    // payoutData: { account_number, fund_account_id, amount, currency, mode, purpose, ... }
    if (LOG_API_CALLS) {
        console.log('[RAZORPAYX API CALL] POST /v1/payouts');
        console.log('Payload:', payoutData);
    }
    const response = await axios.post(
        'https://api.razorpay.com/v1/payouts',
        payoutData,
        {
            auth: {
                username: process.env.RAZORPAY_KEY_ID,
                password: process.env.RAZORPAY_KEY_SECRET
            }
        }
    );
    if (LOG_API_CALLS) {
        console.log('[RAZORPAYX API RESPONSE] POST /v1/payouts');
        console.log('Response:', response.data);
    }
    return response.data;
};

module.exports = {
    validateFundAccount,
    createPayout
};
