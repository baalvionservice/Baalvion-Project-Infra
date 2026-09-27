<div class="content-wrapper" style="min-height: 900px; background-color: #f8fafc; padding: 25px;">
  <!-- Header Banner -->
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 24px 30px; margin-bottom: 25px; color: #ffffff; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">SEO & Conversion Hub</span>
          <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">8 Tools Active</span>
        </div>
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">Interactive Tools & Calculators Manager</h2>
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">Monitor performance, target SEO keywords, test live endpoints, and manage custom calculators.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <a href="<?php echo base_url('imp-admin/sitemap_generate'); ?>" style="background: rgba(255,255,255,0.1); color: #ffffff; padding: 10px 18px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.15); transition: all 0.2s;">
          <i class="fa fa-sitemap"></i> Sitemap Status
        </a>
        <a href="<?php echo base_url('imp-admin/ping_search_engines'); ?>" style="background: #2563eb; color: #ffffff; padding: 10px 18px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
          <i class="fa fa-refresh"></i> Ping Search Engines
        </a>
      </div>
    </div>
  </div>

  <?php if($this->session->flashdata('msg')): ?>
    <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 14px 20px; border-radius: 10px; margin-bottom: 20px; font-weight: 600;">
      <i class="fa fa-check-circle" style="margin-right: 8px;"></i> <?php echo $this->session->flashdata('msg'); ?>
    </div>
  <?php endif; ?>

  <!-- Tools Grid -->
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; margin-bottom: 30px;">
    <?php foreach($tools as $t): ?>
      <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 22px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 20px -5px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.05)';">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: <?php echo $t['bg_color']; ?>; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; box-shadow: 0 4px 10px <?php echo $t['shadow_color']; ?>;">
              <i class="fa <?php echo $t['icon']; ?>"></i>
            </div>
            <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> Live & Active
            </span>
          </div>

          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; line-height: 1.3;">
            <?php echo htmlspecialchars($t['title']); ?>
          </h3>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 14px 0; min-height: 40px;">
            <?php echo htmlspecialchars($t['description']); ?>
          </p>

          <div style="margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
              <i class="fa fa-key text-primary" style="margin-right: 4px;"></i> Target SEO Keywords (<?php echo count($t['keywords']); ?>)
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
              <?php foreach($t['keywords'] as $kw): ?>
                <span style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                  <?php echo htmlspecialchars($kw); ?>
                </span>
              <?php endforeach; ?>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #f1f5f9; pt-14; padding-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <code style="font-size: 11px; color: #0284c7; background: #f0f9ff; padding: 4px 8px; border-radius: 6px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
            <?php echo htmlspecialchars($t['url']); ?>
          </code>
          <a href="<?php echo base_url(ltrim($t['url'], '/')); ?>" target="_blank" style="background: #0f172a; color: #ffffff; padding: 7px 14px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
            View Tool <i class="fa fa-external-link"></i>
          </a>
        </div>
      </div>
    <?php endforeach; ?>
  </div>

  <!-- Key SEO & AdSense Guidelines Card -->
  <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0;">
      <i class="fa fa-shield text-success" style="margin-right: 8px;"></i> Google AdSense & SEO Optimization Checklist for Tools
    </h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
      <div>
        <h4 style="font-weight: 700; color: #1e293b; margin: 0 0 6px 0; font-size: 14px;">1. High-Value Ad Placement</h4>
        <p style="margin: 0;">Each tool page is configured with dedicated ad slots above and below the main calculator interface for maximum viewability and eCPM revenue generation.</p>
      </div>
      <div>
        <h4 style="font-weight: 700; color: #1e293b; margin: 0 0 6px 0; font-size: 14px;">2. Dedicated Canonical Routes</h4>
        <p style="margin: 0;">Every tool runs on an independent, SEO-friendly route with full OpenGraph meta tags, unique schema markup, and high-volume target keywords.</p>
      </div>
      <div>
        <h4 style="font-weight: 700; color: #1e293b; margin: 0 0 6px 0; font-size: 14px;">3. Instant Client Computation</h4>
        <p style="margin: 0;">Calculators process input parameters client-side with zero latency, providing smooth micro-animations and zero bounce rate.</p>
      </div>
    </div>
  </div>
</div>
