const Decimal = require('decimal.js');
const config = require('../config/appConfig');

/**
 * Fee Engine: Tiered fee calculation using BigDecimal precision
 * Prevents floating-point arithmetic errors in financial calculations
 */

class FeeEngine {
  constructor() {
    this.percentageFee = new Decimal(config.fees.percentageFee);
    this.flatFee = new Decimal(config.fees.flatFee).dividedBy(100); // Convert cents to dollars
    this.vatRate = new Decimal(config.fees.vatRate);
  }

  /**
   * Calculate fees for a transaction
   * @param {string|number} amount - Transaction amount (in minor units, e.g., cents)
   * @param {string} paymentScheme - Payment scheme (NIP, VISA, etc.)
   * @returns {object} { fee, vat, total } in minor units
   */
  calculateFees(amount, paymentScheme = 'INTERNAL') {
    const amountDecimal = new Decimal(amount);

    // Scheme-specific fee rates
    let percentageFee = this.percentageFee;
    let flatFee = this.flatFee;

    switch (paymentScheme) {
      case 'VISA':
      case 'MASTERCARD':
        percentageFee = new Decimal('0.02'); // 2% for card payments
        flatFee = new Decimal('100').dividedBy(100); // 1 USD flat
        break;
      case 'NIP':
        percentageFee = new Decimal('0.005'); // 0.5% for NIP
        flatFee = new Decimal('50').dividedBy(100); // 50 cents
        break;
      case 'INTERSWITCH':
        percentageFee = new Decimal('0.015'); // 1.5% for Interswitch
        flatFee = new Decimal('75').dividedBy(100); // 75 cents
        break;
      case 'INTERNAL':
        percentageFee = new Decimal('0'); // No fee for internal transfers
        flatFee = new Decimal('0');
        break;
      case 'WALLET':
        percentageFee = new Decimal('0.01'); // 1% for wallet
        flatFee = new Decimal('0'); // No flat fee
        break;
      default:
        // Default fees
        break;
    }

    // Calculate percentage-based fee
    const percentageFeeAmount = amountDecimal.times(percentageFee);

    // Total fee before VAT
    const totalFeeBefore = percentageFeeAmount.plus(flatFee);

    // Calculate VAT on fee
    const vat = totalFeeBefore.times(this.vatRate);

    // Total fee including VAT
    const totalFee = totalFeeBefore.plus(vat);

    return {
      percentageFee: percentageFeeAmount.toFixed(4),
      flatFee: flatFee.toFixed(4),
      totalFee: totalFee.toFixed(4),
      vat: vat.toFixed(4),
      netFee: totalFeeBefore.toFixed(4),
    };
  }

  /**
   * Check if transaction amount is within configured limits
   */
  validateLimits(amount, schema = 'INTERNAL') {
    const amountDecimal = new Decimal(amount);
    const minLimit = new Decimal(config.limits.transactionMin);
    const maxLimit = new Decimal(config.limits.transactionMax);

    if (amountDecimal.lessThan(minLimit)) {
      return {
        valid: false,
        error: `AMOUNT_TOO_LOW`,
        message: `Minimum transaction amount is ${minLimit.toFixed(2)} (in cents)`,
      };
    }

    if (amountDecimal.greaterThan(maxLimit)) {
      return {
        valid: false,
        error: `AMOUNT_TOO_HIGH`,
        message: `Maximum transaction amount is ${maxLimit.toFixed(2)} (in cents)`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate total debit (amount + fees + vat) from account
   */
  calculateTotalDebit(amount, paymentScheme = 'INTERNAL') {
    const amountDecimal = new Decimal(amount);
    const fees = this.calculateFees(amount, paymentScheme);
    const totalFee = new Decimal(fees.totalFee);

    return amountDecimal.plus(totalFee).toFixed(4);
  }
}

module.exports = new FeeEngine();
