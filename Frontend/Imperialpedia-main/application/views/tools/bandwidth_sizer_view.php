<?php
/**
 * Imperialpedia — Enterprise Server Bandwidth & CDN Sizer
 * Dedicated Standalone URL Page: /internet/web-hosting
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
   background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
   color: #ffffff;
   border-bottom: 4px solid #818cf8;
   padding: 42px 0 32px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: #818cf8;
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
   color: #c7d2fe;
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
   border-bottom: 3px solid #818cf8;
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
   border-left: 5px solid #818cf8;
}

.calc-stat-val {
   font-family: var(--p6-font-headline);
   font-size: 2.2rem;
   font-weight: 700;
   color: #818cf8;
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
      <i class="bi bi-hdd-network"></i> WEB HOSTING & CLOUD INFRASTRUCTURE &bull; DEDICATED SUITE
    </div>
    <h1 class="p6-main-title">Server Bandwidth & CDN Data Transfer Sizer</h1>
    <div class="p6-meta-bar">
      <span><i class="bi bi-clock-history"></i> Updated September 2026</span>
      <span><i class="bi bi-shield-check"></i> Enterprise Cloud Egress Calibrated</span>
      <span><i class="bi bi-calculator"></i> Real-Time Capacity Planning</span>
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
        <a href="<?php echo base_url('internet/web-hosting'); ?>" class="btn btn-sm btn-dark active">Server Bandwidth Sizer</a>
        <a href="<?php echo base_url('attorney/immigration'); ?>" class="btn btn-sm btn-outline-dark">Golden Visa Index</a>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- MAIN SIZER AND CONTENT -->
    <div class="col-lg-8">
      
      <!-- INTERACTIVE SIZER ENGINE -->
      <div class="calc-card">
        <div class="calc-header d-flex align-items-center justify-content-between">
          <div>
            <h4 class="m-0 fw-bold text-white"><i class="bi bi-server text-indigo me-2"></i> Server Bandwidth Sizer Engine</h4>
            <small class="text-white-50">Calculate total monthly data transfer (TB), peak Mbps throughput, & CDN costs</small>
          </div>
          <span class="badge bg-indigo text-white">INFRASTRUCTURE ENGINE</span>
        </div>
        <div class="calc-body">
          <div class="row g-4">
            
            <!-- INPUT CONTROLS -->
            <div class="col-md-6">
              
              <!-- Daily Active Users / Visitors -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Daily Active Users / Visitors</label>
                  <span class="fw-bold text-primary fs-5" id="dauDisplay">50,000</span>
                </div>
                <input type="range" class="form-range" id="dauRange" min="1000" max="500000" step="5000" value="50000" oninput="calculateBandwidth()">
              </div>

              <!-- Avg Page Load Size -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Avg Page / Asset Size (MB)</label>
                  <span class="fw-bold text-dark fs-5" id="sizeDisplay">2.5 MB</span>
                </div>
                <input type="range" class="form-range" id="sizeRange" min="0.2" max="20.0" step="0.1" value="2.5" oninput="calculateBandwidth()">
              </div>

              <!-- Pageviews per Session -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label class="calc-label">Pageviews per Session</label>
                  <span class="fw-bold text-secondary fs-5" id="pvSessionDisplay">3.5 pages</span>
                </div>
                <input type="range" class="form-range" id="pvSessionRange" min="1.0" max="15.0" step="0.5" value="3.5" oninput="calculateBandwidth()">
              </div>

              <!-- Peak Multiplier -->
              <div class="mb-3">
                <label class="calc-label">Peak Traffic Surge Multiplier</label>
                <select id="peakSelect" class="form-select border-secondary fw-bold" onchange="calculateBandwidth()">
                  <option value="1.5">Standard Traffic (1.5x Peak Multiplier)</option>
                  <option value="2.5" selected>Product Launch Surge (2.5x Peak Multiplier)</option>
                  <option value="4.0">Viral / Flash Sale Surge (4.0x Peak Multiplier)</option>
                </select>
              </div>

              <!-- CDN Cache Hit Ratio -->
              <div class="mb-3">
                <label class="calc-label">CDN Cache Hit Ratio (%)</label>
                <select id="cdnSelect" class="form-select border-secondary fw-bold" onchange="calculateBandwidth()">
                  <option value="0.0">No CDN / Direct Origin Server (0% Cache)</option>
                  <option value="0.75">Standard Static CDN (75% Cache Hit)</option>
                  <option value="0.90" selected>Optimized Edge CDN (90% Cache Hit)</option>
                </select>
              </div>

            </div>

            <!-- OUTPUT RESULTS BOX -->
            <div class="col-md-6">
              <div class="calc-result-box">
                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Monthly Data Transfer Egress</div>
                  <div class="calc-stat-val text-info" id="resTransfer">13.13 TB / mo</div>
                  <small class="text-white-50" id="resTotalPageviews">5.25M pageviews / month</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Continuous Bandwidth Capacity</div>
                  <div class="h3 fw-bold text-white mb-0" id="resMbps">40.5 Mbps</div>
                  <small class="text-white-50">Average steady-state throughput required</small>
                </div>

                <div class="mb-3 border-bottom border-secondary pb-2">
                  <div class="calc-stat-lbl">Peak Surge Bandwidth Required</div>
                  <div class="calc-stat-val text-warning" id="resPeakMbps">101.3 Mbps</div>
                  <span class="badge bg-warning text-dark mt-1" id="resPeakBadge">2.5x SURGE READY</span>
                </div>

                <div>
                  <div class="calc-stat-lbl">Est. Monthly Cloud Egress Cost</div>
                  <div class="h4 fw-bold text-success mb-1" id="resCost">$131 - $920 / mo</div>
                  <span class="text-white-50 extra-small" id="resCdnSavings">Cloudflare ($131) vs AWS Direct Egress ($920)</span>
                </div>
              </div>
            </div>

          </div>

          <!-- ACTION BAR -->
          <div class="mt-4 pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="text-muted small">
              <i class="bi bi-info-circle me-1"></i> Calculations calibrated for AWS EC2/CloudFront, Cloudflare, & Fastly infrastructure.
            </div>
            <button class="btn btn-outline-dark btn-sm fw-bold" onclick="copyBandwidthReport()">
              <i class="bi bi-clipboard-check me-1"></i> Copy Infrastructure Sizing Report
            </button>
          </div>

        </div>
      </div>

      <!-- IN-DEPTH SEO EDITORIAL CONTENT -->
      <article class="article-content bg-white p-4 p-md-5 rounded border shadow-sm">
        <h2 id="server-bandwidth-guide">Calculating Enterprise Server Bandwidth & CDN Requirements</h2>
        <p>In high-availability cloud architecture, accurately sizing server network interfaces and CDN data transfer capacity is essential to prevent site outages during traffic spikes while avoiding exorbitant cloud egress bills. Many engineering teams underestimate peak concurrent connection throughput, leading to packet drops, latency bottlenecks, and 504 Gateway Timeouts.</p>

        <p>Network bandwidth is measured in two key metrics: <strong>Total Data Transfer</strong> (expressed in Gigabytes or Terabytes per month) and <strong>Throughput Rate</strong> (expressed in Megabits per second, Mbps, or Gigabits per second, Gbps).</p>

        <!-- BENCHMARK TABLE -->
        <h2 id="cloud-egress-pricing-table">2026 Cloud Egress & CDN Pricing Comparison</h2>
        <div class="table-responsive my-4">
          <table class="table table-bordered table-striped align-middle benchmark-table">
            <thead>
              <tr>
                <th>Cloud / CDN Provider</th>
                <th>Egress Rate per GB (First 10TB)</th>
                <th>Egress Rate per GB (>50TB)</th>
                <th>Cache Offload Savings</th>
                <th>DDoS Protection Included</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-bold">Cloudflare Enterprise</td>
                <td class="text-success fw-bold">Flat Rate ($0.00 / GB)</td>
                <td class="text-success fw-bold">Flat Rate ($0.00 / GB)</td>
                <td><span class="badge bg-success">90% - 98% Offload</span></td>
                <td>Unlimited L3/L4/L7 DDoS</td>
              </tr>
              <tr>
                <td class="fw-bold">Fastly Edge Cloud</td>
                <td>$0.08 / GB</td>
                <td>$0.04 / GB</td>
                <td>85% - 95% Offload</td>
                <td>Included on Enterprise</td>
              </tr>
              <tr>
                <td class="fw-bold">AWS CloudFront</td>
                <td>$0.085 / GB</td>
                <td>$0.06 / GB</td>
                <td>80% - 92% Offload</td>
                <td>AWS Shield Standard</td>
              </tr>
              <tr>
                <td class="fw-bold">DigitalOcean / Vultr</td>
                <td>$0.01 / GB</td>
                <td>$0.01 / GB</td>
                <td>Direct Server Egress</td>
                <td>Basic Layer 3/4</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="brotli-avif-compression">Edge Optimization: Brotli, AVIF, and Cache Offloading</h2>
        <p>Modern web applications can cut data egress volume by up to <strong>65% to 80%</strong> simply by enabling modern compression and image format conversion at the CDN edge:</p>
        <ul class="lh-lg">
          <li><strong>Brotli Compression (Level 11):</strong> Yields 15–25% smaller JavaScript, CSS, and HTML payloads compared to standard Gzip.</li>
          <li><strong>WebP & AVIF Image Formatting:</strong> Reduces hero image payload sizes from 1.5MB (JPEG/PNG) down to under 120KB without visual quality loss.</li>
          <li><strong>HTTP/3 QUIC Protocol:</strong> Eliminates head-of-line blocking on high-latency mobile networks, speeding up initial page load time by 30%.</li>
        </ul>

        <!-- FREQUENTLY ASKED QUESTIONS -->
        <h2 id="faq-section" class="mt-5">Frequently Asked Questions</h2>
        <div class="accordion accordion-flush id-faq-accordion" id="bandwidthFaq">
          
          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingOne">
              <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne">
                How do I convert monthly Terabytes into Mbps throughput?
              </button>
            </h3>
            <div id="faqCollapseOne" class="accordion-collapse collapse show" data-bs-parent="#bandwidthFaq">
              <div class="accordion-body">
                <code>Mbps = (Total Monthly Terabytes * 8,000,000) / (30 days * 24 hours * 3600 seconds)</code>. For example, 10 TB per month equals roughly <strong>30.8 Mbps</strong> continuous bandwidth.
              </div>
            </div>
          </div>

          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingTwo">
              <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo">
                Why is peak multiplier important in server capacity planning?
              </button>
            </h3>
            <div id="faqCollapseTwo" class="accordion-collapse collapse" data-bs-parent="#bandwidthFaq">
              <div class="accordion-body">
                Web traffic is never evenly distributed across 24 hours. Traffic typically peaks during business hours or viral spikes (often 2.5x to 4.0x higher than average), requiring your origin servers and load balancers to have headroom for peak surges.
              </div>
            </div>
          </div>

        </div>

        <!-- COMMENTS SECTION -->
        <div class="mt-5 pt-4 border-top">
          <h4 class="fw-bold mb-3"><i class="bi bi-chat-left-text me-2"></i> Join the Cloud Infrastructure Discussion</h4>
          <?php $this->load->view('includes/poll_widget', ['poll_slug' => 'internet-server-bandwidth']); ?>
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
          <a href="<?php echo base_url('internet/web-hosting'); ?>" class="list-group-item list-group-item-action active fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-hdd-network-fill me-2"></i> Server Bandwidth Sizer</span>
            <span class="badge bg-light text-dark">Hosting</span>
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
function calculateBandwidth() {
  const dau = parseInt(document.getElementById('dauRange').value);
  const sizeMb = parseFloat(document.getElementById('sizeRange').value);
  const pvPerSession = parseFloat(document.getElementById('pvSessionRange').value);
  const peakMult = parseFloat(document.getElementById('peakSelect').value);
  const cdnCache = parseFloat(document.getElementById('cdnSelect').value);

  document.getElementById('dauDisplay').innerText = dau.toLocaleString();
  document.getElementById('sizeDisplay').innerText = sizeMb.toFixed(1) + ' MB';
  document.getElementById('pvSessionDisplay').innerText = pvPerSession.toFixed(1) + ' pages';

  const monthlyVisitors = dau * 30;
  const totalPv = monthlyVisitors * pvPerSession;
  
  // Total raw MB transfer
  const rawMb = totalPv * sizeMb;
  const originMb = rawMb * (1 - cdnCache);
  const originTb = originMb / (1024 * 1024);

  // Mbps calculation: 1 TB = 8,000,000 Megabits / (30 * 24 * 3600 seconds)
  const mbps = (originTb * 8000000) / (30 * 24 * 3600);
  const peakMbps = mbps * peakMult;

  // Cost estimates: CDN flat ($130) vs AWS direct ($0.07/GB)
  const awsCost = originTb * 1024 * 0.07;
  const cdnCost = Math.max(20, originTb * 10);

  document.getElementById('resTransfer').innerText = originTb.toFixed(2) + ' TB / mo';
  document.getElementById('resTotalPageviews').innerText = (totalPv / 1000000).toFixed(2) + 'M pageviews / month';
  document.getElementById('resMbps').innerText = mbps.toFixed(1) + ' Mbps';
  document.getElementById('resPeakMbps').innerText = peakMbps.toFixed(1) + ' Mbps';
  document.getElementById('resPeakBadge').innerText = peakMult.toFixed(1) + 'x SURGE READY';
  document.getElementById('resCost').innerText = '$' + Math.round(cdnCost) + ' - $' + Math.round(awsCost) + ' / mo';
  document.getElementById('resCdnSavings').innerText = `Cloudflare CDN ($${Math.round(cdnCost)}) vs AWS Direct Egress ($${Math.round(awsCost)})`;
}

function copyBandwidthReport() {
  const dau = document.getElementById('dauDisplay').innerText;
  const tb = document.getElementById('resTransfer').innerText;
  const mbps = document.getElementById('resPeakMbps').innerText;
  const cost = document.getElementById('resCost').innerText;

  const text = `Imperialpedia Infrastructure Bandwidth Report:\n- Daily Active Users: ${dau}\n- Monthly Data Transfer: ${tb}\n- Peak Throughput Required: ${mbps}\n- Est. Monthly Egress Cost: ${cost}\nCalculated at: http://localhost:8000/internet/web-hosting`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Infrastructure sizing report copied to clipboard!');
  });
}

document.addEventListener('DOMContentLoaded', calculateBandwidth);
</script>
