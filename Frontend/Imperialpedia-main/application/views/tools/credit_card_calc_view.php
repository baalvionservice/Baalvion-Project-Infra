<?php
/**
 * Imperialpedia — Credit Card Payoff & Balance Transfer Calculator
 * Dedicated Standalone URL Page: /editor/credit-card-calculator
 */
?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-red: #e50914;
   --p6-red-hover: #b80710;
   --p6-dark: #0c0d0e;
   --p6-accent: #f59e0b;
   --p6-gray-bg: #f8f9fa;
   --p6-card-border: #e2e8f0;
   --p6-font-headline: 'Oswald', 'Roboto', Arial, sans-serif;
   --p6-font-body: 'Google Sans', 'Roboto', Arial, sans-serif;
   --p6-font-serif: 'Playfair Display', Georgia, serif;
}

body {
   background-color: #f7f7f9;
   font-family: var(--p6-font-body);
   color: #202124;
}

/* Page Hero Banner */
.p6-page-header {
   background: linear-gradient(135deg, #7c2d12 0%, #9a3412 100%);
   color: #ffffff;
   border-bottom: 4px solid #ea580c;
   padding: 42px 0 32px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: #f97316;
   font-weight: 700;
   text-transform: uppercase;
   margin-bottom: 8px;
   display: flex;
   align-items: center;
   gap: 6px;
}

.p6-main-title {
   font-family: var(--p6-font-serif);
   font-weight: 900;
   font-size: 2.5rem;
   color: #ffffff;
   margin-bottom: 12px;
   line-height: 1.15;
}

.p6-meta-bar {
   display: flex;
   align-items: center;
   gap: 20px;
   font-size: 0.88rem;
   color: #ffedd5;
}

/* Calculator Container Card */
.calc-card {
   background: #ffffff;
   border-radius: 12px;
   border: 1px solid #e2e8f0;
   box-shadow: 0 10px 30px rgba(0,0,0,0.06);
   overflow: hidden;
   margin-bottom: 35px;
}

.calc-header {
   background: #0f172a;
   color: #ffffff;
   padding: 20px 25px;
   border-bottom: 3px solid #ea580c;
}

.calc-body {
   padding: 30px;
}

.calc-label {
   font-weight: 700;
   font-size: 0.88rem;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   color: #334155;
   margin-bottom: 8px;
}

.calc-result-box {
   background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
   color: #ffffff;
   border-radius: 10px;
   padding: 24px;
   height: 100%;
   border-left: 5px solid #ea580c;
}

.calc-stat-val {
   font-family: var(--p6-font-headline);
   font-size: 2.2rem;
   font-weight: 700;
   color: #f97316;
   line-height: 1;
   margin-bottom: 4px;
}

.calc-stat-lbl {
   font-size: 0.78rem;
   text-transform: uppercase;
   letter-spacing: 1px;
   color: #94a3b8;
   margin-bottom: 15px;
}

.tool-cross-nav {
   background: #ffffff;
   border: 1px solid #e2e8f0;
   border-radius: 10px;
   padding: 20px;
   margin-bottom: 25px;
}

.article-content h2 {
   font-family: var(--p6-font-serif);
   font-weight: 700;
   color: #0f172a;
   margin-top: 35px;
   margin-bottom: 15px;
   padding-bottom: 8px;
   border-bottom: 2px solid #e2e8f0;
}

.article-content p {
   font-size: 1.05rem;
   line-height: 1.75;
   color: #334155;
   margin-bottom: 18px;
}

.benchmark-table th {
   background: #0f172a;
   color: #ffffff;
   font-family: var(--p6-font-headline);
   letter-spacing: 1px;
}

.seo-keyword-badge {
   background: #fff7ed;
   color: #9a3412;
   border: 1px solid #ffedd5;
   font-weight: 600;
   font-size: 0.8rem;
   padding: 4px 10px;
   border-radius: 20px;
   display: inline-block;
   margin: 3px;
}
</style>

<!-- PAGE HERO HEADER -->
<div class="p6-page-header">
  <div class="container">
    <div class="p6-breadcrumb">
      <i class="bi bi-credit-card-2-front"></i> DEBT MANAGEMENT & PERSONAL FINANCE &bull; DEDICATED SUITE
    </div>
    <h1 class="p6-main-title">Credit Card Payoff & Balance Transfer Savings Calculator</h1>
    <div class="p6-meta-bar">
      <span><i class="bi bi-clock-history"></i> Updated September 2026</span>
      <span><i class="bi bi-shield-check"></i> 0% Intro APR & Balance Transfer Fee Engine</span>
      <span><i class="bi bi-calculator"></i> Real-Time Debt Payoff Timeline</span>
    </div>
  </div>
</div>

<div class="container mb-5">
  <!-- SEO TARGET KEYWORDS STRIP -->
  <div class="mb-4">
    <span class="fw-bold small text-muted me-2">Target SEO Topics:</span>
    <span class="seo-keyword-badge">Credit Card Payoff Calculator</span>
    <span class="seo-keyword-badge">Credit Card Debt Minimum Payment Estimator</span>
    <span class="seo-keyword-badge">Credit Card Interest & Balance Transfer Calculator</span>
    <span class="seo-keyword-badge">Credit Card Cash Back Rewards Estimator</span>
    <span class="seo-keyword-badge">Debt Free Payoff Timeline Calculator</span>
  </div>

  <!-- OTHER TOOLS QUICK SWITCHER -->
  <div class="tool-cross-nav shadow-sm mb-4">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <span class="fw-bold text-uppercase text-danger small"><i class="bi bi-tools me-1"></i> Dedicated Calculator & Utility Suite:</span>
      <div class="btn-group flex-wrap">
        <a href="<?php echo base_url('editor/credit-card-calculator'); ?>" class="btn btn-sm btn-dark active">Credit Card Payoff Calc</a>
        <a href="<?php echo base_url('online-education/savings-calculator'); ?>" class="btn btn-sm btn-outline-dark">Savings & Invest Calc</a>
        <a href="<?php echo base_url('news/whatsapp-dp-downloader'); ?>" class="btn btn-sm btn-outline-dark">WhatsApp DP Downloader</a>
        <a href="<?php echo base_url('seo/web-seo'); ?>" class="btn btn-sm btn-outline-dark">Niche RPM Calc</a>
        <a href="<?php echo base_url('marketing/digital-marketing'); ?>" class="btn btn-sm btn-outline-dark">ROAS & CAC Simulator</a>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- MAIN CALCULATOR AND CONTENT -->
    <div class="col-lg-8">
      
      <!-- INTERACTIVE CALCULATOR ENGINE -->
      <div class="calc-card">
        <div class="calc-header d-flex align-items-center justify-content-between">
          <div>
            <h4 class="m-0 fw-bold text-white"><i class="bi bi-calculator-fill text-warning me-2"></i> Credit Card Payoff Engine</h4>
            <small class="text-white-50">Model payoff timelines, interest costs, & 0% balance transfer savings</small>
          </div>
          <span class="badge bg-warning text-dark">DEBT FREE ENGINE</span>
        </div>
        <div class="calc-body">
          <div class="row g-4">
            
            <!-- INPUT CONTROLS -->
            <div class="col-md-6">
              
              <!-- Total Credit Card Balance -->
              <div class="mb-3">
                <label class="calc-label">Total Credit Card Balance ($)</label>
                <input type="number" id="cardBalance" class="form-control form-control-lg fw-bold" value="8500" step="500" oninput="calculateCard()">
              </div>

              <!-- APR Interest Rate -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Interest Rate (APR %)</label>
                  <span class="fw-bold text-danger fs-5" id="aprDisplay">22.5%</span>
                </div>
                <input type="range" class="form-range" id="aprRange" min="8.0" max="34.9" step="0.5" value="22.5" oninput="calculateCard()">
              </div>

              <!-- Monthly Payment -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Planned Monthly Payment ($)</label>
                  <span class="fw-bold text-primary fs-5" id="payDisplay">$280</span>
                </div>
                <input type="range" class="form-range" id="payRange" min="100" max="2000" step="10" value="280" oninput="calculateCard()">
              </div>

              <!-- 0% Intro APR Duration -->
              <div class="mb-3">
                <label class="calc-label">0% Balance Transfer Offer Duration</label>
                <select id="transferSelect" class="form-select border-secondary fw-bold" onchange="calculateCard()">
                  <option value="18" selected>18 Months 0% Intro APR (3% Fee)</option>
                  <option value="15">15 Months 0% Intro APR (3% Fee)</option>
                  <option value="21">21 Months 0% Intro APR (5% Fee)</option>
                  <option value="12">12 Months 0% Intro APR (3% Fee)</option>
                </select>
              </div>

            </div>

            <!-- OUTPUT RESULTS BOX -->
            <div class="col-md-6">
              <div class="calc-result-box">
                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Months to Become 100% Debt Free</div>
                  <div class="calc-stat-val text-warning" id="resMonths">43 Months (3.6 Yrs)</div>
                  <small class="text-white-50" id="resTargetDate">Target Debt Free: April 2030</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Total Interest Paid to Credit Card</div>
                  <div class="h3 fw-bold text-danger mb-0" id="resTotalInterest">$3,485</div>
                  <small class="text-white-50">Total paid: $11,985 on $8,500 balance</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Potential 0% Balance Transfer Savings</div>
                  <div class="calc-stat-val text-success" id="resSavings">$3,230 SAVED</div>
                  <span class="badge bg-success mt-1" id="resFeeLabel">NET AFTER $255 TRANSFER FEE</span>
                </div>

                <div>
                  <div class="calc-stat-lbl">Monthly Payment for 0% Promo Payoff</div>
                  <div class="h4 fw-bold text-info mb-1" id="resPromoPay">$486 / mo</div>
                  <span class="text-white-50 extra-small">Pay $486/mo to be 100% interest-free</span>
                </div>
              </div>
            </div>

          </div>

          <!-- ACTION BAR -->
          <div class="mt-4 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="text-muted small">
              <i class="bi bi-info-circle me-1"></i> Based on daily compounding APR interest formulas used by major credit card issuers.
            </div>
            <button class="btn btn-outline-dark btn-sm fw-bold" onclick="copyCardReport()">
              <i class="bi bi-clipboard-check me-1"></i> Copy Payoff Strategy Plan
            </button>
          </div>

        </div>
      </div>

      <!-- IN-DEPTH SEO EDITORIAL CONTENT -->
      <article class="article-content bg-white p-4 p-md-5 rounded border shadow-sm">
        <h2 id="credit-card-payoff-guide">How to Pay Off Credit Card Debt Fast: Avalanche vs. Snowball vs. Balance Transfer</h2>
        <p>Credit card interest rates have reached historic highs, with average APRs exceeding <strong>21.5% to 28.0%</strong>. For individuals carrying balances across multiple store cards or rewards cards, making only minimum monthly payments leads straight into the "minimum payment trap"—often requiring 15 to 25 years to pay off a single balance while paying double or triple the original purchase price in interest.</p>

        <p>Using our <strong>Credit Card Payoff & Balance Transfer Calculator</strong>, you can instantly compare three primary debt payoff strategies to eliminate credit card debt years faster while saving thousands of dollars in interest.</p>

        <!-- BENCHMARK TABLE -->
        <h2 id="payoff-strategy-comparison">Comparison of Credit Card Debt Elimination Strategies</h2>
        <div class="table-responsive my-4">
          <table class="table table-bordered table-striped align-middle benchmark-table">
            <thead>
              <tr>
                <th>Debt Payoff Strategy</th>
                <th>Methodology</th>
                <th>Total Interest Paid</th>
                <th>Payoff Speed</th>
                <th>Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-bold">0% Balance Transfer Card</td>
                <td>Transfer balance to 0% intro APR card for 12-21 months</td>
                <td class="text-success fw-bold">$0 Interest (Fee: 3-5%)</td>
                <td><span class="badge bg-success">Fastest (12-21 Mos)</span></td>
                <td>Good credit scores (670+) looking to eliminate interest</td>
              </tr>
              <tr>
                <td class="fw-bold">Debt Avalanche Method</td>
                <td>Pay minimums on all cards, direct extra cash to highest APR card</td>
                <td>Lowest Math Interest</td>
                <td>Fast</td>
                <td>Analytical mindsets seeking maximum mathematical savings</td>
              </tr>
              <tr>
                <td class="fw-bold">Debt Snowball Method</td>
                <td>Pay minimums on all cards, direct extra cash to smallest balance card</td>
                <td>Slightly Higher Interest</td>
                <td>Moderate</td>
                <td>Behavioral momentum and quick psychological wins</td>
              </tr>
              <tr>
                <td class="fw-bold">Minimum Payments Only</td>
                <td>Pay 2% to 3% minimum monthly balance requirement</td>
                <td class="text-danger fw-bold">Highest ($5,000+ Interest)</td>
                <td class="text-danger fw-bold">Slowest (15–25 Years)</td>
                <td><span class="badge bg-danger">Not Recommended</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="the-minimum-payment-trap">Understanding the Credit Card Minimum Payment Trap</h2>
        <p>Credit card companies calculate minimum monthly payments as a small percentage of your balance (typically <strong>1% of balance + monthly interest charges</strong>, or a flat 2% to 3%). Because interest charges absorb the majority of your payment, your principal balance decreases at a painfully slow rate.</p>

        <p>For example, carrying an $8,500 balance at 22.5% APR while paying only the minimum $170/month will take <strong>over 18 years to pay off</strong> and cost more than <strong>$11,500 in interest alone</strong>. Increasing your monthly payment by just $110/month cuts your payoff time down to 3.5 years and saves over $8,000!</p>

        <!-- FREQUENTLY ASKED QUESTIONS -->
        <h2 id="faq-section" class="mt-5">Frequently Asked Questions</h2>
        <div class="accordion accordion-flush id-faq-accordion" id="cardFaq">
          
          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingOne">
              <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne">
                How does a 0% Intro APR Balance Transfer work?
              </button>
            </h3>
            <div id="faqCollapseOne" class="accordion-collapse collapse show" data-bs-parent="#cardFaq">
              <div class="accordion-body">
                A balance transfer card allows you to move high-interest credit card debt onto a new card with a <strong>0% APR promotional period</strong> (typically 12 to 21 months). In exchange for a one-time 3% or 5% transfer fee, 100% of your monthly payments go directly toward shrinking your principal balance.
              </div>
            </div>
          </div>

          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingTwo">
              <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo">
                Does a balance transfer hurt my credit score?
              </button>
            </h3>
            <div id="faqCollapseTwo" class="accordion-collapse collapse" data-bs-parent="#cardFaq">
              <div class="accordion-body">
                Applying for a new balance transfer card causes a minor hard credit inquiry (typically 3 to 5 points temporary dip). However, opening the new card increases your overall available credit, lowering your overall <strong>Credit Utilization Ratio</strong>, which significantly boosts your credit score over time as you pay down the debt.
              </div>
            </div>
          </div>

        </div>

        <!-- COMMENTS SECTION -->
        <div class="mt-5 pt-4 border-top">
          <h4 class="fw-bold mb-3"><i class="bi bi-chat-left-text me-2"></i> Join the Personal Finance Discussion</h4>
          <?php $this->load->view('includes/poll_widget', ['poll_slug' => 'editor-credit-card']); ?>
        </div>

      </article>
    </div>

    <!-- RIGHT SIDEBAR -->
    <div class="col-lg-4">
      
      <!-- TOOL QUICK SWITCHER SIDEBAR -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-dark text-white fw-bold">
          <i class="bi bi-tools text-warning me-2"></i> ALL DEDICATED TOOLS
        </div>
        <div class="list-group list-group-flush">
          <a href="<?php echo base_url('editor/credit-card-calculator'); ?>" class="list-group-item list-group-item-action active fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-credit-card-2-front-fill me-2"></i> Credit Card Payoff Calc</span>
            <span class="badge bg-light text-dark">Debt</span>
          </a>
          <a href="<?php echo base_url('online-education/savings-calculator'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-piggy-bank-fill me-2"></i> Savings & Investment Calc</span>
            <span class="badge bg-secondary">Finance</span>
          </a>
          <a href="<?php echo base_url('news/whatsapp-dp-downloader'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-whatsapp me-2"></i> WhatsApp DP Downloader</span>
            <span class="badge bg-secondary">Social</span>
          </a>
          <a href="<?php echo base_url('seo/web-seo'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-bar-chart-fill me-2"></i> High-Traffic Niche Calc</span>
            <span class="badge bg-secondary">SEO</span>
          </a>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
function calculateCard() {
  const balance = parseFloat(document.getElementById('cardBalance').value) || 0;
  const apr = parseFloat(document.getElementById('aprRange').value) / 100;
  const monthlyPay = parseFloat(document.getElementById('payRange').value);
  const promoMonths = parseInt(document.getElementById('transferSelect').value);

  document.getElementById('aprDisplay').innerText = (apr * 100).toFixed(1) + '%';
  document.getElementById('payDisplay').innerText = '$' + monthlyPay.toLocaleString();

  const monthlyRate = apr / 12;
  
  // Payoff simulation loop
  let bal = balance;
  let months = 0;
  let totalInterest = 0;

  if (monthlyPay <= balance * monthlyRate) {
    // Payment too low to cover monthly interest
    document.getElementById('resMonths').innerText = 'Infinite (Payment too low!)';
    document.getElementById('resTotalInterest').innerText = 'Infinite';
    document.getElementById('resSavings').innerText = '$0';
    return;
  }

  while (bal > 0 && months < 360) {
    const interest = bal * monthlyRate;
    totalInterest += interest;
    bal = bal + interest - monthlyPay;
    months++;
  }

  // 0% Balance Transfer Calculations
  const transferFeePct = promoMonths === 21 ? 0.05 : 0.03;
  const transferFee = balance * transferFeePct;
  const netSavings = Math.max(0, totalInterest - transferFee);
  const promoMonthlyPay = (balance + transferFee) / promoMonths;

  document.getElementById('resMonths').innerText = months + ' Months (' + (months / 12).toFixed(1) + ' Yrs)';
  document.getElementById('resTotalInterest').innerText = '$' + Math.round(totalInterest).toLocaleString();
  document.getElementById('resSavings').innerText = '$' + Math.round(netSavings).toLocaleString() + ' SAVED';
  document.getElementById('resFeeLabel').innerText = `NET SAVINGS AFTER $${Math.round(transferFee)} TRANSFER FEE`;
  document.getElementById('resPromoPay').innerText = '$' + Math.round(promoMonthlyPay).toLocaleString() + ' / mo';
}

function copyCardReport() {
  const bal = document.getElementById('cardBalance').value;
  const apr = document.getElementById('aprDisplay').innerText;
  const months = document.getElementById('resMonths').innerText;
  const savings = document.getElementById('resSavings').innerText;

  const text = `Imperialpedia Credit Card Payoff Strategy:\n- Card Balance: $${bal}\n- APR: ${apr}\n- Payoff Time: ${months}\n- Potential 0% Transfer Savings: ${savings}\nCalculated at: http://localhost:8000/editor/credit-card-calculator`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Credit card payoff strategy report copied to clipboard!');
  });
}

document.addEventListener('DOMContentLoaded', calculateCard);
</script>
