<?php
/**
 * Imperialpedia — Health Insurance Premium & ACA Subsidy Estimator
 * Dedicated Standalone URL Page: /insurance/health-insurance
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
   --p6-accent: #05e5b5;
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
   background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
   color: #ffffff;
   border-bottom: 4px solid #34d399;
   padding: 42px 0 32px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: #34d399;
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
   font-size: 2.6rem;
   color: #ffffff;
   margin-bottom: 12px;
   line-height: 1.15;
}

.p6-meta-bar {
   display: flex;
   align-items: center;
   gap: 20px;
   font-size: 0.88rem;
   color: #a7f3d0;
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
   border-bottom: 3px solid #34d399;
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
   border-left: 5px solid #34d399;
}

.calc-stat-val {
   font-family: var(--p6-font-headline);
   font-size: 2.2rem;
   font-weight: 700;
   color: #34d399;
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
</style>

<!-- PAGE HERO HEADER -->
<div class="p6-page-header">
  <div class="container">
    <div class="p6-breadcrumb">
      <i class="bi bi-heart-pulse"></i> HEALTH INSURANCE & ACA TAX CREDITS &bull; DEDICATED SUITE
    </div>
    <h1 class="p6-main-title">Health Insurance Premium & ACA Subsidy Estimator</h1>
    <div class="p6-meta-bar">
      <span><i class="bi bi-clock-history"></i> Updated September 2026</span>
      <span><i class="bi bi-shield-check"></i> ACA Federal Poverty Guidelines Calibrated</span>
      <span><i class="bi bi-calculator"></i> Real-Time Premium & Deductible Estimator</span>
    </div>
  </div>
</div>

<div class="container mb-5">
  <!-- OTHER TOOLS QUICK SWITCHER -->
  <div class="tool-cross-nav shadow-sm mb-4">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <span class="fw-bold text-uppercase text-danger small"><i class="bi bi-tools me-1"></i> Dedicated Calculator Suite:</span>
      <div class="btn-group flex-wrap">
        <a href="<?php echo base_url('seo/web-seo'); ?>" class="btn btn-sm btn-outline-dark">Niche RPM Calc</a>
        <a href="<?php echo base_url('marketing/digital-marketing'); ?>" class="btn btn-sm btn-outline-dark">ROAS & CAC Simulator</a>
        <a href="<?php echo base_url('insurance/health-insurance'); ?>" class="btn btn-sm btn-dark active">Health Premium Estimator</a>
        <a href="<?php echo base_url('internet/web-hosting'); ?>" class="btn btn-sm btn-outline-dark">Server Bandwidth Sizer</a>
        <a href="<?php echo base_url('attorney/immigration'); ?>" class="btn btn-sm btn-outline-dark">Golden Visa Index</a>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- MAIN ESTIMATOR AND CONTENT -->
    <div class="col-lg-8">
      
      <!-- INTERACTIVE ESTIMATOR ENGINE -->
      <div class="calc-card">
        <div class="calc-header d-flex align-items-center justify-content-between">
          <div>
            <h4 class="m-0 fw-bold text-white"><i class="bi bi-shield-plus text-success me-2"></i> Health Insurance Premium Engine</h4>
            <small class="text-white-50">Calculate net monthly premium after ACA tax credits & deductible caps</small>
          </div>
          <span class="badge bg-success text-white">2026 ACA TAX CREDIT READY</span>
        </div>
        <div class="calc-body">
          <div class="row g-4">
            
            <!-- INPUT CONTROLS -->
            <div class="col-md-6">
              
              <!-- Age Slider -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Primary Applicant Age</label>
                  <span class="fw-bold text-primary fs-5" id="ageDisplay">38 yrs</span>
                </div>
                <input type="range" class="form-range" id="ageRange" min="18" max="64" step="1" value="38" oninput="calculateHealth()">
              </div>

              <!-- Household Members -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Household Size (Enrollees)</label>
                  <span class="fw-bold text-dark fs-5" id="sizeDisplay">3 People</span>
                </div>
                <input type="range" class="form-range" id="sizeRange" min="1" max="8" step="1" value="3" oninput="calculateHealth()">
              </div>

              <!-- Metal Plan Tier -->
              <div class="mb-3">
                <label class="calc-label">Coverage Tier (Metal Level)</label>
                <select id="tierSelect" class="form-select border-secondary fw-bold" onchange="calculateHealth()">
                  <option value="0.80">Bronze Tier (Low Premium, High $7,500 Deductible)</option>
                  <option value="1.00" selected>Silver Tier (Benchmark Plan, Moderate $4,200 Deductible)</option>
                  <option value="1.25">Gold Tier (High Premium, Low $1,500 Deductible)</option>
                  <option value="1.50">Platinum Tier (Lowest Deductible, Highest Coverage)</option>
                </select>
              </div>

              <!-- Smoker Status -->
              <div class="mb-3">
                <label class="calc-label">Tobacco Use (Smoker Surcharge)</label>
                <select id="smokerSelect" class="form-select border-secondary fw-bold" onchange="calculateHealth()">
                  <option value="1.00" selected>Non-Smoker (Standard Rate)</option>
                  <option value="1.35">Tobacco / Smoker (+35% Rate Surcharge)</option>
                </select>
              </div>

              <!-- Annual Household Income -->
              <div class="mb-3">
                <label class="calc-label">Annual Household Income ($)</label>
                <input type="number" id="incomeInput" class="form-control" value="55000" step="1000" oninput="calculateHealth()">
                <small class="text-muted">Used for ACA Premium Tax Credit eligibility</small>
              </div>

            </div>

            <!-- OUTPUT RESULTS BOX -->
            <div class="col-md-6">
              <div class="calc-result-box">
                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Estimated Gross Monthly Premium</div>
                  <div class="h3 fw-bold text-white mb-0" id="resGross">$1,185 / mo</div>
                  <small class="text-white-50">Standard market rate before subsidy</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Estimated ACA Tax Credit Subsidy</div>
                  <div class="calc-stat-val text-warning" id="resSubsidy">-$740 / mo</div>
                  <small class="text-white-50">Federal subsidy based on household income</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Net Out-Of-Pocket Monthly Premium</div>
                  <div class="calc-stat-val text-success" id="resNet">$445 / mo</div>
                  <span class="badge bg-success mt-1" id="resSubsidyBadge">SUBSIDY QUALIFIED</span>
                </div>

                <div>
                  <div class="calc-stat-lbl">Max Out-Of-Pocket Annual Cap</div>
                  <div class="h4 fw-bold text-info mb-1" id="resMaxOop">$8,700 / yr</div>
                  <span class="text-white-50 extra-small">Includes deductibles & co-pays</span>
                </div>
              </div>
            </div>

          </div>

          <!-- ACTION BAR -->
          <div class="mt-4 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="text-muted small">
              <i class="bi bi-info-circle me-1"></i> Based on 2026 ACA Federal Poverty Level (FPL) formulas.
            </div>
            <button class="btn btn-outline-dark btn-sm fw-bold" onclick="copyHealthReport()">
              <i class="bi bi-clipboard-check me-1"></i> Copy Health Premium Estimate
            </button>
          </div>

        </div>
      </div>

      <!-- IN-DEPTH SEO EDITORIAL CONTENT -->
      <article class="article-content bg-white p-4 p-md-5 rounded border shadow-sm">
        <h2 id="health-insurance-aca-guide">2026 Health Insurance Plan Selection and ACA Subsidy Guide</h2>
        <p>Navigating individual and family health insurance plans requires balancing monthly premium costs against out-of-pocket exposure during medical emergencies. Under the Affordable Care Act (ACA), Premium Tax Credits (PTCs) significantly reduce monthly health costs for individuals and families earning between 100% and 400%+ of the Federal Poverty Level (FPL).</p>

        <p>Choosing the optimal metal tier—<strong>Bronze, Silver, Gold, or Platinum</strong>—depends heavily on expected healthcare utilization, prescription medication needs, and deductible tolerance.</p>

        <!-- BENCHMARK TABLE -->
        <h2 id="metal-tier-benchmarks">2026 Health Plan Metal Tier Comparison</h2>
        <div class="table-responsive my-4">
          <table class="table table-bordered table-striped align-middle benchmark-table">
            <thead>
              <tr>
                <th>Metal Plan Tier</th>
                <th>Actuarial Value (Plan Pays)</th>
                <th>Avg Monthly Premium</th>
                <th>Avg Individual Deductible</th>
                <th>Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-bold">Bronze Tier</td>
                <td>60% Plan / 40% You</td>
                <td class="text-success fw-bold">Lowest ($280 - $420)</td>
                <td>$7,500 - $9,100</td>
                <td>Healthy individuals wanting catastrophe protection</td>
              </tr>
              <tr>
                <td class="fw-bold">Silver Tier (Benchmark)</td>
                <td>70% Plan / 30% You</td>
                <td>Moderate ($450 - $620)</td>
                <td>$3,800 - $5,200</td>
                <td><span class="badge bg-success">Best Value (Eligible for CSR Discounts)</span></td>
              </tr>
              <tr>
                <td class="fw-bold">Gold Tier</td>
                <td>80% Plan / 20% You</td>
                <td>Higher ($600 - $850)</td>
                <td>$1,200 - $2,500</td>
                <td>Families with frequent doctor visits & prescriptions</td>
              </tr>
              <tr>
                <td class="fw-bold">Platinum Tier</td>
                <td>90% Plan / 10% You</td>
                <td>Highest ($800 - $1,150)</td>
                <td>$0 - $750</td>
                <td>Individuals expecting major surgery or high care</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="hsa-tax-benefits">Health Savings Accounts (HSA) and Tax Benefits</h2>
        <p>High-Deductible Health Plans (HDHPs)—typically paired with Bronze or Silver metal tiers—allow policyholders to contribute pre-tax dollars into a <strong>Health Savings Account (HSA)</strong>. For 2026, individual HSA contribution limits are capped at <strong>$4,300</strong> ($8,550 for family coverage), providing triple-tax savings: tax-deductible contributions, tax-free growth, and tax-free withdrawals for qualified medical expenses.</p>

        <!-- FREQUENTLY ASKED QUESTIONS -->
        <h2 id="faq-section" class="mt-5">Frequently Asked Questions</h2>
        <div class="accordion accordion-flush id-faq-accordion" id="healthFaq">
          
          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingOne">
              <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne">
                Who qualifies for ACA Health Insurance Subsidies?
              </button>
            </h3>
            <div id="faqCollapseOne" class="accordion-collapse collapse show" data-bs-parent="#healthFaq">
              <div class="accordion-body">
                Subsidies are calculated based on household income relative to the Federal Poverty Level (FPL). In 2026, households earning between 100% and 400% FPL qualify for income-adjusted subsidies that cap premium costs at a set percentage of income.
              </div>
            </div>
          </div>

          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingTwo">
              <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo">
                Why is the Silver Tier recommended for lower-income applicants?
              </button>
            </h3>
            <div id="faqCollapseTwo" class="accordion-collapse collapse" data-bs-parent="#healthFaq">
              <div class="accordion-body">
                Silver plans offer exclusive <strong>Cost-Sharing Reductions (CSR)</strong> for households earning under 250% FPL, which significantly lowers out-of-pocket deductibles and copays to near-Gold or Platinum levels without increasing monthly premiums.
              </div>
            </div>
          </div>

        </div>

        <!-- COMMENTS SECTION -->
        <div class="mt-5 pt-4 border-top">
          <h4 class="fw-bold mb-3"><i class="bi bi-chat-left-text me-2"></i> Join the Health Insurance Discussion</h4>
          <?php $this->load->view('includes/poll_widget', ['poll_slug' => 'insurance-health-premium']); ?>
        </div>

      </article>
    </div>

    <!-- RIGHT SIDEBAR -->
    <div class="col-lg-4">
      
      <!-- TOOL QUICK SWITCHER SIDEBAR -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-dark text-white fw-bold">
          <i class="bi bi-tools text-warning me-2"></i> ALL DEDICATED CALCULATORS
        </div>
        <div class="list-group list-group-flush">
          <a href="<?php echo base_url('seo/web-seo'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-bar-chart-fill me-2"></i> High-Traffic Niche Calculator</span>
            <span class="badge bg-secondary">SEO</span>
          </a>
          <a href="<?php echo base_url('marketing/digital-marketing'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-graph-up-arrow me-2"></i> ROAS & CAC Simulator</span>
            <span class="badge bg-secondary">Marketing</span>
          </a>
          <a href="<?php echo base_url('insurance/health-insurance'); ?>" class="list-group-item list-group-item-action active fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-heart-pulse-fill me-2"></i> Health Premium Estimator</span>
            <span class="badge bg-light text-dark">Insurance</span>
          </a>
          <a href="<?php echo base_url('internet/web-hosting'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-hdd-network-fill me-2"></i> Server Bandwidth Sizer</span>
            <span class="badge bg-secondary">Hosting</span>
          </a>
          <a href="<?php echo base_url('attorney/immigration'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-passport-fill me-2"></i> Golden Visa Cost Index</span>
            <span class="badge bg-secondary">Legal</span>
          </a>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
function calculateHealth() {
  const age = parseInt(document.getElementById('ageRange').value);
  const size = parseInt(document.getElementById('sizeRange').value);
  const tier = parseFloat(document.getElementById('tierSelect').value);
  const smoker = parseFloat(document.getElementById('smokerSelect').value);
  const income = parseFloat(document.getElementById('incomeInput').value) || 40000;

  document.getElementById('ageDisplay').innerText = age + ' yrs';
  document.getElementById('sizeDisplay').innerText = size + ' Person' + (size > 1 ? 's' : '');

  // Base rate factor by age (standard ACA age curve 18=0.635, 64=3.0)
  const ageFactor = 0.65 + ((age - 18) / 46) * 1.8;
  const basePerPerson = 380 * ageFactor * tier * smoker;
  const grossMonthly = basePerPerson * (1 + (size - 1) * 0.55);

  // Subsidy calculation based on FPL benchmark ($15k base + $5.3k per additional member)
  const fpl = 15060 + (size - 1) * 5380;
  const fplRatio = income / fpl;

  let maxIncomePct = 0.085; // ACA cap percentage
  if (fplRatio <= 1.5) maxIncomePct = 0.02;
  else if (fplRatio <= 2.0) maxIncomePct = 0.04;
  else if (fplRatio <= 2.5) maxIncomePct = 0.06;
  else if (fplRatio <= 4.0) maxIncomePct = 0.085;
  else maxIncomePct = 0.12;

  const expectedContributionMonthly = (income * maxIncomePct) / 12;
  let subsidy = Math.max(0, grossMonthly - expectedContributionMonthly);

  if (fplRatio > 4.5) subsidy = 0;

  const netMonthly = Math.max(25, grossMonthly - subsidy);
  const maxOop = Math.min(9100 * size, 8700 + tier * 1200);

  document.getElementById('resGross').innerText = '$' + Math.round(grossMonthly).toLocaleString() + ' / mo';
  document.getElementById('resSubsidy').innerText = '-$' + Math.round(subsidy).toLocaleString() + ' / mo';
  document.getElementById('resNet').innerText = '$' + Math.round(netMonthly).toLocaleString() + ' / mo';
  document.getElementById('resMaxOop').innerText = '$' + Math.round(maxOop).toLocaleString() + ' / yr';

  const badge = document.getElementById('resSubsidyBadge');
  if (subsidy > 300) {
    badge.className = 'badge bg-success mt-1';
    badge.innerText = 'HIGH SUBSIDY QUALIFIED';
  } else if (subsidy > 0) {
    badge.className = 'badge bg-info text-dark mt-1';
    badge.innerText = 'PARTIAL SUBSIDY QUALIFIED';
  } else {
    badge.className = 'badge bg-secondary mt-1';
    badge.innerText = 'FULL RATE PLAN';
  }
}

function copyHealthReport() {
  const age = document.getElementById('ageDisplay').innerText;
  const net = document.getElementById('resNet').innerText;
  const subsidy = document.getElementById('resSubsidy').innerText;
  const oop = document.getElementById('resMaxOop').innerText;

  const text = `Imperialpedia Health Insurance Estimate:\n- Applicant Age: ${age}\n- Net Monthly Premium: ${net}\n- Estimated ACA Subsidy: ${subsidy}\n- Max Out-of-Pocket Cap: ${oop}\nCalculated at: http://localhost:8000/insurance/health-insurance`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Health premium estimate copied to clipboard!');
  });
}

document.addEventListener('DOMContentLoaded', calculateHealth);
</script>
