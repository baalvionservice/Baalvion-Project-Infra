/**
 * @fileOverview Precision financial calculation logic for the platform's tools.
 */

export const financialMath = {
  /**
   * Calculates compound interest with periodic contributions.
   * Formula: A = P(1 + r/n)^(nt) + PMT * (((1 + r/n)^(nt) - 1) / (r/n))
   */
  calculateCompoundInterest: (
    principal: number,
    annualRate: number,
    years: number,
    monthlyContribution: number = 0,
    compoundingPeriods: number = 12
  ): number => {
    const r = annualRate / 100;
    const n = compoundingPeriods;
    const t = years;
    
    const principalCompounded = principal * Math.pow(1 + r / n, n * t);
    
    if (r === 0) return principal + (monthlyContribution * 12 * t);
    
    const contributionsCompounded = monthlyContribution * 12 *
      ((Math.pow(1 + r / n, n * t) - 1) / r);
      
    return principalCompounded + contributionsCompounded;
  },

  /**
   * Calculates investment future value with monthly contributions and returns data for charting.
   */
  calculateInvestmentGrowth: (principal: number, monthly: number, rate: number, years: number) => {
    let total = principal;
    const chartData = [];
    chartData.push({ year: 0, balance: Math.round(total) });

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        total = total * (1 + rate / 1200) + monthly;
      }
      chartData.push({ year: y, balance: Math.round(total) });
    }

    return {
      finalValue: total,
      chartData
    };
  },

  /**
   * Calculates the retirement corpus based on savings and contributions.
   */
  calculateRetirementCorpus: (currentSavings: number, monthlyContribution: number, rate: number, currentAge: number, retirementAge: number) => {
    const years = retirementAge - currentAge;
    if (years <= 0) return { finalValue: currentSavings, chartData: [{ year: currentAge, balance: currentSavings }] };
    
    let total = currentSavings;
    const chartData = [];
    chartData.push({ age: currentAge, balance: Math.round(total) });

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        total = total * (1 + rate / 1200) + monthlyContribution;
      }
      chartData.push({ age: currentAge + y, balance: Math.round(total) });
    }

    return {
      finalValue: total,
      chartData
    };
  },

  /**
   * Calculates monthly loan payment (EMI).
   * Formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
   */
  calculateMonthlyLoanPayment: (
    principal: number,
    annualRate: number,
    years: number
  ): number => {
    const i = (annualRate / 100) / 12;
    const n = years * 12;
    
    if (i === 0) return principal / n;
    if (n === 0) return principal;
    
    const factor = Math.pow(1 + i, n);
    return principal * (i * factor) / (factor - 1);
  },

  /**
   * Provides a full breakdown of loan costs.
   */
  getLoanSummary: (principal: number, annualRate: number, years: number) => {
    const monthlyPayment = financialMath.calculateMonthlyLoanPayment(principal, annualRate, years);
    const totalRepayment = monthlyPayment * (years * 12);
    const totalInterest = totalRepayment - principal;
    
    return {
      monthlyPayment,
      totalRepayment,
      totalInterest
    };
  },

  /**
   * Calculates future value adjusted for inflation.
   */
  calculateInflationImpact: (
    currentValue: number,
    inflationRate: number,
    years: number
  ): number => {
    return currentValue * Math.pow(1 + (inflationRate / 100), years);
  },

  /**
   * Calculates multi-asset portfolio performance.
   */
  calculatePortfolioSummary: (assets: { name: string; investment: number; returnRate: number }[]) => {
    const totalInvestment = assets.reduce((acc, a) => acc + a.investment, 0);
    const breakdown = assets.map(a => {
      const finalValue = a.investment * (1 + a.returnRate / 100);
      return {
        ...a,
        finalValue,
        profit: finalValue - a.investment
      };
    });

    const totalValue = breakdown.reduce((acc, a) => acc + a.finalValue, 0);
    const totalProfit = totalValue - totalInvestment;
    const weightedReturn = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalValue,
      totalProfit,
      weightedReturn,
      breakdown
    };
  },

  /**
   * Calculates Compound Annual Growth Rate between a starting and ending value.
   * Formula: CAGR = (End / Start)^(1 / years) - 1
   */
  calculateCAGR: (startValue: number, endValue: number, years: number): number => {
    if (startValue <= 0 || years <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  },

  /**
   * Estimates annual and monthly dividend income for a stock position.
   */
  calculateDividendIncome: (shares: number, pricePerShare: number, dividendYieldPercent: number) => {
    const positionValue = shares * pricePerShare;
    const annualIncome = positionValue * (dividendYieldPercent / 100);
    return {
      positionValue,
      annualIncome,
      monthlyIncome: annualIncome / 12,
    };
  },

  /**
   * Calculates the maximum share size for a trade given an account's risk budget.
   * Formula: shares = (account size * risk %) / (entry price - stop-loss price)
   */
  calculatePositionSize: (accountSize: number, riskPercent: number, entryPrice: number, stopLossPrice: number) => {
    const riskAmount = accountSize * (riskPercent / 100);
    const perShareRisk = Math.abs(entryPrice - stopLossPrice);
    const shares = perShareRisk > 0 ? Math.floor(riskAmount / perShareRisk) : 0;
    return {
      riskAmount,
      perShareRisk,
      shares,
      positionValue: shares * entryPrice,
    };
  },

  /**
   * Calculates realized profit/loss on a stock trade, including fees.
   */
  calculateProfitLoss: (shares: number, buyPrice: number, sellPrice: number, fees: number = 0) => {
    const costBasis = shares * buyPrice;
    const proceeds = shares * sellPrice;
    const profitLoss = proceeds - costBasis - fees;
    const percentReturn = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
    return { costBasis, proceeds, profitLoss, percentReturn };
  },
};
