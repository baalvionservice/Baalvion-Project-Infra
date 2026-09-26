<style>
  .main-sidebar {
    overflow-y: auto;
    height: 100vh;
    background: #0f172a;
    border-right: 1px solid #1e293b;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .main-sidebar::-webkit-scrollbar {
    width: 6px;
  }
  .main-sidebar::-webkit-scrollbar-track {
    background: #0f172a;
  }
  .main-sidebar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
  .main-sidebar::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
  .sidebar-header-title {
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 16px 20px 6px 20px;
    margin: 0;
  }
  .sidebar-menu-list {
    list-style: none;
    padding: 0;
    margin: 0 0 10px 0;
  }
  .sidebar-menu-list li a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    color: #cbd5e1;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .sidebar-menu-list li a:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    padding-left: 24px;
  }
  .sidebar-menu-list li a i {
    font-size: 15px;
    width: 18px;
    text-align: center;
  }
  .sidebar-badge {
    margin-left: auto;
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.3);
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 10px;
  }
</style>

<!-- Left side column. contains the logo and sidebar -->
<aside class="main-sidebar">
  <section class="sidebar">

    <!-- BRAND / LOGO AREA -->
    <div style="padding: 20px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; gap: 12px;">
      <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #1d4ed8); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 18px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);">
        I
      </div>
      <div>
        <div style="color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 16px; letter-spacing: -0.3px;">IMPERIALPEDIA</div>
        <div style="color: #10b981; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> ADMIN PANEL 2027
        </div>
      </div>
    </div>

    <!-- 1. MAIN DASHBOARD -->
    <div class="sidebar-header-title">Overview</div>
    <ul class="sidebar-menu-list">
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/dashboard">
          <i class="fa fa-dashboard text-danger"></i> <span>Command Dashboard</span>
        </a>
      </li>
    </ul>

    <!-- 2. CONTENT MANAGEMENT -->
    <div class="sidebar-header-title">Content Management</div>
    <ul class="sidebar-menu-list">
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/post">
          <i class="fa fa-file-text text-info"></i> <span>Articles & Posts</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/category">
          <i class="fa fa-folder text-warning"></i> <span>Categories</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/sub_cat">
          <i class="fa fa-folder-open text-primary"></i> <span>Sub-Categories</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/quots">
          <i class="fa fa-quote-left text-success"></i> <span>Key Quotes</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/terms">
          <i class="fa fa-book text-secondary"></i> <span>Glossary Terms</span>
        </a>
      </li>
    </ul>

    <!-- 3. INTERACTIVE TOOLS -->
    <div class="sidebar-header-title">Standalone Tools</div>
    <ul class="sidebar-menu-list">
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/tools">
          <i class="fa fa-calculator text-warning"></i> <span>Tools & Calculators</span>
          <span class="sidebar-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(52, 211, 153, 0.3);">8 LIVE</span>
        </a>
      </li>
    </ul>

    <!-- 4. COMMUNITY & WRITERS -->
    <div class="sidebar-header-title">Community & Writers</div>
    <ul class="sidebar-menu-list">
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/authors">
          <i class="fa fa-users text-info"></i> <span>Writers & Editorial Board</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/polls">
          <i class="fa fa-pie-chart text-warning"></i> <span>Live Polls Manager</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/subscribers">
          <i class="fa fa-envelope text-success"></i> <span>Email Subscribers (CSV)</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/comment">
          <i class="fa fa-comments text-danger"></i> <span>Comments Moderation</span>
        </a>
      </li>
    </ul>

    <!-- 5. SEO & SYSTEM SETTINGS -->
    <div class="sidebar-header-title">SEO & System Settings</div>
    <ul class="sidebar-menu-list">
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/meta">
          <i class="fa fa-tags text-warning"></i> <span>Page Meta Tags</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/sitemap_generate">
          <i class="fa fa-sitemap text-primary"></i> <span>XML Sitemap & Indexing</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/seo_settings">
          <i class="fa fa-gear text-success"></i> <span>SEO & Global Settings</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url(); ?>imp-admin/signout" onclick="return confirm('Log out of Admin Panel?');">
          <i class="fa fa-power-off text-danger"></i> <span>Sign Out</span>
        </a>
      </li>
    </ul>

  </section>
</aside>