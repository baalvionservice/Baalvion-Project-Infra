<?php
/**
 * Imperialpedia — Global Golden Visa & Residency Investment Cost Index
 * Dedicated Standalone URL Page: /attorney/immigration
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
   background: linear-gradient(135deg, #451a03 0%, #78350f 100%);
   color: #ffffff;
   border-bottom: 4px solid #f59e0b;
   padding: 42px 0 32px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: #f59e0b;
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
   color: #fde68a;
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
   border-bottom: 3px solid #f59e0b;
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
   border-left: 5px solid #f59e0b;
}

.calc-stat-val {
   font-family: var(--p6-font-headline);
   font-size: 2.2rem;
   font-weight: 700;
   color: #f59e0b;
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
      <i class="bi bi-passport"></i> IMMIGRATION LAW & INVESTMENT MIGRATION &bull; DEDICATED SUITE
    </div>
    <h1 class="p6-main-title">Golden Visa & Global Residency Investment Index</h1>
    <div class="p6-meta-bar">
      <span><i class="bi bi-clock-history"></i> Updated September 2026</span>
      <span><i class="bi bi-shield-check"></i> Sovereign Program Benchmark Calibrated</span>
      <span><i class="bi bi-calculator"></i> Real-Time Turnkey Cost Calculator</span>
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
        <a href="<?php echo base_url('insurance/health-insurance'); ?>" class="btn btn-sm btn-outline-dark">Health Premium Estimator</a>
        <a href="<?php echo base_url('internet/web-hosting'); ?>" class="btn btn-sm btn-outline-dark">Server Bandwidth Sizer</a>
        <a href="<?php echo base_url('attorney/immigration'); ?>" class="btn btn-sm btn-dark active">Golden Visa Index</a>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- MAIN CALCULATOR AND CONTENT -->
    <div class="col-lg-8">
      
      <!-- INTERACTIVE INDEX ENGINE -->
      <div class="calc-card">
        <div class="calc-header d-flex align-items-center justify-content-between">
          <div>
            <h4 class="m-0 fw-bold text-white"><i class="bi bi-globe-americas text-warning me-2"></i> Golden Visa Investment Index Engine</h4>
            <small class="text-white-50">Compare capital thresholds, government legal fees, & passport timelines</small>
          </div>
          <span class="badge bg-warning text-dark">INVESTMENT MIGRATION INDEX</span>
        </div>
        <div class="calc-body">
          <div class="row g-4">
            
            <!-- INPUT CONTROLS -->
            <div class="col-md-6">
              
              <!-- Destination Country Dropdown -->
              <div class="mb-3">
                <label class="calc-label">Select Destination Country</label>
                <select id="countrySelect" class="form-select form-select-lg border-secondary fw-bold" onchange="updateCountryPreset()">
                  <option value="portugal" selected>Portugal (Fund Transfer €500,000)</option>
                  <option value="spain">Spain (Real Estate €500,000)</option>
                  <option value="greece">Greece (Real Estate €250,000 - €800,000)</option>
                  <option value="uae">UAE / Dubai (10-Yr Golden Visa AED 2,000,000)</option>
                  <option value="malta">Malta MPRP (Residency €150,000)</option>
                  <option value="caribbean">Caribbean CBI (St Kitts / Grenada $250,000)</option>
                  <option value="italy">Italy Golden Visa (€250,000 Innovation)</option>
                </select>
              </div>

              <!-- Investment Pathway -->
              <div class="mb-3">
                <label class="calc-label">Investment Pathway</label>
                <select id="pathwaySelect" class="form-select border-secondary fw-bold" onchange="calculateVisa()">
                  <option value="fund" selected>Venture Capital / Investment Fund</option>
                  <option value="real_estate">Real Estate Purchase</option>
                  <option value="donation">Government Donation / Capital Grant</option>
                </select>
              </div>

              <!-- Family Dependents -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Family Dependents Included</label>
                  <span class="fw-bold text-primary fs-5" id="depDisplay">Spouse + 2 Children</span>
                </div>
                <input type="range" class="form-range" id="depRange" min="0" max="6" step="1" value="3" oninput="calculateVisa()">
              </div>

            </div>

            <!-- OUTPUT RESULTS BOX -->
            <div class="col-md-6">
              <div class="calc-result-box">
                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Required Base Investment</div>
                  <div class="calc-stat-val text-warning" id="resBaseInv">€500,000</div>
                  <small class="text-white-50" id="resCountryLabel">Portugal Golden Visa Fund</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Govt & Due Diligence Legal Fees</div>
                  <div class="h3 fw-bold text-white mb-0" id="resFees">€32,500</div>
                  <small class="text-white-50">Includes legal, biometric & processing fees</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Total Turnkey Cost</div>
                  <div class="calc-stat-val text-success" id="resTotalCost">€532,500</div>
                </div>

                <div>
                  <div class="calc-stat-lbl">Physical Stay & Passport Timeline</div>
                  <div class="h5 fw-bold text-info mb-1" id="resStayTimeline">7 Days/yr &bull; 5 Years to EU Passport</div>
                  <span class="badge bg-success" id="resEuBadge">EU SCHENGEN FREEDOM</span>
                </div>
              </div>
            </div>

          </div>

          <!-- ACTION BAR -->
          <div class="mt-4 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="text-muted small">
              <i class="bi bi-info-circle me-1"></i> Data updated for 2026 immigration law revisions across EU & Middle East.
            </div>
            <button class="btn btn-outline-dark btn-sm fw-bold" onclick="copyVisaReport()">
              <i class="bi bi-clipboard-check me-1"></i> Copy Golden Visa Cost Breakdown
            </button>
          </div>

        </div>
      </div>

      <!-- IN-DEPTH SEO EDITORIAL CONTENT -->
      <article class="article-content bg-white p-4 p-md-5 rounded border shadow-sm">
        <h2 id="golden-visa-guide">The 2026 Global Golden Visa & Investment Migration Landscape</h2>
        <p>Investment migration programs—commonly referred to as <strong>Golden Visas</strong>—enable high-net-worth individuals and families to secure legal residency or full citizenship by investing in foreign capital funds, real estate, or government development projects. In an era of shifting tax regulations and geopolitical uncertainty, securing a secondary passport or Schengen-zone residency provides crucial plan-B mobility.</p>

        <!-- BENCHMARK TABLE -->
        <h2 id="country-comparison-table">2026 Top Golden Visa Program Comparison Matrix</h2>
        <div class="table-responsive my-4">
          <table class="table table-bordered table-striped align-middle benchmark-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Min. Investment</th>
                <th>Physical Stay Rule</th>
                <th>Schengen Access</th>
                <th>Time to Citizenship</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-bold">Portugal Golden Visa</td>
                <td class="text-success fw-bold">€500,000 (Fund)</td>
                <td>7 Days per Year</td>
                <td><span class="badge bg-success">Yes (Full Schengen)</span></td>
                <td>5 Years</td>
              </tr>
              <tr>
                <td class="fw-bold">Greece Golden Visa</td>
                <td>€250,000 - €800,000</td>
                <td>0 Days (No stay required)</td>
                <td><span class="badge bg-success">Yes (Full Schengen)</span></td>
                <td>7 Years</td>
              </tr>
              <tr>
                <td class="fw-bold">UAE / Dubai 10-Yr Visa</td>
                <td>AED 2,000,000 (~$545k)</td>
                <td>0 Days (1 visit per 6 mos)</td>
                <td>No (GCC Freedom)</td>
                <td>Residency Only (Renewable)</td>
              </tr>
              <tr>
                <td class="fw-bold">Malta MPRP</td>
                <td>€150,000 (Donation + Rent)</td>
                <td>0 Days</td>
                <td><span class="badge bg-success">Yes (Full Schengen)</span></td>
                <td>Direct Permanent Residency</td>
              </tr>
              <tr>
                <td class="fw-bold">Caribbean CBI (St Kitts)</td>
                <td>$250,000 (Donation)</td>
                <td>0 Days</td>
                <td>Visa-Free to 150+ Countries</td>
                <td>Direct Citizenship (3-6 Mos)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="due-diligence-aml">Anti-Money Laundering (AML) and Source of Funds Verification</h2>
        <p>In response to EU regulatory guidelines, all legitimate Golden Visa programs enforce stringent Anti-Money Laundering (AML) due diligence checks. Applicants must provide transparent documentation tracing the origin of investment funds (e.g., dividends, property sale proceeds, inheritance, or corporate distributions).</p>

        <!-- FREQUENTLY ASKED QUESTIONS -->
        <h2 id="faq-section" class="mt-5">Frequently Asked Questions</h2>
        <div class="accordion accordion-flush id-faq-accordion" id="visaFaq">
          
          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingOne">
              <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne">
                Can I still get a Golden Visa through Real Estate in Portugal?
              </button>
            </h3>
            <div id="faqCollapseOne" class="accordion-collapse collapse show" data-bs-parent="#visaFaq">
              <div class="accordion-body">
                Under the revised legislation, direct residential real estate is no longer eligible for the Portuguese Golden Visa. However, <strong>€500,000 investments in regulated Portuguese venture capital and private equity funds</strong> remain fully active and compliant.
              </div>
            </div>
          </div>

          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingTwo">
              <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo">
                Are family members included in the Golden Visa application?
              </button>
            </h3>
            <div id="faqCollapseTwo" class="accordion-collapse collapse" data-bs-parent="#visaFaq">
              <div class="accordion-body">
                Yes! Most major programs allow the primary applicant to include a spouse, dependent children up to age 26 (if full-time students), and dependent elderly parents over age 65 under a single investment family application.
              </div>
            </div>
          </div>

        </div>

        <!-- COMMENTS SECTION -->
        <div class="mt-5 pt-4 border-top">
          <h4 class="fw-bold mb-3"><i class="bi bi-chat-left-text me-2"></i> Join the Investment Migration Discussion</h4>
          <?php $this->load->view('includes/poll_widget', ['poll_slug' => 'attorney-golden-visa']); ?>
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
          <a href="<?php echo base_url('insurance/health-insurance'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-heart-pulse-fill me-2"></i> Health Premium Estimator</span>
            <span class="badge bg-secondary">Insurance</span>
          </a>
          <a href="<?php echo base_url('internet/web-hosting'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-hdd-network-fill me-2"></i> Server Bandwidth Sizer</span>
            <span class="badge bg-secondary">Hosting</span>
          </a>
          <a href="<?php echo base_url('attorney/immigration'); ?>" class="list-group-item list-group-item-action active fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-passport-fill me-2"></i> Golden Visa Cost Index</span>
            <span class="badge bg-light text-dark">Legal</span>
          </a>
        </div>
      </div>

    </div>
  </div>
</div>

<script>
const countryData = {
  portugal: { name: 'Portugal Golden Visa Fund', base: 500000, curr: '€', feePerDep: 4500, stay: '7 Days/yr', citizenship: '5 Years to EU Passport', badge: 'EU SCHENGEN FREEDOM' },
  spain: { name: 'Spain Real Estate Visa', base: 500000, curr: '€', feePerDep: 3500, stay: '0 Days required', citizenship: '10 Years to EU Passport', badge: 'EU SCHENGEN FREEDOM' },
  greece: { name: 'Greece Real Estate Visa', base: 250000, curr: '€', feePerDep: 2800, stay: '0 Days required', citizenship: '7 Years to EU Passport', badge: 'EU SCHENGEN FREEDOM' },
  uae: { name: 'UAE / Dubai 10-Yr Golden Visa', base: 545000, curr: '$', feePerDep: 3000, stay: '0 Days required', citizenship: '10-Yr Renewable Residency', badge: '0% PERSONAL TAX REGIME' },
  malta: { name: 'Malta MPRP Permanent Residency', base: 150000, curr: '€', feePerDep: 10000, stay: '0 Days required', citizenship: 'Permanent Residency', badge: 'EU SCHENGEN FREEDOM' },
  caribbean: { name: 'Caribbean CBI (St Kitts / Grenada)', base: 250000, curr: '$', feePerDep: 7500, stay: '0 Days required', citizenship: '3-6 Months Direct Passport', badge: 'VISA-FREE 150+ COUNTRIES' },
  italy: { name: 'Italy Golden Visa', base: 250000, curr: '€', feePerDep: 4000, stay: '0 Days required', citizenship: '10 Years to EU Passport', badge: 'EU SCHENGEN FREEDOM' }
};

function updateCountryPreset() {
  calculateVisa();
}

function calculateVisa() {
  const countryKey = document.getElementById('countrySelect').value;
  const deps = parseInt(document.getElementById('depRange').value);
  const data = countryData[countryKey] || countryData['portugal'];

  document.getElementById('depDisplay').innerText = deps === 0 ? 'Single Applicant' : 'Spouse + ' + deps + ' Family Member' + (deps > 1 ? 's' : '');

  const baseInv = data.base;
  const legalFees = 15000 + deps * data.feePerDep;
  const totalCost = baseInv + legalFees;

  document.getElementById('resBaseInv').innerText = data.curr + baseInv.toLocaleString();
  document.getElementById('resCountryLabel').innerText = data.name;
  document.getElementById('resFees').innerText = data.curr + legalFees.toLocaleString();
  document.getElementById('resTotalCost').innerText = data.curr + totalCost.toLocaleString();
  document.getElementById('resStayTimeline').innerText = data.stay + ' • ' + data.citizenship;

  const badge = document.getElementById('resEuBadge');
  badge.innerText = data.badge;
}

function copyVisaReport() {
  const country = document.getElementById('resCountryLabel').innerText;
  const base = document.getElementById('resBaseInv').innerText;
  const total = document.getElementById('resTotalCost').innerText;
  const timeline = document.getElementById('resStayTimeline').innerText;

  const text = `Imperialpedia Golden Visa Cost Index:\n- Program: ${country}\n- Base Investment: ${base}\n- Total Turnkey Cost: ${total}\n- Requirements: ${timeline}\nCalculated at: http://localhost:8000/attorney/immigration`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Golden Visa cost breakdown copied to clipboard!');
  });
}

document.addEventListener('DOMContentLoaded', calculateVisa);
</script>
