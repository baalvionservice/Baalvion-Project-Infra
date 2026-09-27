<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  
  <section class="content-header" style="padding: 20px 25px 10px 25px;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="m-0 fw-bold" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.8rem; color: #0f172a;">
          <i class="fa fa-pie-chart text-warning me-2"></i> Live Community Polls Management
        </h1>
        <small class="text-muted">Manage real-time reader polls, question options, & live vote percentages</small>
      </div>
      <div>
        <a href="<?php echo base_url('imp-admin/add_poll'); ?>" class="btn btn-warning btn-sm fw-bold me-1 text-dark">
          <i class="fa fa-plus-circle me-1"></i> Create New Poll
        </a>
        <a href="<?php echo base_url('imp-admin/dashboard'); ?>" class="btn btn-outline-dark btn-sm fw-bold">
          <i class="fa fa-arrow-left me-1"></i> Dashboard
        </a>
      </div>
    </div>
  </section>

  <section class="content" style="padding: 15px 25px;">
    
    <div class="card border-0 shadow-sm rounded">
      <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
        <span><i class="fa fa-list me-2"></i> Active Site Polls</span>
        <span class="badge bg-success"><?php echo count($polls ?? []); ?> Polls Listed</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle m-0">
          <thead class="table-light">
            <tr>
              <th>Poll Question & Slug</th>
              <th>Category Page</th>
              <th>Total Votes</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <?php if (!empty($polls) && is_array($polls)): ?>
              <?php foreach ($polls as $poll): ?>
                <tr>
                  <td>
                    <strong class="text-dark"><?php echo htmlspecialchars($poll['poll_question'] ?? ''); ?></strong>
                    <div class="extra-small text-muted">Slug: <code><?php echo htmlspecialchars($poll['poll_slug'] ?? ''); ?></code></div>
                  </td>
                  <td>
                    <span class="badge bg-info text-dark"><?php echo htmlspecialchars($poll['category_name'] ?? 'Homepage'); ?></span>
                  </td>
                  <td>
                    <span class="fw-bold text-success fs-5"><?php echo number_format($poll['total_votes'] ?? 0); ?></span> votes
                  </td>
                  <td>
                    <?php if (($poll['poll_status'] ?? '') === 'active'): ?>
                      <span class="badge bg-success">ACTIVE</span>
                    <?php else: ?>
                      <span class="badge bg-secondary">PAUSED</span>
                    <?php endif; ?>
                  </td>
                  <td>
                    <a href="<?php echo base_url('poll/results/' . htmlspecialchars($poll['poll_slug'] ?? '')); ?>" target="_blank" class="btn btn-xs btn-outline-dark">
                      <i class="fa fa-bar-chart"></i> View JSON API
                    </a>
                  </td>
                </tr>
              <?php endforeach; ?>
            <?php else: ?>
              <tr>
                <td colspan="5" class="text-muted text-center py-4">No active polls found.</td>
              </tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

  </section>
</div>
