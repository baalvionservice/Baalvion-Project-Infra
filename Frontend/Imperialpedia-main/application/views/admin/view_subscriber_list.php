<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  
  <section class="content-header" style="padding: 20px 25px 10px 25px;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="m-0 fw-bold" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.8rem; color: #0f172a;">
          <i class="fa fa-envelope text-success me-2"></i> Newsletter Email Subscribers
        </h1>
        <small class="text-muted">Manage reader email subscriptions & 1-click export to CSV for email marketing</small>
      </div>
      <div>
        <a href="<?php echo base_url('imp-admin/export_subscribers_csv'); ?>" class="btn btn-success btn-sm fw-bold">
          <i class="fa fa-download me-1"></i> Export Subscribers (CSV)
        </a>
      </div>
    </div>
  </section>

  <section class="content" style="padding: 15px 25px;">
    
    <div class="card border-0 shadow-sm rounded">
      <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
        <span><i class="fa fa-envelope-o me-2"></i> Active Subscribers List</span>
        <span class="badge bg-success"><?php echo count($subscribers ?? []); ?> Total Subscribers</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle m-0">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Subscriber Email</th>
              <th>Subscription Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <?php if (!empty($subscribers) && is_array($subscribers)): ?>
              <?php $i = 1; foreach ($subscribers as $sub): ?>
                <tr>
                  <td><?php echo $i++; ?></td>
                  <td>
                    <strong class="text-dark"><?php echo htmlspecialchars($sub['email'] ?? $sub['sub_email'] ?? ''); ?></strong>
                  </td>
                  <td>
                    <small class="text-muted"><?php echo htmlspecialchars($sub['created_at'] ?? $sub['added_date'] ?? 'Recent'); ?></small>
                  </td>
                  <td>
                    <span class="badge bg-success">SUBSCRIBED</span>
                  </td>
                </tr>
              <?php endforeach; ?>
            <?php else: ?>
              <tr>
                <td colspan="4" class="text-muted text-center py-4">No subscribers collected yet. Form subscriptions will automatically appear here.</td>
              </tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

  </section>
</div>
