<!-- Page Six & NY Post Design System — Reader Discussion & Comment Engine -->
<style>
.p6-comments-container {
   background: transparent;
   border: none;
   border-top: 1px solid #e2e8f0;
   border-radius: 0;
   padding: 24px 0 0 0;
   margin-top: 36px;
   box-shadow: none;
}

.p6-comments-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   border-bottom: 1px solid #e2e8f0;
   padding-bottom: 12px;
   margin-bottom: 24px;
}

.p6-comments-title {
   font-family: 'Plus Jakarta Sans', sans-serif;
   font-size: 1.3rem;
   font-weight: 800;
   letter-spacing: -0.01em;
   color: #0f172a;
   margin: 0;
}

.p6-comment-item {
   background: #f8fafc;
   border: 1px solid #f1f5f9;
   border-left: none;
   border-radius: 8px;
   padding: 18px;
   margin-bottom: 16px;
}

.p6-comment-author {
   display: flex;
   align-items: center;
   gap: 12px;
   margin-bottom: 8px;
}

.p6-comment-avatar {
   width: 36px;
   height: 36px;
   border-radius: 50%;
   background: #1e293b;
   color: #ffffff;
   display: flex;
   align-items: center;
   justify-content: center;
   font-weight: 700;
   font-family: 'Oswald', sans-serif;
   font-size: 0.85rem;
}

.p6-comment-name {
   font-weight: 700;
   color: #0f172a;
   font-size: 0.95rem;
}

.p6-comment-date {
   font-size: 0.78rem;
   color: #94a3b8;
}

.p6-comment-text {
   font-size: 0.92rem;
   color: #334155;
   line-height: 1.55;
   margin: 0;
}

.p6-comment-form-wrap {
   background: #f1f5f9;
   border-radius: 8px;
   padding: 24px;
   margin-top: 28px;
   border: 1px dashed #cbd5e1;
}

.p6-form-label {
   font-family: 'Oswald', sans-serif;
   font-size: 0.85rem;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   font-weight: 600;
   color: #475569;
}
</style>

<div class="p6-comments-container">
   <div class="p6-comments-header">
      <h3 class="p6-comments-title">
         <i class="fa-solid fa-comments text-danger me-2"></i> Reader Discussion (<?php echo !empty($comments) ? count($comments) : 0; ?>)
      </h3>
      <span class="badge bg-dark font-monospace">VERIFIED READERS</span>
   </div>

   <?php if($this->session->flashdata('comment_success')): ?>
      <div class="alert alert-success d-flex align-items-center mb-4" role="alert">
         <i class="fa-solid fa-circle-check me-2 fs-5"></i>
         <div><?php echo $this->session->flashdata('comment_success'); ?></div>
      </div>
   <?php endif; ?>

   <!-- Existing Comments List -->
   <?php if(!empty($comments)): ?>
      <div class="p6-comments-list">
         <?php foreach($comments as $comm): ?>
            <div class="p6-comment-item">
               <div class="p6-comment-author">
                  <div class="p6-comment-avatar">
                     <?php echo strtoupper(substr(!empty($comm['commenter_name']) ? $comm['commenter_name'] : 'R', 0, 2)); ?>
                  </div>
                  <div>
                     <div class="p6-comment-name"><?php echo htmlspecialchars($comm['commenter_name']); ?></div>
                     <div class="p6-comment-date"><i class="fa-regular fa-clock me-1"></i> <?php echo date('M d, Y \a\t h:i A', strtotime($comm['added_date'])); ?></div>
                  </div>
               </div>
               <p class="p6-comment-text"><?php echo nl2br(htmlspecialchars($comm['comment_txt'])); ?></p>
            </div>
         <?php endforeach; ?>
      </div>
   <?php else: ?>
      <div class="text-center py-4 text-muted">
         <i class="fa-regular fa-comment-dots display-6 mb-2 text-secondary"></i>
         <p class="mb-0">No comments on this article yet. Be the first to start the discussion below!</p>
      </div>
   <?php endif; ?>

   <!-- Comment Submission Form -->
   <div class="p6-comment-form-wrap">
      <h4 class="font-serif fw-bold mb-3" style="font-size:1.15rem; color:#0f172a;">
         <i class="fa-solid fa-pen-to-square text-danger me-1"></i> Leave a Comment &amp; Insight
      </h4>
      <form action="<?php echo base_url(); ?>comment" method="POST">
         <input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>">
         <input type="hidden" name="comment_page" value="<?php echo htmlspecialchars(uri_string()); ?>">
         <input type="hidden" name="redirect_url" value="<?php echo htmlspecialchars(current_url()); ?>">
         
         <div class="row g-3">
            <div class="col-md-6">
               <label class="p6-form-label">YOUR NAME *</label>
               <input type="text" name="commenter_name" class="form-control" placeholder="e.g. Alex Vance" required>
            </div>
            <div class="col-md-6">
               <label class="p6-form-label">EMAIL ADDRESS (Optional)</label>
               <input type="email" name="comment_email" class="form-control" placeholder="alex@example.com (Kept Private)">
            </div>
            <div class="col-12">
               <label class="p6-form-label">YOUR COMMENT &amp; INSIGHT *</label>
               <textarea name="comment_txt" class="form-control" rows="4" placeholder="Share your experience, questions, or insights on this topic..." required></textarea>
            </div>
            <div class="col-12">
               <button type="submit" class="btn btn-danger font-monospace fw-bold uppercase px-4 py-2" style="font-family:'Oswald',sans-serif;">
                  <i class="fa-solid fa-paper-plane me-1"></i> Post Comment
               </button>
            </div>
         </div>
      </form>
   </div>
</div>
