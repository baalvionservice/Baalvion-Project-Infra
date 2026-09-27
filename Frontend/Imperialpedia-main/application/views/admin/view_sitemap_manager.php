<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  
  <section class="content-header" style="padding: 20px 25px 10px 25px;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="m-0 fw-bold" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.8rem; color: #0f172a;">
          <i class="fa fa-sitemap text-primary me-2"></i> Dynamic XML Sitemap & Search Engine Ping
        </h1>
        <small class="text-muted">Generate dynamic XML sitemap & notify Google & Bing Webmaster bots for rapid indexing</small>
      </div>
      <div>
        <a href="<?php echo base_url('sitemap.xml'); ?>" target="_blank" class="btn btn-primary btn-sm fw-bold">
          <i class="fa fa-external-link me-1"></i> View Live sitemap.xml
        </a>
      </div>
    </div>
  </section>

  <section class="content" style="padding: 15px 25px;">
    
    <div class="row g-4">
      
      <!-- SITEMAP STATS CARD -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm rounded p-4 h-100">
          <h4 class="fw-bold mb-3 text-dark"><i class="fa fa-refresh text-primary me-2"></i> XML Sitemap Generator</h4>
          <p class="text-muted small mb-4">
            Your XML sitemap automatically indexes all published articles, category hubs, standalone calculator tools, and author profile pages.
          </p>

          <div class="alert alert-info border mb-4">
            <div class="fw-bold">Currently Indexed URLs:</div>
            <div class="h3 fw-bold text-dark m-0"><?php echo number_format($total_urls ?? 45); ?> Total Indexed URLs</div>
          </div>

          <a href="<?php echo base_url('imp-admin/rebuild_sitemap'); ?>" class="btn btn-primary btn-lg w-100 fw-bold shadow-sm mb-2">
            <i class="fa fa-bolt me-2"></i> Rebuild Dynamic sitemap.xml
          </a>
          <small class="text-muted text-center d-block">Generates W3C-compliant XML sitemap for search engines</small>
        </div>
      </div>

      <!-- SEARCH ENGINE PING CARD -->
      <div class="col-md-6">
        <div class="card border-0 shadow-sm rounded p-4 h-100">
          <h4 class="fw-bold mb-3 text-dark"><i class="fa fa-google text-danger me-2"></i> Ping Search Engine Indexers</h4>
          <p class="text-muted small mb-4">
            Notify Google Search Console and Bing Webmaster crawlers that your content has been updated to accelerate page indexing.
          </p>

          <div class="bg-light p-3 border rounded mb-4 extra-small">
            <div class="fw-bold text-dark mb-1">Target Search Endpoints:</div>
            <div>&bull; Google Ping: <code>http://www.google.com/ping?sitemap=<?php echo base_url('sitemap.xml'); ?></code></div>
            <div>&bull; Bing Ping: <code>http://www.bing.com/ping?sitemap=<?php echo base_url('sitemap.xml'); ?></code></div>
          </div>

          <a href="<?php echo base_url('imp-admin/ping_search_engines'); ?>" class="btn btn-danger btn-lg w-100 fw-bold shadow-sm mb-2">
            <i class="fa fa-paper-plane me-2"></i> Ping Google & Bing Indexers
          </a>
          <small class="text-muted text-center d-block">Sends automated HTTP GET ping requests to search engine bots</small>
        </div>
      </div>

    </div>

  </section>
</div>
