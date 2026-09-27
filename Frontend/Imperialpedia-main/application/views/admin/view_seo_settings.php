<div class="content-wrapper" style="min-height: 900px; background-color: #f8fafc; padding: 25px;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 24px 30px; margin-bottom: 25px; color: #ffffff; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Global Configuration</span>
        </div>
        <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; margin: 0 0 6px 0;">SEO, Monetization & Site Settings</h2>
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">Manage Google Analytics, AdSense IDs, social media integration, metadata, and robots.txt rules.</p>
      </div>
    </div>
  </div>

  <?php if($this->session->flashdata('msg')): ?>
    <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 14px 20px; border-radius: 10px; margin-bottom: 20px; font-weight: 600;">
      <i class="fa fa-check-circle" style="margin-right: 8px;"></i> <?php echo $this->session->flashdata('msg'); ?>
    </div>
  <?php endif; ?>

  <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 900px;">
    <form action="<?php echo base_url('imp-admin/save_seo_settings'); ?>" method="POST">
      <input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>">

      <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <i class="fa fa-globe text-primary" style="margin-right: 8px;"></i> Site Identity & Meta Defaults
      </h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Website Brand Name</label>
          <input type="text" name="site_title" value="<?php echo htmlspecialchars($settings['site_title'] ?? 'Imperialpedia'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Site Tagline</label>
          <input type="text" name="site_tagline" value="<?php echo htmlspecialchars($settings['site_tagline'] ?? 'Financial Intelligence, Web Development & Market Insights Hub'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
      </div>

      <div style="margin-bottom: 25px;">
        <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Default Meta Description (SEO Fallback)</label>
        <textarea name="meta_description" rows="3" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; font-family: inherit;"><?php echo htmlspecialchars($settings['meta_description'] ?? 'Imperialpedia is a premium platform delivering expert market insights, AI content strategies, interactive financial calculators, and high-CPM niche analytics.'); ?></textarea>
      </div>

      <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <i class="fa fa-line-chart text-success" style="margin-right: 8px;"></i> Analytics & AdSense Monetization
      </h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Google Analytics GA4 Measurement ID</label>
          <input type="text" name="ga4_id" placeholder="G-XXXXXXXXXX" value="<?php echo htmlspecialchars($settings['ga4_id'] ?? 'G-IMP889210'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Google AdSense Publisher Client ID</label>
          <input type="text" name="adsense_id" placeholder="ca-pub-XXXXXXXXXXXXXXXX" value="<?php echo htmlspecialchars($settings['adsense_id'] ?? 'ca-pub-9840192847192841'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
      </div>

      <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <i class="fa fa-share-alt text-info" style="margin-right: 8px;"></i> Social Media Channels & Contact Channels
      </h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">WhatsApp Official Channel / Support</label>
          <input type="text" name="whatsapp" value="<?php echo htmlspecialchars($settings['whatsapp'] ?? '+1 (555) 982-1049'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Telegram Community Group</label>
          <input type="text" name="telegram" value="<?php echo htmlspecialchars($settings['telegram'] ?? 'https://t.me/imperialpedia_official'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Twitter / X Official</label>
          <input type="text" name="twitter" value="<?php echo htmlspecialchars($settings['twitter'] ?? 'https://x.com/imperialpedia'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">LinkedIn Page</label>
          <input type="text" name="linkedin" value="<?php echo htmlspecialchars($settings['linkedin'] ?? 'https://linkedin.com/company/imperialpedia'); ?>" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
      </div>

      <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
        <i class="fa fa-code text-warning" style="margin-right: 8px;"></i> Search Engine Robots.txt Configuration
      </h3>

      <div style="margin-bottom: 25px;">
        <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Robots.txt Content</label>
        <textarea name="robots_txt" rows="5" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: monospace; outline: none; background: #0f172a; color: #38bdf8;"><?php echo htmlspecialchars($settings['robots_txt'] ?? "User-agent: *\nAllow: /\nDisallow: /imp-admin/\nSitemap: " . base_url('sitemap.xml')); ?></textarea>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
        <button type="submit" name="submit" value="1" style="background: #10b981; color: #ffffff; padding: 12px 28px; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
          <i class="fa fa-check" style="margin-right: 6px;"></i> Save All Site Settings
        </button>
      </div>
    </form>
  </div>
</div>
