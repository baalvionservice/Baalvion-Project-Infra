<?php
/**
 * Imperialpedia — ROAS & CAC Profitability Simulator
 * Dedicated Standalone URL Page: /marketing/digital-marketing
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
   background: linear-gradient(135deg, #091e3a 0%, #2f80ed 100%);
   color: #ffffff;
   border-bottom: 4px solid #f2994a;
   padding: 42px 0 32px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: #f2994a;
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
   color: #cbd5e1;
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
   border-bottom: 3px solid #f2994a;
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
   border-left: 5px solid #f2994a;
}

.calc-stat-val {
   font-family: var(--p6-font-headline);
   font-size: 2.2rem;
   font-weight: 700;
   color: #f2994a;
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
      <i class="bi bi-graph-up-arrow"></i> DIGITAL MARKETING & PAID ACQUISITION &bull; DEDICATED SUITE
    </div>
    <h1 class="p6-main-title">ROAS & CAC Performance Profitability Simulator</h1>
    <div class="p6-meta-bar">
      <span><i class="bi bi-clock-history"></i> Updated September 2026</span>
      <span><i class="bi bi-shield-check"></i> Google & Meta Ads Benchmark Calibrated</span>
      <span><i class="bi bi-calculator"></i> Real-Time Multi-Channel Projections</span>
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
        <a href="<?php echo base_url('marketing/digital-marketing'); ?>" class="btn btn-sm btn-dark active">ROAS & CAC Simulator</a>
        <a href="<?php echo base_url('insurance/health-insurance'); ?>" class="btn btn-sm btn-outline-dark">Health Premium Estimator</a>
        <a href="<?php echo base_url('internet/web-hosting'); ?>" class="btn btn-sm btn-outline-dark">Server Bandwidth Sizer</a>
        <a href="<?php echo base_url('attorney/immigration'); ?>" class="btn btn-sm btn-outline-dark">Golden Visa Index</a>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- MAIN SIMULATOR AND CONTENT -->
    <div class="col-lg-8">
      
      <!-- INTERACTIVE SIMULATOR ENGINE -->
      <div class="calc-card">
        <div class="calc-header d-flex align-items-center justify-content-between">
          <div>
            <h4 class="m-0 fw-bold text-white"><i class="bi bi-sliders text-warning me-2"></i> Interactive ROAS & CAC Simulator Engine</h4>
            <small class="text-white-50">Model ad spend payback, customer acquisition cost, & LTV ratios</small>
          </div>
          <span class="badge bg-warning text-dark">PAID GROWTH SIMULATOR</span>
        </div>
        <div class="calc-body">
          <div class="row g-4">
            
            <!-- INPUT CONTROLS -->
            <div class="col-md-6">
              
              <!-- Channel Preset -->
              <div class="mb-3">
                <label class="calc-label">Select Primary Ad Channel</label>
                <select id="channelSelect" class="form-select form-select-lg border-secondary fw-bold" onchange="updateChannelPreset()">
                  <option value="2.80" selected>Google Search Ads (Avg CPC: $2.80)</option>
                  <option value="1.65">Meta Ads (Instagram / FB) (Avg CPC: $1.65)</option>
                  <option value="4.50">LinkedIn B2B Ads (Avg CPC: $4.50)</option>
                  <option value="0.95">TikTok Video Ads (Avg CPC: $0.95)</option>
                  <option value="0.55">Programmatic Display (Avg CPC: $0.55)</option>
                </select>
              </div>

              <!-- Monthly Ad Spend -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Monthly Ad Spend ($)</label>
                  <span class="fw-bold text-primary fs-5" id="spendDisplay">$15,000</span>
                </div>
                <input type="range" class="form-range" id="spendRange" min="1000" max="200000" step="1000" value="15000" oninput="calculateRoas()">
              </div>

              <!-- CPC Input -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Cost Per Click (CPC in $)</label>
                  <span class="fw-bold text-success fs-5" id="cpcDisplay">$2.80</span>
                </div>
                <input type="range" class="form-range" id="cpcRange" min="0.20" max="15.00" step="0.10" value="2.80" oninput="calculateRoas()">
              </div>

              <!-- Landing Page Conv Rate -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Landing Page Conv Rate (%)</label>
                  <span class="fw-bold text-dark fs-5" id="cvrDisplay">3.5%</span>
                </div>
                <input type="range" class="form-range" id="cvrRange" min="0.5" max="15.0" step="0.1" value="3.5" oninput="calculateRoas()">
              </div>

              <!-- Customer LTV / AOV -->
              <div class="mb-3">
                <label class="calc-label">Customer Lifetime Value / AOV ($)</label>
                <input type="number" id="ltvInput" class="form-control" value="380" step="10" oninput="calculateRoas()">
              </div>

            </div>

            <!-- OUTPUT RESULTS BOX -->
            <div class="col-md-6">
              <div class="calc-result-box">
                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Customer Acquisition Cost (CAC)</div>
                  <div class="calc-stat-val text-warning" id="resCac">$80.00</div>
                  <small class="text-white-50" id="resAcquiredCount">187 new customers acquired / mo</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Return On Ad Spend (ROAS)</div>
                  <div class="calc-stat-val text-success" id="resRoas">4.75x (475%)</div>
                  <small class="text-white-50">Gross Revenue generated per $1 spent</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">LTV : CAC Health Ratio</div>
                  <div class="h3 fw-bold text-info mb-0" id="resLtvRatio">4.75 : 1</div>
                  <span class="badge bg-success mt-1" id="resLtvBadge">ELITE EFFICIENCY (&gt;3.0x)</span>
                </div>

                <div>
                  <div class="calc-stat-lbl">Net Gross Profit After Ad Spend</div>
                  <div class="h4 fw-bold text-white mb-1" id="resNetProfit">$56,250 / mo</div>
                  <span class="text-white-50 extra-small">Gross Revenue ($71,250) - Ad Spend ($15,000)</span>
                </div>
              </div>
            </div>

          </div>

          <!-- ACTION BAR -->
          <div class="mt-4 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="text-muted small">
              <i class="bi bi-info-circle me-1"></i> Benchmark updated with 2026 Google Ads & Meta CAPI algorithms.
            </div>
            <button class="btn btn-outline-dark btn-sm fw-bold" onclick="copyRoasReport()">
              <i class="bi bi-clipboard-check me-1"></i> Copy ROAS Simulation Report
            </button>
          </div>

        </div>
      </div>

      <!-- IN-DEPTH SEO EDITORIAL CONTENT -->
      <article class="article-content bg-white p-4 p-md-5 rounded border shadow-sm">
        <h2 id="roas-cac-guide">The 2026 Paid Media Scaling Playbook: Master ROAS and CAC</h2>
        <p>In digital marketing, scaling ad spend without eroding profitability is the ultimate goal for growth leads and media buyers. With escalating ad costs across Meta, Google, TikTok, and LinkedIn, relying solely on surface-level ROAS (Return on Ad Spend) can be misleading. A campaign boasting a 4.0x ROAS might still be unprofitable if gross product margins or inventory fulfillment costs are high.</p>

        <p>Modern performance marketing demands a dual evaluation framework combining <strong>CAC (Customer Acquisition Cost)</strong>, <strong>LTV (Customer Lifetime Value)</strong>, and <strong>Merchandising Margin</strong> to calculate true <em>MER (Marketing Efficiency Ratio)</em>.</p>

        <!-- BENCHMARK TABLE -->
        <h2 id="industry-cac-benchmarks">2026 Industry CAC & LTV Benchmark Standards</h2>
        <div class="table-responsive my-4">
          <table class="table table-bordered table-striped align-middle benchmark-table">
            <thead>
              <tr>
                <th>Industry Sector</th>
                <th>Target LTV:CAC Ratio</th>
                <th>Avg Benchmark CAC</th>
                <th>Target ROAS Threshold</th>
                <th>Primary Scaling Channel</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-bold">B2B SaaS / Enterprise</td>
                <td>4.0x - 6.0x</td>
                <td>$350 - $1,200</td>
                <td>2.5x (Year 1)</td>
                <td>LinkedIn Ads + Google Search</td>
              </tr>
              <tr>
                <td class="fw-bold">E-Commerce (DTC Retail)</td>
                <td>3.0x - 4.5x</td>
                <td>$25 - $75</td>
                <td class="text-success fw-bold">3.5x - 5.0x</td>
                <td>Meta Advantage+ & TikTok Shopping</td>
              </tr>
              <tr>
                <td class="fw-bold">Lead Generation (Legal/Insurance)</td>
                <td>3.5x - 5.0x</td>
                <td>$80 - $280</td>
                <td>3.0x</td>
                <td>Google Local Services & High-Intent Search</td>
              </tr>
              <tr>
                <td class="fw-bold">Financial Services & Fintech</td>
                <td>4.5x - 7.0x</td>
                <td>$120 - $450</td>
                <td>4.0x</td>
                <td>Affiliate Networks + Programmatic Bidding</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="first-party-data-capi">Conversion API (CAPI) and First-Party Data Attribution</h2>
        <p>With third-party cookie deprecation and privacy updates across iOS and Android, pixel-based ad tracking has suffered a 20–35% attribution loss. Top marketing organizations overcome this by deploying server-side Conversion APIs (CAPI), matching offline CRM data with ad network events.</p>

        <h2 id="lowering-cac-checklist">5 Proven Strategies to Lower CAC by 30%+ in 2026</h2>
        <ol class="lh-lg">
          <li><strong>Optimize Landing Page Velocity:</strong> Reducing page load time from 3 seconds to 1 second increases mobile conversion rate by up to 27%.</li>
          <li><strong>Implement Dynamic Creative Optimization (DCO):</strong> Test 10+ hook variations and AI-generated video angles per ad set.</li>
          <li><strong>Leverage Micro-Conversions:</strong> Use interactive quizzes and lead magnet calculators to capture email and phone leads before making the direct product offer.</li>
          <li><strong>Maximize AOV via One-Click Upsells:</strong> Raising Average Order Value by 20% immediately improves your ROAS without increasing ad spend.</li>
          <li><strong>Segment Retargeting by Recency:</strong> Direct 80% of retargeting budget toward users who engaged within the last 48 hours.</li>
        </ol>

        <!-- FREQUENTLY ASKED QUESTIONS -->
        <h2 id="faq-section" class="mt-5">Frequently Asked Questions</h2>
        <div class="accordion accordion-flush id-faq-accordion" id="roasFaq">
          
          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingOne">
              <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne">
                What is a good ROAS for digital advertising?
              </button>
            </h3>
            <div id="faqCollapseOne" class="accordion-collapse collapse show" data-bs-parent="#roasFaq">
              <div class="accordion-body">
                A "good" ROAS depends on your profit margin. For e-commerce brands with 50% margins, a <strong>4.0x ROAS (400%)</strong> is considered healthy. High-margin SaaS products can scale profitably at 2.5x ROAS due to strong subscription retention.
              </div>
            </div>
          </div>

          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingTwo">
              <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo">
                How do I calculate Customer Acquisition Cost (CAC)?
              </button>
            </h3>
            <div id="faqCollapseTwo" class="accordion-collapse collapse" data-bs-parent="#roasFaq">
              <div class="accordion-body">
                <code>CAC = Total Marketing & Ad Spend / Total New Customers Acquired</code>. For example, if you spend $10,000 on Google Ads and gain 100 customers, your CAC is $100.
              </div>
            </div>
          </div>

        </div>

        <!-- COMMENTS SECTION -->
        <div class="mt-5 pt-4 border-top">
          <h4 class="fw-bold mb-3"><i class="bi bi-chat-left-text me-2"></i> Join the Digital Marketing Discussion</h4>
          <?php $this->load->view('includes/poll_widget', ['poll_slug' => 'marketing-roas-cac']); ?>
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
          <a href="<?php echo base_url('marketing/digital-marketing'); ?>" class="list-group-item list-group-item-action active fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-graph-up-arrow me-2"></i> ROAS & CAC Simulator</span>
            <span class="badge bg-light text-dark">Marketing</span>
          </a>
          <a href="<?php echo base_url('insurance/health-insurance'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-heart-pulse-fill me-2"></i> Health Premium Estimator</span>
            <span class="badge bg-secondary">Insurance</span>
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

      <!-- AD BANNER PLACEHOLDER -->
      <div class="card bg-light border text-center p-3 mb-4">
        <span class="text-uppercase text-muted extra-small fw-bold mb-1">Sponsored Advertisement</span>
        <div class="py-4 border border-dashed rounded text-muted fw-bold">
          [ 300 x 250 AdSense Ad Slot ]
        </div>
      </div>

    </div>
  </div>
</div>

<script>
function updateChannelPreset() {
  const select = document.getElementById('channelSelect');
  const cpcRange = document.getElementById('cpcRange');
  cpcRange.value = select.value;
  calculateRoas();
}

function calculateRoas() {
  const spend = parseFloat(document.getElementById('spendRange').value);
  const cpc = parseFloat(document.getElementById('cpcRange').value);
  const cvr = parseFloat(document.getElementById('cvrRange').value) / 100;
  const ltv = parseFloat(document.getElementById('ltvInput').value) || 0;

  document.getElementById('spendDisplay').innerText = '$' + spend.toLocaleString();
  document.getElementById('cpcDisplay').innerText = '$' + cpc.toFixed(2);
  document.getElementById('cvrDisplay').innerText = (cvr * 100).toFixed(1) + '%';

  const clicks = spend / cpc;
  const customers = clicks * cvr;
  const cac = customers > 0 ? spend / customers : 0;
  const grossRev = customers * ltv;
  const roas = spend > 0 ? grossRev / spend : 0;
  const ltvRatio = cac > 0 ? ltv / cac : 0;
  const netProfit = grossRev - spend;

  document.getElementById('resCac').innerText = '$' + cac.toFixed(2);
  document.getElementById('resAcquiredCount').innerText = Math.round(customers).toLocaleString() + ' new customers acquired / mo';
  document.getElementById('resRoas').innerText = roas.toFixed(2) + 'x (' + Math.round(roas * 100) + '%)';
  document.getElementById('resLtvRatio').innerText = ltvRatio.toFixed(2) + ' : 1';
  document.getElementById('resNetProfit').innerText = '$' + Math.round(netProfit).toLocaleString() + ' / mo';

  const badge = document.getElementById('resLtvBadge');
  if (ltvRatio >= 4.0) {
    badge.className = 'badge bg-success mt-1';
    badge.innerText = 'ELITE EFFICIENCY (>4.0x)';
  } else if (ltvRatio >= 3.0) {
    badge.className = 'badge bg-info text-dark mt-1';
    badge.innerText = 'HEALTHY EFFICIENCY (3.0x - 4.0x)';
  } else if (ltvRatio >= 1.5) {
    badge.className = 'badge bg-warning text-dark mt-1';
    badge.innerText = 'MODERATE / RISKY (1.5x - 3.0x)';
  } else {
    badge.className = 'badge bg-danger mt-1';
    badge.innerText = 'UNPROFITABLE (<1.5x)';
  }
}

function copyRoasReport() {
  const spend = document.getElementById('spendDisplay').innerText;
  const cac = document.getElementById('resCac').innerText;
  const roas = document.getElementById('resRoas').innerText;
  const net = document.getElementById('resNetProfit').innerText;

  const text = `Imperialpedia ROAS & CAC Simulation:\n- Monthly Ad Spend: ${spend}\n- Customer Acquisition Cost (CAC): ${cac}\n- ROAS: ${roas}\n- Net Monthly Profit: ${net}\nCalculated at: http://localhost:8000/marketing/digital-marketing`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('ROAS simulation report copied to clipboard!');
  });
}

document.addEventListener('DOMContentLoaded', calculateRoas);
</script>
