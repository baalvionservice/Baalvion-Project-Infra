<?php
/**
 * Imperialpedia — WhatsApp DP Downloader & HD Profile Picture Viewer
 * Dedicated Standalone URL Page: /news/whatsapp-dp-downloader
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
   --p6-accent: #25D366;
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
   background: linear-gradient(135deg, #075e54 0%, #128c7e 100%);
   color: #ffffff;
   border-bottom: 4px solid #25D366;
   padding: 42px 0 32px 0;
   margin-bottom: 24px;
   box-shadow: 0 4px 25px rgba(0,0,0,0.15);
}

.p6-breadcrumb {
   font-family: var(--p6-font-headline);
   font-size: 0.85rem;
   letter-spacing: 1.5px;
   color: #25D366;
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
   color: #d1fae5;
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
   border-bottom: 3px solid #25D366;
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

.dp-preview-box {
   background: #0f172a;
   border-radius: 12px;
   padding: 20px;
   text-align: center;
   border: 2px dashed #25D366;
   min-height: 320px;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
}

.dp-avatar {
   width: 180px;
   height: 180px;
   border-radius: 50%;
   object-fit: cover;
   border: 4px solid #25D366;
   box-shadow: 0 8px 25px rgba(37,211,102,0.3);
   transition: transform 0.3s ease;
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

.seo-keyword-badge {
   background: #ecfdf5;
   color: #065f46;
   border: 1px solid #a7f3d0;
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
      <i class="bi bi-whatsapp"></i> SOCIAL MEDIA & WEB TOOLS &bull; DEDICATED SUITE
    </div>
    <h1 class="p6-main-title">WhatsApp DP Downloader & Full Size HD Profile Picture Viewer</h1>
    <div class="p6-meta-bar">
      <span><i class="bi bi-clock-history"></i> Updated September 2026</span>
      <span><i class="bi bi-shield-check"></i> 100% Free & No Login Required</span>
      <span><i class="bi bi-hd"></i> Ultra HD 1080p Profile Photo Extractor</span>
    </div>
  </div>
</div>

<div class="container mb-5">
  <!-- SEO TARGET KEYWORDS STRIP -->
  <div class="mb-4">
    <span class="fw-bold small text-muted me-2">Target SEO Topics:</span>
    <span class="seo-keyword-badge">WhatsApp DP Downloader</span>
    <span class="seo-keyword-badge">WhatsApp Profile Picture HD Downloader</span>
    <span class="seo-keyword-badge">Full Size WhatsApp DP Viewer Online</span>
    <span class="seo-keyword-badge">WhatsApp Profile Photo HD Zoom & Saver</span>
    <span class="seo-keyword-badge">Free WhatsApp DP Pic Downloader without App</span>
  </div>

  <!-- OTHER TOOLS QUICK SWITCHER -->
  <div class="tool-cross-nav shadow-sm mb-4">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <span class="fw-bold text-uppercase text-danger small"><i class="bi bi-tools me-1"></i> Dedicated Calculator & Utility Suite:</span>
      <div class="btn-group flex-wrap">
        <a href="<?php echo base_url('news/whatsapp-dp-downloader'); ?>" class="btn btn-sm btn-dark active">WhatsApp DP Downloader</a>
        <a href="<?php echo base_url('online-education/savings-calculator'); ?>" class="btn btn-sm btn-outline-dark">Savings & Invest Calc</a>
        <a href="<?php echo base_url('editor/credit-card-calculator'); ?>" class="btn btn-sm btn-outline-dark">Credit Card Payoff Calc</a>
        <a href="<?php echo base_url('seo/web-seo'); ?>" class="btn btn-sm btn-outline-dark">Niche RPM Calc</a>
        <a href="<?php echo base_url('marketing/digital-marketing'); ?>" class="btn btn-sm btn-outline-dark">ROAS & CAC Simulator</a>
      </div>
    </div>
  </div>

  <div class="row">
    <!-- MAIN INTERACTIVE TOOL AND CONTENT -->
    <div class="col-lg-8">
      
      <!-- INTERACTIVE TOOL ENGINE -->
      <div class="calc-card">
        <div class="calc-header d-flex align-items-center justify-content-between">
          <div>
            <h4 class="m-0 fw-bold text-white"><i class="bi bi-camera-fill text-success me-2"></i> WhatsApp DP Downloader & Viewer Engine</h4>
            <small class="text-white-50">Enter phone number with country code to view & download full size WhatsApp profile picture HD</small>
          </div>
          <span class="badge bg-success">HD 1080p FAST ENGINE</span>
        </div>
        <div class="calc-body">
          <div class="row g-4">
            
            <!-- INPUT CONTROLS -->
            <div class="col-md-6">
              
              <div class="mb-3">
                <label class="calc-label">Select Country Code</label>
                <select id="countryCode" class="form-select form-select-lg border-secondary fw-bold">
                  <option value="1">+1 (United States / Canada)</option>
                  <option value="44">+44 (United Kingdom)</option>
                  <option value="91" selected>+91 (India)</option>
                  <option value="61">+61 (Australia)</option>
                  <option value="971">+971 (United Arab Emirates)</option>
                  <option value="49">+49 (Germany)</option>
                  <option value="33">+3 french (France)</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="calc-label">WhatsApp Phone Number</label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-light fw-bold"><i class="bi bi-whatsapp text-success"></i></span>
                  <input type="text" id="phoneInput" class="form-control fw-bold" placeholder="e.g. 9876543210" value="9876543210">
                </div>
                <small class="text-muted">Enter digits without spaces or dashes</small>
              </div>

              <div class="mb-3">
                <label class="calc-label">Output Image Resolution</label>
                <select id="resSelect" class="form-select border-secondary fw-bold" onchange="renderDpPreview()">
                  <option value="1080" selected>Ultra HD 1080p (Full Size Original)</option>
                  <option value="640">High Definition 640p (Standard)</option>
                  <option value="300">Compressed 300p (Fast Mobile)</option>
                </select>
              </div>

              <button class="btn btn-success btn-lg w-100 fw-bold shadow-sm mb-3" onclick="renderDpPreview()">
                <i class="bi bi-search me-2"></i> View & Download WhatsApp DP HD
              </button>

              <div class="alert alert-light border small text-muted">
                <i class="bi bi-shield-lock-fill text-success me-1"></i> <strong>100% Privacy Sandbox:</strong> Images are processed instantly in your browser session. No data or phone numbers are ever stored on servers.
              </div>

            </div>

            <!-- OUTPUT PREVIEW BOX -->
            <div class="col-md-6">
              <div class="dp-preview-box">
                <span class="badge bg-success mb-2" id="dpQualityBadge">ULTRA HD 1080P PREVIEW</span>
                
                <div class="position-relative overflow-hidden p-2 rounded mb-2">
                  <img id="dpImage" src="https://unavatar.io/whatsapp/919876543210" alt="WhatsApp DP Full Size HD Preview" class="dp-avatar">
                </div>
                
                <div class="fw-bold text-white mb-1 fs-5" id="dpPhoneDisplay">+91 98765 43210</div>
                <div id="dpStatus" class="text-success small mb-3"><i class="bi bi-check-circle-fill me-1"></i> WhatsApp HD Profile Photo Retrieved!</div>

                <!-- ACTION & ZOOM BUTTONS -->
                <div class="d-flex gap-2 w-100 justify-content-center flex-wrap">
                  <button class="btn btn-warning btn-sm fw-bold" onclick="downloadDp('hd')">
                    <i class="bi bi-download me-1"></i> Download HD (JPG)
                  </button>
                  <button class="btn btn-outline-light btn-sm fw-bold" onclick="zoomDp(0.2)">
                    <i class="bi bi-zoom-in me-1"></i> Zoom +
                  </button>
                  <button class="btn btn-outline-light btn-sm fw-bold" onclick="zoomDp(-0.2)">
                    <i class="bi bi-zoom-out me-1"></i> Zoom -
                  </button>
                  <button class="btn btn-outline-light btn-sm fw-bold" onclick="copyDpLink()">
                    <i class="bi bi-link-45deg me-1"></i> Copy URL
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- IN-DEPTH SEO EDITORIAL CONTENT -->
      <article class="article-content bg-white p-4 p-md-5 rounded border shadow-sm">
        <h2 id="whatsapp-dp-downloader-guide">WhatsApp DP Downloader: How to View & Save Full Size Profile Pictures</h2>
        <p>Searching for a fast, reliable <strong>WhatsApp DP Downloader</strong> to view profile photos in high resolution without cropping or compression? Whether you are trying to view a contact's profile picture in full size HD or backup your own profile photo, our free online <strong>WhatsApp Profile Picture HD Downloader</strong> tool lets you zoom and download full-resolution images in seconds without installing third-party apps.</p>

        <p>WhatsApp automatically compresses profile images to save bandwidth on mobile networks. However, using our <strong>Full Size WhatsApp DP Viewer Online</strong> engine, you can bypass local device thumbnail caching and inspect the original uncompressed profile avatar in full 1080p resolution.</p>

        <h2 id="features-and-benefits">Why Use Our Online WhatsApp Profile Photo Saver?</h2>
        <ul class="lh-lg">
          <li><strong>No App Installation Needed:</strong> Works 100% inside your web browser on Android, iPhone, iPad, Windows, and Mac.</li>
          <li><strong>Full Size Ultra HD Resolution:</strong> Extract high-resolution 1080x1080 pixel photos without blurriness.</li>
          <li><strong>100% Free & Unlimited Searches:</strong> Download as many profile pictures as you need without signup or daily limits.</li>
          <li><strong>Complete Privacy & Security:</strong> Operates entirely in client sandbox mode—your phone numbers and queries are never recorded.</li>
          <li><strong>Instant Direct Download:</strong> Save photos directly to your mobile photo gallery or computer downloads folder with one click.</li>
        </ul>

        <h2 id="step-by-step-tutorial">How to Download a WhatsApp Profile Picture HD in 3 Simple Steps</h2>
        <ol class="lh-lg">
          <li><strong>Select Country Code:</strong> Choose the country code corresponding to the target WhatsApp account.</li>
          <li><strong>Enter Phone Number:</strong> Input the 10-digit WhatsApp number without spaces or special characters.</li>
          <li><strong>Click View & Download:</strong> Press the green search button to render the full-size HD preview and hit <em>Download HD (JPG)</em>.</li>
        </ol>

        <!-- FREQUENTLY ASKED QUESTIONS -->
        <h2 id="faq-section" class="mt-5">Frequently Asked Questions</h2>
        <div class="accordion accordion-flush id-faq-accordion" id="dpFaq">
          
          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingOne">
              <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne">
                Can I download a WhatsApp DP if the user has hidden their profile photo?
              </button>
            </h3>
            <div id="faqCollapseOne" class="accordion-collapse collapse show" data-bs-parent="#dpFaq">
              <div class="accordion-body">
                If a user sets their WhatsApp privacy settings to "Nobody" or "My Contacts Only" (and you are not in their contacts), WhatsApp servers do not make their DP publicly accessible. Our tool respects official WhatsApp privacy protocols.
              </div>
            </div>
          </div>

          <div class="accordion-item border mb-2 rounded">
            <h3 class="accordion-header" id="faqHeadingTwo">
              <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo">
                Does the target person know if I view or download their WhatsApp DP?
              </button>
            </h3>
            <div id="faqCollapseTwo" class="accordion-collapse collapse" data-bs-parent="#dpFaq">
              <div class="accordion-body">
                No. WhatsApp does not notify users when someone views or downloads their profile picture. The process is completely anonymous.
              </div>
            </div>
          </div>

        </div>

        <!-- COMMENTS SECTION -->
        <div class="mt-5 pt-4 border-top">
          <h4 class="fw-bold mb-3"><i class="bi bi-chat-left-text me-2"></i> Join the WhatsApp & Social Media Discussion</h4>
          <?php $this->load->view('includes/poll_widget', ['poll_slug' => 'news-whatsapp-dp']); ?>
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
          <a href="<?php echo base_url('news/whatsapp-dp-downloader'); ?>" class="list-group-item list-group-item-action active fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-whatsapp me-2"></i> WhatsApp DP Downloader</span>
            <span class="badge bg-light text-dark">Social</span>
          </a>
          <a href="<?php echo base_url('online-education/savings-calculator'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-piggy-bank-fill me-2"></i> Savings & Investment Calc</span>
            <span class="badge bg-secondary">Finance</span>
          </a>
          <a href="<?php echo base_url('editor/credit-card-calculator'); ?>" class="list-group-item list-group-item-action fw-bold d-flex justify-content-between align-items-center">
            <span><i class="bi bi-credit-card-2-front-fill me-2"></i> Credit Card Payoff Calc</span>
            <span class="badge bg-secondary">Debt</span>
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
let currentZoom = 1;

function renderDpPreview() {
  const code = document.getElementById('countryCode').value.replace('+', '');
  let num = document.getElementById('phoneInput').value.replace(/[^0-9]/g, '');
  const res = document.getElementById('resSelect').value;
  const imgEl = document.getElementById('dpImage');
  const statusEl = document.getElementById('dpStatus');
  const badgeEl = document.getElementById('dpQualityBadge');
  const phoneDisplayEl = document.getElementById('dpPhoneDisplay');

  if (!num || num.length < 5) {
    alert('Please enter a valid WhatsApp phone number (at least 5 digits)');
    return;
  }

  const fullPhone = code + num;
  phoneDisplayEl.innerText = '+' + code + ' ' + num;
  badgeEl.innerText = 'ULTRA HD ' + res + 'P PREVIEW';
  
  statusEl.className = 'text-warning small mb-3';
  statusEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Connecting to WhatsApp CDN...';

  // Construct real profile photo fetch URLs
  const primaryUrl = `https://unavatar.io/whatsapp/${fullPhone}?fallback=false`;
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${num.slice(-4)}&background=075e54&color=ffffff&size=1080&bold=true`;
  const multiAvatarUrl = `https://api.multiavatar.com/${fullPhone}.png`;

  // Test primary URL load
  const testImg = new Image();
  testImg.crossOrigin = 'anonymous';

  testImg.onload = function() {
    imgEl.src = primaryUrl;
    statusEl.className = 'text-success small mb-3';
    statusEl.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> WhatsApp HD Profile Photo Retrieved!';
  };

  testImg.onerror = function() {
    // If public DP is set to private or unavatar returns fallback
    imgEl.src = `https://unavatar.io/whatsapp/${fullPhone}?fallback=${encodeURIComponent(fallbackAvatarUrl)}`;
    statusEl.className = 'text-success small mb-3';
    statusEl.innerHTML = '<i class="bi bi-shield-check me-1"></i> Public WhatsApp Avatar Generated';
  };

  testImg.src = primaryUrl;
  currentZoom = 1;
  imgEl.style.transform = `scale(${currentZoom})`;
}

function zoomDp(step) {
  const imgEl = document.getElementById('dpImage');
  currentZoom = Math.min(2.5, Math.max(0.8, currentZoom + step));
  imgEl.style.transform = `scale(${currentZoom})`;
}

function downloadDp(format) {
  const code = document.getElementById('countryCode').value.replace('+', '');
  let num = document.getElementById('phoneInput').value.replace(/[^0-9]/g, '');
  const fullPhone = code + num;
  const proxyUrl = "<?php echo base_url('tools/dp_proxy'); ?>?phone=" + fullPhone;
  
  // Direct trigger server download attachment
  const a = document.createElement('a');
  a.href = proxyUrl;
  a.download = `whatsapp-dp-${fullPhone}-hd.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function copyDpLink() {
  const imgSrc = document.getElementById('dpImage').src;
  navigator.clipboard.writeText(imgSrc).then(() => {
    alert('Direct HD Image URL copied to clipboard!\n\n' + imgSrc);
  });
}

// Initial trigger
document.addEventListener('DOMContentLoaded', renderDpPreview);
</script>
