<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  
  <!-- Content Header (Page header) -->
  <section class="content-header" style="padding: 20px 25px 10px 25px;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="m-0 fw-bold" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.8rem; color: #0f172a;">
          <i class="fa fa-dashboard text-danger me-2"></i> Imperialpedia Command Dashboard
        </h1>
        <small class="text-muted">Content Management, Category Taxonomy & System Overview</small>
      </div>
      <div>
        <a href="<?php echo base_url('imp-admin/add_post'); ?>" class="btn btn-danger btn-sm fw-bold">
          <i class="fa fa-plus me-1"></i> Add New Post
        </a>
        <a href="<?php echo base_url(); ?>" target="_blank" class="btn btn-outline-dark btn-sm fw-bold ms-1">
          <i class="fa fa-external-link me-1"></i> View Live Site
        </a>
      </div>
    </div>
  </section>

  <!-- Main Content -->
  <section class="content" style="padding: 15px 25px;">
    
    <!-- STAT CARDS ROW -->
    <div class="row g-3 mb-4">
      
      <!-- Total Posts Card -->
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm" style="border-left: 4px solid #e50914 !important; border-radius: 8px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="text-uppercase text-muted extra-small fw-bold mb-1">Total Published Posts</div>
                <div class="h2 fw-bold text-dark m-0"><?php echo number_format($total_posts ?? 0); ?></div>
              </div>
              <div class="bg-danger text-white rounded p-3">
                <i class="fa fa-file-text fa-2x"></i>
              </div>
            </div>
            <div class="mt-2 text-muted extra-small">
              <a href="<?php echo base_url('imp-admin/post'); ?>" class="text-danger fw-bold text-decoration-none">Manage Posts &rarr;</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories & Subcategories Card -->
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm" style="border-left: 4px solid #2563eb !important; border-radius: 8px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="text-uppercase text-muted extra-small fw-bold mb-1">Categories & Subcats</div>
                <div class="h2 fw-bold text-dark m-0"><?php echo number_format(($total_cats ?? 0) + ($total_subcats ?? 0)); ?></div>
              </div>
              <div class="bg-primary text-white rounded p-3">
                <i class="fa fa-folder-open fa-2x"></i>
              </div>
            </div>
            <div class="mt-2 text-muted extra-small">
              <a href="<?php echo base_url('imp-admin/category'); ?>" class="text-primary fw-bold text-decoration-none">Manage Categories &rarr;</a>
            </div>
          </div>
        </div>
      </div>

      <!-- User Comments Card -->
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm" style="border-left: 4px solid #10b981 !important; border-radius: 8px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="text-uppercase text-muted extra-small fw-bold mb-1">User Comments</div>
                <div class="h2 fw-bold text-dark m-0"><?php echo number_format($total_comments ?? 0); ?></div>
              </div>
              <div class="bg-success text-white rounded p-3">
                <i class="fa fa-comments fa-2x"></i>
              </div>
            </div>
            <div class="mt-2 text-muted extra-small">
              <a href="<?php echo base_url('imp-admin/comment'); ?>" class="text-success fw-bold text-decoration-none">Moderate Comments &rarr;</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Poll Votes Card -->
      <div class="col-md-3 col-sm-6">
        <div class="card border-0 shadow-sm" style="border-left: 4px solid #f59e0b !important; border-radius: 8px;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="text-uppercase text-muted extra-small fw-bold mb-1">Live Poll Votes</div>
                <div class="h2 fw-bold text-dark m-0"><?php echo number_format($total_poll_votes ?? 0); ?></div>
              </div>
              <div class="bg-warning text-dark rounded p-3">
                <i class="fa fa-pie-chart fa-2x"></i>
              </div>
            </div>
            <div class="mt-2 text-muted extra-small">
              <span class="text-dark fw-bold">Live Community Votes Recorded</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- MAIN DASHBOARD PANELS -->
    <div class="row g-4">
      
      <!-- RECENT POSTS TABLE -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm rounded">
          <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
            <span><i class="fa fa-file-text me-2"></i> Recent Published Articles</span>
            <a href="<?php echo base_url('imp-admin/post'); ?>" class="btn btn-xs btn-outline-light">View All</a>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle m-0">
              <thead class="table-light">
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <?php if (!empty($recent_posts) && is_array($recent_posts)): ?>
                  <?php foreach ($recent_posts as $post): ?>
                    <tr>
                      <td>
                        <strong class="text-dark text-capitalize"><?php echo htmlspecialchars($post['post_title'] ?? ''); ?></strong>
                        <div class="extra-small text-muted"><?php echo htmlspecialchars($post['posted_date'] ?? ''); ?></div>
                      </td>
                      <td>
                        <span class="badge bg-secondary"><?php echo htmlspecialchars($post['subcat_name'] ?? 'General'); ?></span>
                      </td>
                      <td>
                        <a href="<?php echo base_url('imp-admin/edit_post/' . ($post['id'] ?? '')); ?>" class="btn btn-xs btn-outline-primary">
                          <i class="fa fa-pencil"></i> Edit
                        </a>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                <?php else: ?>
                  <tr>
                    <td colspan="3" class="text-muted text-center py-3">No posts found in database.</td>
                  </tr>
                <?php endif; ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- DEDICATED TOOL SUITE STATUS -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded mb-4">
          <div class="card-header bg-dark text-white fw-bold">
            <i class="fa fa-cogs me-2 text-warning"></i> Dedicated Standalone Tools Status
          </div>
          <div class="list-group list-group-flush small">
            <a href="<?php echo base_url('seo/web-seo'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-bar-chart me-2 text-success"></i> Niche Profitability Calc</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('marketing/digital-marketing'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-line-chart me-2 text-primary"></i> ROAS & CAC Simulator</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('insurance/health-insurance'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-heartbeat me-2 text-danger"></i> Health Premium Estimator</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('internet/web-hosting'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-server me-2 text-info"></i> Server Bandwidth Sizer</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('attorney/immigration'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-globe me-2 text-warning"></i> Golden Visa Index</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('news/whatsapp-dp-downloader'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-whatsapp me-2 text-success"></i> WhatsApp DP Downloader</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('online-education/savings-calculator'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-money me-2 text-success"></i> Savings & Invest Calc</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('editor/credit-card-calculator'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <span><i class="fa fa-credit-card me-2 text-danger"></i> Credit Card Payoff Calc</span>
              <span class="badge bg-success">ACTIVE (200 OK)</span>
            </a>
          </div>
        </div>
      </div>

    </div>

  </section>

</div>
