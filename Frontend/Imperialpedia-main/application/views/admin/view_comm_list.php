<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper" style="padding: 25px;">
   <section class="content-header" style="margin-bottom: 20px;">
      <div class="d-flex justify-content-between align-items-center">
         <div>
            <h1 class="m-0 fw-bold" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.8rem; color: #0f172a;">
               <i class="fa fa-comments text-danger me-2"></i> User Comments Moderation
            </h1>
            <small class="text-muted">Manage reader discussion comments across all articles & site pages</small>
         </div>
      </div>
   </section>

   <?php if ($this->session->flashdata('msg')): ?>
      <div class="alert alert-success alert-dismissible fade show" role="alert">
         <?php echo $this->session->flashdata('msg'); ?>
      </div>
   <?php endif; ?>

   <div class="card border-0 shadow-sm rounded">
      <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
         <span><i class="fa fa-list me-2"></i> All Submitted Comments</span>
         <span class="badge bg-danger"><?php echo count($res ?? []); ?> Comments Listed</span>
      </div>
      <div class="table-responsive">
         <table class="table table-hover align-middle m-0">
            <thead class="table-light">
               <tr>
                  <th>Commenter & Page</th>
                  <th>Comment Text</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                  <th>Action</th>
               </tr>
            </thead>
            <tbody>
               <?php if (!empty($res) && is_array($res)): ?>
                  <?php foreach ($res as $val): ?>
                     <tr>
                        <td>
                           <strong class="text-dark"><?php echo htmlspecialchars($val['commenter_name'] ?? 'Anonymous'); ?></strong>
                           <div class="extra-small text-muted">Page: <code><?php echo htmlspecialchars($val['comment_page'] ?? '/'); ?></code></div>
                        </td>
                        <td style="max-width: 350px;">
                           <span class="text-dark" style="font-size: 0.9rem;"><?php echo htmlspecialchars($val['comment_txt'] ?? ''); ?></span>
                        </td>
                        <td>
                           <?php if (($val['comment_approve'] ?? '') === 'yes'): ?>
                              <span class="badge bg-success">APPROVED</span>
                           <?php else: ?>
                              <span class="badge bg-warning text-dark">PENDING</span>
                           <?php endif; ?>
                        </td>
                        <td>
                           <small class="text-muted"><?php echo htmlspecialchars($val['added_date'] ?? 'Recently'); ?></small>
                        </td>
                        <td>
                           <?php if (($val['comment_approve'] ?? '') !== 'yes'): ?>
                              <a class="btn btn-success btn-xs fw-bold" href="<?php echo base_url('imp-admin/comm_approve/' . $val['comment_id']); ?>">
                                 <i class="fa fa-check me-1"></i> Approve
                              </a>
                           <?php endif; ?>
                           <a class="btn btn-danger btn-xs fw-bold ms-1" onclick="return confirm('Are you sure you want to delete this comment?');" href="<?php echo base_url('imp-admin/comm_delete/' . $val['comment_id']); ?>">
                              <i class="fa fa-trash me-1"></i> Delete
                           </a>
                        </td>
                     </tr>
                  <?php endforeach; ?>
               <?php else: ?>
                  <tr>
                     <td colspan="5" class="text-muted text-center py-4">No comments found. New comments submitted by readers will automatically appear here.</td>
                  </tr>
               <?php endif; ?>
            </tbody>
         </table>
      </div>
   </div>
</div>