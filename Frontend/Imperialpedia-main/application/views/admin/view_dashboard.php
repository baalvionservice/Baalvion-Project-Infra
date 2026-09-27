<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper" style="background-color: #f8fafc; min-height: 100vh;">
  
  <!-- Custom Modern Styling for Dashboard -->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    .dash-wrapper {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
    }
    .card-metric {
      border: none;
      border-radius: 12px;
      transition: all 0.25s ease-in-out;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    }
    .card-metric:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.07);
    }
    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }
    .badge-subcat {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.78rem;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .badge-subcat:hover {
      background: #0284c7;
      color: #ffffff;
    }
    .audit-badge-danger {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      font-size: 0.73rem;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .audit-badge-warning {
      background: #fffbe6;
      color: #d97706;
      border: 1px solid #fef3c7;
      font-size: 0.73rem;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .audit-badge-info {
      background: #f0f9ff;
      color: #0284c7;
      border: 1px solid #e0f2fe;
      font-size: 0.73rem;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .header-gradient {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 14px;
      padding: 24px 28px;
      color: #ffffff;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
    }
    .table-modern thead th {
      background: #0f172a !important;
      color: #f8fafc !important;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      border: none;
      padding: 12px 16px;
    }
    .table-modern tbody td {
      padding: 14px 16px;
      vertical-align: middle;
      border-color: #f1f5f9;
    }
  </style>

  <div class="dash-wrapper px-4 py-4">

    <!-- DASHBOARD COMMAND HEADER -->
    <div class="header-gradient d-flex align-items-center justify-content-between flex-wrap gap-3">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-danger px-2 py-1" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px;">Admin Console 2026</span>
          <span class="badge bg-success px-2 py-1" style="font-size: 0.7rem;"><i class="fa fa-circle text-white me-1" style="font-size: 0.5rem;"></i> System Live & Healthy</span>
        </div>
        <h1 class="m-0 fw-bold text-white" style="font-size: 1.9rem; letter-spacing: -0.5px;">
          Imperialpedia Command Dashboard
        </h1>
        <p class="text-white-50 m-0 mt-1 small">
          Content Taxonomy, Missing Metadata Tracker & Overall System Intelligence
        </p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <a href="<?php echo base_url('imp-admin/add_post'); ?>" class="btn btn-danger btn-sm px-3 fw-bold shadow-sm">
          <i class="fa fa-plus me-1"></i> Add Article
        </a>
        <a href="<?php echo base_url('imp-admin/add_cat'); ?>" class="btn btn-primary btn-sm px-3 fw-bold shadow-sm">
          <i class="fa fa-folder-plus me-1"></i> Add Category
        </a>
        <a href="<?php echo base_url('imp-admin/add_subcat'); ?>" class="btn btn-info text-white btn-sm px-3 fw-bold shadow-sm">
          <i class="fa fa-tags me-1"></i> Add Sub-Cat
        </a>
        <a href="<?php echo base_url(); ?>" target="_blank" class="btn btn-outline-light btn-sm px-3 fw-bold">
          <i class="fa fa-external-link me-1"></i> Live Site
        </a>
      </div>
    </div>

    <!-- METRICS & SYSTEM OVERVIEW CARDS ROW -->
    <div class="row g-3 mb-4">
      
      <!-- Total Published Articles -->
      <div class="col-xl-2 col-md-4 col-sm-6">
        <div class="card card-metric p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-uppercase text-muted extra-small fw-bold">Total Articles</span>
            <div class="icon-box bg-danger text-white">
              <i class="fa fa-file-text-o"></i>
            </div>
          </div>
          <h2 class="fw-extrabold m-0 text-dark"><?php echo number_format($total_posts ?? 0); ?></h2>
          <div class="mt-2 pt-2 border-top extra-small">
            <a href="<?php echo base_url('imp-admin/post'); ?>" class="text-danger fw-bold text-decoration-none">
              View All Articles &rarr;
            </a>
          </div>
        </div>
      </div>

      <!-- Main Categories -->
      <div class="col-xl-2 col-md-4 col-sm-6">
        <div class="card card-metric p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-uppercase text-muted extra-small fw-bold">Main Categories</span>
            <div class="icon-box bg-primary text-white">
              <i class="fa fa-folder-open-o"></i>
            </div>
          </div>
          <h2 class="fw-extrabold m-0 text-primary"><?php echo number_format($total_cats ?? 0); ?></h2>
          <div class="mt-2 pt-2 border-top extra-small">
            <a href="<?php echo base_url('imp-admin/category'); ?>" class="text-primary fw-bold text-decoration-none">
              Manage Categories &rarr;
            </a>
          </div>
        </div>
      </div>

      <!-- Sub-Categories -->
      <div class="col-xl-2 col-md-4 col-sm-6">
        <div class="card card-metric p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-uppercase text-muted extra-small fw-bold">Sub-Categories</span>
            <div class="icon-box bg-info text-white">
              <i class="fa fa-sitemap"></i>
            </div>
          </div>
          <h2 class="fw-extrabold m-0 text-info"><?php echo number_format($total_subcats ?? 0); ?></h2>
          <div class="mt-2 pt-2 border-top extra-small">
            <a href="<?php echo base_url('imp-admin/sub_cat'); ?>" class="text-info fw-bold text-decoration-none">
              Manage Sub-Cats &rarr;
            </a>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div class="col-xl-2 col-md-4 col-sm-6">
        <div class="card card-metric p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-uppercase text-muted extra-small fw-bold">User Comments</span>
            <div class="icon-box bg-success text-white">
              <i class="fa fa-comments-o"></i>
            </div>
          </div>
          <h2 class="fw-extrabold m-0 text-success"><?php echo number_format($total_comments ?? 0); ?></h2>
          <div class="mt-2 pt-2 border-top extra-small">
            <a href="<?php echo base_url('imp-admin/comment'); ?>" class="text-success fw-bold text-decoration-none">
              Moderate &rarr;
            </a>
          </div>
        </div>
      </div>

      <!-- Poll Votes -->
      <div class="col-xl-2 col-md-4 col-sm-6">
        <div class="card card-metric p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-uppercase text-muted extra-small fw-bold">Poll Votes</span>
            <div class="icon-box bg-warning text-dark">
              <i class="fa fa-pie-chart"></i>
            </div>
          </div>
          <h2 class="fw-extrabold m-0 text-dark"><?php echo number_format($total_poll_votes ?? 0); ?></h2>
          <div class="mt-2 pt-2 border-top extra-small text-muted fw-bold">
            Recorded Votes
          </div>
        </div>
      </div>

      <!-- SEO / Content Health Alert Card -->
      <div class="col-xl-2 col-md-4 col-sm-6">
        <div class="card card-metric p-3" style="background: #fff1f2; border: 1px solid #fecdd3;">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="text-uppercase text-danger extra-small fw-bold">Content Health Alerts</span>
            <div class="icon-box bg-danger text-white">
              <i class="fa fa-exclamation-triangle"></i>
            </div>
          </div>
          <h2 class="fw-extrabold m-0 text-danger">
            <?php echo ($missing_img_count ?? 0) + ($missing_desc_count ?? 0) + ($unassigned_subcat_count ?? 0); ?>
          </h2>
          <div class="mt-2 pt-2 border-top border-rose-200 extra-small">
            <a href="#seo-audit-section" class="text-danger fw-bold text-decoration-none">
              Review Missing Items &darr;
            </a>
          </div>
        </div>
      </div>

    </div>

    <!-- SEO & CONTENT HEALTH AUDIT SUMMARY BAR -->
    <div id="seo-audit-section" class="card border-0 shadow-sm rounded-4 mb-4" style="background: #ffffff; border-radius: 14px;">
      <div class="card-header bg-white py-3 px-4 d-flex align-items-center justify-content-between border-bottom border-light">
        <div class="d-flex align-items-center gap-2">
          <div class="p-2 bg-rose-100 text-danger rounded-circle">
            <i class="fa fa-search-plus fa-lg"></i>
          </div>
          <div>
            <h5 class="m-0 fw-bold text-dark">SEO & Content Quality Audit Tracker</h5>
            <small class="text-muted">Instant detection of missing featured images, descriptions, sub-categories, and page meta titles</small>
          </div>
        </div>
        <span class="badge bg-danger px-3 py-2 rounded-pill fw-bold">
          <i class="fa fa-bolt me-1"></i> Auto Audit Active
        </span>
      </div>
      
      <div class="card-body p-4">
        <!-- AUDIT METRIC PILLS GRID -->
        <div class="row g-3 mb-4">
          
          <div class="col-md-3 col-sm-6">
            <div class="p-3 rounded-3 d-flex align-items-center justify-content-between" style="background: #f8fafc; border: 1px dashed #cbd5e1;">
              <div>
                <div class="text-muted extra-small font-weight-bold text-uppercase">Missing Featured Images</div>
                <div class="h4 font-weight-bold m-0 text-danger"><?php echo number_format($missing_img_count ?? 0); ?> <small class="text-muted fs-6">articles</small></div>
              </div>
              <div class="text-danger fs-3"><i class="fa fa-file-image-o"></i></div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="p-3 rounded-3 d-flex align-items-center justify-content-between" style="background: #f8fafc; border: 1px dashed #cbd5e1;">
              <div>
                <div class="text-muted extra-small font-weight-bold text-uppercase">Missing / Short Descriptions</div>
                <div class="h4 font-weight-bold m-0 text-warning"><?php echo number_format($missing_desc_count ?? 0); ?> <small class="text-muted fs-6">articles</small></div>
              </div>
              <div class="text-warning fs-3"><i class="fa fa-align-left"></i></div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="p-3 rounded-3 d-flex align-items-center justify-content-between" style="background: #f8fafc; border: 1px dashed #cbd5e1;">
              <div>
                <div class="text-muted extra-small font-weight-bold text-uppercase">Missing Page Meta Tags</div>
                <div class="h4 font-weight-bold m-0 text-info"><?php echo number_format($missing_meta_tags_count ?? 0); ?> <small class="text-muted fs-6">pages</small></div>
              </div>
              <div class="text-info fs-3"><i class="fa fa-code"></i></div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6">
            <div class="p-3 rounded-3 d-flex align-items-center justify-content-between" style="background: #f8fafc; border: 1px dashed #cbd5e1;">
              <div>
                <div class="text-muted extra-small font-weight-bold text-uppercase">Unassigned Sub-Categories</div>
                <div class="h4 font-weight-bold m-0 text-secondary"><?php echo number_format($unassigned_subcat_count ?? 0); ?> <small class="text-muted fs-6">articles</small></div>
              </div>
              <div class="text-secondary fs-3"><i class="fa fa-folder-o"></i></div>
            </div>
          </div>

        </div>

        <!-- AUDIT WARNING TABLE -->
        <?php if (!empty($audit_warning_posts) && is_array($audit_warning_posts)): ?>
          <div class="table-responsive rounded border border-light">
            <table class="table table-hover align-middle table-modern m-0">
              <thead>
                <tr>
                  <th style="width: 40%;">Article Title</th>
                  <th>Detected Issues</th>
                  <th>Sub-Category</th>
                  <th class="text-center" style="width: 15%;">Quick Action</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($audit_warning_posts as $post): ?>
                  <?php 
                    $has_missing_img = empty($post['post_img']) || $post['post_img'] == 'post.png' || $post['post_img'] == 'user.png';
                    $has_missing_desc = empty($post['post_desc']) || strlen(strip_tags($post['post_desc'])) < 30;
                    $has_missing_subcat = empty($post['sub_cat_id']);
                  ?>
                  <tr>
                    <td>
                      <strong class="text-dark d-block text-capitalize"><?php echo htmlspecialchars($post['post_title'] ?? ''); ?></strong>
                      <small class="text-muted extra-small"><i class="fa fa-calendar me-1"></i> Posted: <?php echo htmlspecialchars($post['posted_date'] ?? ''); ?></small>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        <?php if ($has_missing_img): ?>
                          <span class="audit-badge-danger"><i class="fa fa-image me-1"></i> Missing Image</span>
                        <?php endif; ?>
                        <?php if ($has_missing_desc): ?>
                          <span class="audit-badge-warning"><i class="fa fa-warning me-1"></i> Short/No Description</span>
                        <?php endif; ?>
                        <?php if ($has_missing_subcat): ?>
                          <span class="audit-badge-info"><i class="fa fa-folder me-1"></i> No Sub-Category</span>
                        <?php endif; ?>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-light text-dark border">
                        <?php echo htmlspecialchars($post['sub_cat_name'] ?? 'Unassigned'); ?>
                      </span>
                    </td>
                    <td class="text-center">
                      <a href="<?php echo base_url('imp-admin/edit_post/' . ($post['post_id'] ?? '')); ?>" class="btn btn-xs btn-outline-danger fw-bold px-2 py-1">
                        <i class="fa fa-edit me-1"></i> Fix Item
                      </a>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php else: ?>
          <div class="p-3 bg-light rounded text-center text-success fw-bold">
            <i class="fa fa-check-circle me-1"></i> All published articles pass the basic image and metadata checks cleanly!
          </div>
        <?php endif; ?>
      </div>
    </div>

    <!-- MAIN TWO-COLUMN DASHBOARD SECTION -->
    <div class="row g-4">
      
      <!-- LEFT COLUMN: CATEGORY & SUBCATEGORY TAXONOMY HIERARCHY PANEL -->
      <div class="col-lg-7">
        
        <div class="card border-0 shadow-sm mb-4" style="border-radius: 14px;">
          <div class="card-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i class="fa fa-sitemap text-warning fa-lg"></i>
              <h5 class="m-0 font-weight-bold text-white">Categories & Linked Sub-Categories Hierarchy</h5>
            </div>
            <div>
              <a href="<?php echo base_url('imp-admin/category'); ?>" class="btn btn-xs btn-light me-1 font-weight-bold">
                <i class="fa fa-cog me-1"></i> Manage Categories
              </a>
              <a href="<?php echo base_url('imp-admin/sub_cat'); ?>" class="btn btn-xs btn-outline-light font-weight-bold">
                <i class="fa fa-plus me-1"></i> Add Sub-Cat
              </a>
            </div>
          </div>
          
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle table-modern m-0">
                <thead>
                  <tr>
                    <th style="width: 32%;">Parent Category</th>
                    <th>Linked Sub-Categories</th>
                    <th class="text-center" style="width: 15%;">Total Linked</th>
                  </tr>
                </thead>
                <tbody>
                  <?php if (!empty($catss) && is_array($catss)): ?>
                    <?php foreach ($catss as $cat): ?>
                      <?php 
                        // Filter subcategories linked to this category
                        $linked_subs = [];
                        if (!empty($cat_sub) && is_array($cat_sub)) {
                          foreach ($cat_sub as $sub) {
                            if (isset($sub['cat_id']) && $sub['cat_id'] == $cat['cat_id']) {
                              $linked_subs[] = $sub;
                            }
                          }
                        }
                      ?>
                      <tr>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <span class="p-2 rounded bg-primary text-white" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                              <i class="fa fa-folder"></i>
                            </span>
                            <div>
                              <strong class="text-dark text-uppercase font-weight-bold d-block" style="font-size: 0.9rem;">
                                <?php echo htmlspecialchars($cat['cat_name'] ?? ''); ?>
                              </strong>
                              <small class="text-muted extra-small">ID: #<?php echo $cat['cat_id']; ?></small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <?php if (!empty($linked_subs)): ?>
                            <div class="d-flex flex-wrap gap-1">
                              <?php foreach ($linked_subs as $s): ?>
                                <a href="<?php echo base_url('imp-admin/subcat_edit/' . $s['sub_cat_id']); ?>" class="badge-subcat text-decoration-none" title="Click to edit subcategory">
                                  <i class="fa fa-tag text-info"></i> <?php echo htmlspecialchars($s['sub_cat_name'] ?? ''); ?>
                                </a>
                              <?php endforeach; ?>
                            </div>
                          <?php else: ?>
                            <span class="text-muted fst-italic extra-small">No sub-categories linked yet</span>
                          <?php endif; ?>
                        </td>
                        <td class="text-center">
                          <span class="badge bg-primary rounded-pill px-3 py-2 font-weight-bold">
                            <?php echo count($linked_subs); ?>
                          </span>
                        </td>
                      </tr>
                    <?php endforeach; ?>
                  <?php else: ?>
                    <tr>
                      <td colspan="3" class="text-muted text-center py-4">No categories found in system database.</td>
                    </tr>
                  <?php endif; ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RECENT PUBLISHED ARTICLES -->
        <div class="card border-0 shadow-sm" style="border-radius: 14px;">
          <div class="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom border-light">
            <h5 class="m-0 font-weight-bold text-dark"><i class="fa fa-clock-o me-2 text-danger"></i> Recent Published Articles</h5>
            <a href="<?php echo base_url('imp-admin/post'); ?>" class="btn btn-xs btn-outline-dark font-weight-bold">View All Articles</a>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle table-modern m-0">
              <thead>
                <tr>
                  <th>Article Title</th>
                  <th>Sub-Category</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <?php if (!empty($recent_posts) && is_array($recent_posts)): ?>
                  <?php foreach ($recent_posts as $post): ?>
                    <tr>
                      <td>
                        <strong class="text-dark text-capitalize d-block"><?php echo htmlspecialchars($post['post_title'] ?? ''); ?></strong>
                        <small class="text-muted extra-small"><i class="fa fa-calendar me-1"></i> <?php echo htmlspecialchars($post['posted_date'] ?? ''); ?></small>
                      </td>
                      <td>
                        <span class="badge bg-secondary text-white"><?php echo htmlspecialchars($post['subcat_name'] ?? 'General'); ?></span>
                      </td>
                      <td class="text-center">
                        <a href="<?php echo base_url('imp-admin/edit_post/' . ($post['post_id'] ?? '')); ?>" class="btn btn-xs btn-outline-primary fw-bold">
                          <i class="fa fa-pencil"></i> Edit
                        </a>
                      </td>
                    </tr>
                  <?php endforeach; ?>
                <?php else: ?>
                  <tr>
                    <td colspan="3" class="text-muted text-center py-3">No recent articles found.</td>
                  </tr>
                <?php endif; ?>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: STANDALONE TOOLS & SYSTEM STATUS -->
      <div class="col-lg-5">
        
        <!-- STANDALONE TOOLS STATUS -->
        <div class="card border-0 shadow-sm mb-4" style="border-radius: 14px;">
          <div class="card-header bg-dark text-white py-3 px-4">
            <h5 class="m-0 font-weight-bold"><i class="fa fa-cogs me-2 text-warning"></i> Standalone Tools Suite Status</h5>
          </div>
          <div class="list-group list-group-flush small">
            <a href="<?php echo base_url('seo/web-seo'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-bar-chart me-2 text-success"></i> Niche Profitability Calc</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('marketing/digital-marketing'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-line-chart me-2 text-primary"></i> ROAS & CAC Simulator</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('insurance/health-insurance'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-heartbeat me-2 text-danger"></i> Health Premium Estimator</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('internet/web-hosting'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-server me-2 text-info"></i> Server Bandwidth Sizer</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('attorney/immigration'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-globe me-2 text-warning"></i> Golden Visa Index</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('news/whatsapp-dp-downloader'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-whatsapp me-2 text-success"></i> WhatsApp DP Downloader</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('online-education/savings-calculator'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-money me-2 text-success"></i> Savings & Invest Calc</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
            <a href="<?php echo base_url('editor/credit-card-calculator'); ?>" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
              <span class="font-weight-bold text-dark"><i class="fa fa-credit-card me-2 text-danger"></i> Credit Card Payoff Calc</span>
              <span class="badge bg-success px-2 py-1">ACTIVE (200 OK)</span>
            </a>
          </div>
        </div>

        <!-- QUICK SYSTEM SHORTCUTS CARD -->
        <div class="card border-0 shadow-sm" style="border-radius: 14px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff;">
          <div class="card-body p-4">
            <h5 class="font-weight-bold text-white mb-2"><i class="fa fa-rocket me-2 text-info"></i> Command Quick Actions</h5>
            <p class="small text-white-50 mb-3">Instant navigation for administration and content operations</p>
            
            <div class="d-grid gap-2">
              <a href="<?php echo base_url('imp-admin/meta'); ?>" class="btn btn-outline-light btn-sm text-start py-2">
                <i class="fa fa-tags me-2 text-info"></i> Manage Page Meta Tags & SEO
              </a>
              <a href="<?php echo base_url('imp-admin/category'); ?>" class="btn btn-outline-light btn-sm text-start py-2">
                <i class="fa fa-folder me-2 text-warning"></i> Manage Main Categories
              </a>
              <a href="<?php echo base_url('imp-admin/sub_cat'); ?>" class="btn btn-outline-light btn-sm text-start py-2">
                <i class="fa fa-sitemap me-2 text-primary"></i> Manage Sub-Categories
              </a>
              <a href="<?php echo base_url('imp-admin/post'); ?>" class="btn btn-outline-light btn-sm text-start py-2">
                <i class="fa fa-file-text me-2 text-danger"></i> Article Library & Manager
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>

</div>
