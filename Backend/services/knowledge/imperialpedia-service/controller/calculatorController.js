'use strict';
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const saveResult = async (userId, calculator_type, inputs, results) => {
    if (userId) {
        await db.CalculatorResult.create({ user_id: userId, calculator_type, inputs, results });
    }
};

// POST /calculators/compound-interest
// A = P(1 + r/n)^(nt)
const compoundInterest = async (req, res, next) => {
    try {
        const { principal, rate, years, frequency } = req.body;
        if (!principal || !rate || !years) {
            return next(new AppError('VALIDATION_ERROR', 'principal, rate, and years are required', 400));
        }

        const P = parseFloat(principal);
        const r = parseFloat(rate) / 100;
        const t = parseFloat(years);
        const n = parseInt(frequency) || 12; // default monthly

        const A = P * Math.pow(1 + r / n, n * t);
        const totalInterest = A - P;

        // Build yearly schedule
        const schedule = [];
        for (let year = 1; year <= Math.ceil(t); year++) {
            const yrs = Math.min(year, t);
            const balance = P * Math.pow(1 + r / n, n * yrs);
            schedule.push({
                year,
                balance: parseFloat(balance.toFixed(2)),
                interest_earned: parseFloat((balance - P).toFixed(2)),
            });
        }

        const result = {
            principal: P,
            final_amount: parseFloat(A.toFixed(2)),
            total_interest: parseFloat(totalInterest.toFixed(2)),
            rate_percent: parseFloat(rate),
            years: t,
            frequency: n,
            schedule,
        };

        await saveResult(req.user?.id, 'compound_interest', { principal: P, rate, years: t, frequency: n }, result);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

// POST /calculators/retirement
const retirement = async (req, res, next) => {
    try {
        const { currentAge, retirementAge, monthlyContribution, expectedReturn, currentSavings } = req.body;
        if (!currentAge || !retirementAge || !monthlyContribution) {
            return next(new AppError('VALIDATION_ERROR', 'currentAge, retirementAge, and monthlyContribution are required', 400));
        }

        const years = parseFloat(retirementAge) - parseFloat(currentAge);
        if (years <= 0) return next(new AppError('VALIDATION_ERROR', 'retirementAge must be greater than currentAge', 400));

        const r = parseFloat(expectedReturn || 8) / 100 / 12; // monthly rate
        const n = years * 12; // months
        const P = parseFloat(currentSavings || 0);
        const PMT = parseFloat(monthlyContribution);

        // Future value of current savings
        const fvSavings = P * Math.pow(1 + r, n);
        // Future value of monthly contributions (annuity)
        const fvContributions = PMT * ((Math.pow(1 + r, n) - 1) / r);
        const corpus = fvSavings + fvContributions;

        // Build yearly schedule
        const schedule = [];
        let balance = P;
        for (let year = 1; year <= Math.ceil(years); year++) {
            const months = Math.min(year * 12, n);
            const bal = P * Math.pow(1 + r, months) + PMT * ((Math.pow(1 + r, months) - 1) / r);
            const totalContributed = P + PMT * months;
            schedule.push({
                year: parseInt(currentAge) + year,
                balance: parseFloat(bal.toFixed(2)),
                total_contributed: parseFloat(totalContributed.toFixed(2)),
                growth: parseFloat((bal - totalContributed).toFixed(2)),
            });
            balance = bal;
        }

        const totalContributed = P + PMT * n;
        const monthlyRequired = PMT; // already provided

        const result = {
            corpus: parseFloat(corpus.toFixed(2)),
            monthly_required: parseFloat(monthlyRequired.toFixed(2)),
            total_contributed: parseFloat(totalContributed.toFixed(2)),
            total_growth: parseFloat((corpus - totalContributed).toFixed(2)),
            years_to_retire: years,
            schedule,
        };

        await saveResult(req.user?.id, 'retirement', { currentAge, retirementAge, monthlyContribution, expectedReturn, currentSavings }, result);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

// POST /calculators/loan
// EMI = P * r * (1+r)^n / ((1+r)^n - 1)
const loan = async (req, res, next) => {
    try {
        const { principal, rate, tenureMonths } = req.body;
        if (!principal || !rate || !tenureMonths) {
            return next(new AppError('VALIDATION_ERROR', 'principal, rate, and tenureMonths are required', 400));
        }

        const P = parseFloat(principal);
        const r = parseFloat(rate) / 100 / 12; // monthly interest rate
        const n = parseInt(tenureMonths);

        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayable = emi * n;
        const totalInterest = totalPayable - P;

        // Build monthly schedule (amortization table, sample up to 360)
        const schedule = [];
        let balance = P;
        for (let month = 1; month <= n; month++) {
            const interestPayment = balance * r;
            const principalPayment = emi - interestPayment;
            balance -= principalPayment;
            schedule.push({
                month,
                emi: parseFloat(emi.toFixed(2)),
                principal_payment: parseFloat(principalPayment.toFixed(2)),
                interest_payment: parseFloat(interestPayment.toFixed(2)),
                balance: parseFloat(Math.max(0, balance).toFixed(2)),
            });
        }

        const result = {
            emi: parseFloat(emi.toFixed(2)),
            total_payable: parseFloat(totalPayable.toFixed(2)),
            total_interest: parseFloat(totalInterest.toFixed(2)),
            principal: P,
            rate_percent: parseFloat(rate),
            tenure_months: n,
            schedule,
        };

        await saveResult(req.user?.id, 'loan', { principal: P, rate, tenureMonths: n }, result);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

// POST /calculators/sip
// SIP maturity = PMT * [(1 + r)^n - 1] / r * (1 + r)
const sip = async (req, res, next) => {
    try {
        const { monthly, rate, years } = req.body;
        if (!monthly || !rate || !years) {
            return next(new AppError('VALIDATION_ERROR', 'monthly, rate, and years are required', 400));
        }

        const PMT = parseFloat(monthly);
        const r = parseFloat(rate) / 100 / 12; // monthly rate
        const n = parseInt(years) * 12; // months

        const maturity = PMT * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        const totalInvested = PMT * n;
        const gains = maturity - totalInvested;

        // Yearly schedule
        const schedule = [];
        for (let year = 1; year <= parseInt(years); year++) {
            const months = year * 12;
            const bal = PMT * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
            const invested = PMT * months;
            schedule.push({
                year,
                balance: parseFloat(bal.toFixed(2)),
                total_invested: parseFloat(invested.toFixed(2)),
                gains: parseFloat((bal - invested).toFixed(2)),
            });
        }

        const result = {
            maturity: parseFloat(maturity.toFixed(2)),
            total_invested: parseFloat(totalInvested.toFixed(2)),
            gains: parseFloat(gains.toFixed(2)),
            monthly_sip: PMT,
            rate_percent: parseFloat(rate),
            years: parseInt(years),
            schedule,
        };

        await saveResult(req.user?.id, 'sip', { monthly: PMT, rate, years: parseInt(years) }, result);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

// GET /calculators/history — auth
const getHistory = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = { user_id: req.user.id };

        if (req.query.calculator_type) where.calculator_type = req.query.calculator_type;

        const { count, rows } = await db.CalculatorResult.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
        });

        return sendSuccess(req, res, {
            items: rows,
            pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        });
    } catch (err) { return next(err); }
};

module.exports = { compoundInterest, retirement, loan, sip, getHistory };
