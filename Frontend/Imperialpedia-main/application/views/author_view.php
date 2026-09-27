<?php
/**
 * Imperialpedia — Writers & Editorial Board Hub Page
 * URL: /author
 */
?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">

<style>
:root {
   --p6-red: #e50914;
   --p6-dark: #0f172a;
   --p6-card-border: #e2e8f0;
   --p6-font-headline: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
   --p6-font-body: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
   background-color: #f8fafc;
   font-family: var(--p6-font-body);
   color: #1e293b;
}

/* Page Hero Banner */
.author-hero {
   background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
   color: #ffffff;
   border-bottom: 4px solid var(--p6-red);
   padding: 48px 0 38px 0;
   margin-bottom: 35px;
}

.author-main-title {
   font-family: var(--p6-font-headline);
   font-weight: 800;
   font-size: 2.8rem;
   letter-spacing: -0.025em;
   color: #ffffff;
   margin-bottom: 14px;
}

.author-card {
   background: #ffffff;
   border: 1px solid #e2e8f0;
   border-radius: 12px;
   padding: 24px;
   height: 100%;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
   transition: transform 0.25s ease, box-shadow 0.25s ease;
   display: flex;
   flex-direction: column;
}

.author-card:hover {
   transform: translateY(-4px);
   box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
   border-color: #cbd5e1;
}

.author-avatar {
   width: 80px;
   height: 80px;
   border-radius: 50%;
   object-fit: cover;
   border: 3px solid #e2e8f0;
}

.author-name {
   font-family: var(--p6-font-headline);
   font-weight: 800;
   font-size: 1.35rem;
   color: #0f172a;
   text-decoration: none;
   margin-bottom: 4px;
   display: inline-block;
}

.author-name:hover {
   color: var(--p6-red);
}

.author-role {
   font-size: 0.85rem;
   font-weight: 700;
   color: #e50914;
   margin-bottom: 8px;
   text-transform: uppercase;
   letter-spacing: 0.5px;
}

.topic-badge {
   background: #f1f5f9;
   color: #334155;
   font-size: 0.72rem;
   font-weight: 600;
   padding: 3px 8px;
   border-radius: 4px;
   display: inline-block;
   margin-right: 4px;
   margin-bottom: 4px;
}

.join-author-box {
   background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
   color: #ffffff;
   border-radius: 12px;
   padding: 35px;
   margin-top: 40px;
}
</style>

<!-- HERO HEADER -->
<div class="author-hero">
  <div class="container">
    <div class="text-uppercase fw-bold text-danger mb-2 small letter-spacing-2">
      Our Editorial Team
    </div>
    <h1 class="author-main-title">Meet Our Writers</h1>
    <p class="lead text-white-50 max-w-700">
      The people who write and edit Imperialpedia.
    </p>
  </div>
</div>

<div class="container mb-5">
  
  <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
    <div>
      <h3 class="fw-bold text-dark m-0"><i class="bi bi-people-fill text-danger me-2"></i> Featured Writers & Experts</h3>
      <small class="text-muted">Click any author profile to view their full bio and complete list of authored articles</small>
    </div>
    <a href="<?php echo base_url('submit-job-application'); ?>" class="btn btn-outline-dark btn-sm fw-bold">
      <i class="bi bi-pencil-square me-1"></i> Apply as a Writer / Contributor
    </a>
  </div>

  <!-- AUTHORS GRID -->
  <div class="row g-4">
    <?php if (!empty($authors) && is_array($authors)): ?>
      <?php foreach ($authors as $author): ?>
        <div class="col-md-6 col-lg-4">
          <div class="author-card">
            
            <div class="d-flex align-items-center gap-3 mb-3">
              <img src="<?php echo htmlspecialchars($author['avatar']); ?>" alt="<?php echo htmlspecialchars($author['name']); ?>" class="author-avatar">
              <div>
                <a href="<?php echo base_url('author/' . $author['slug']); ?>" class="author-name">
                  <?php echo htmlspecialchars($author['name']); ?>
                </a>
                <div class="author-role"><?php echo htmlspecialchars($author['title']); ?></div>
                <?php if(!empty($author['credentials'])){ ?><div class="text-muted extra-small"><?php echo htmlspecialchars($author['credentials']); ?></div><?php } ?>
              </div>
            </div>

            <p class="small text-secondary mb-3 flex-grow-1">
              <?php echo htmlspecialchars($author['bio']); ?>
            </p>

            <div class="mb-3">
              <?php foreach ($author['topics'] as $topic): ?>
                <span class="topic-badge"><?php echo htmlspecialchars($topic); ?></span>
              <?php endforeach; ?>
            </div>

            <div class="pt-3 border-top d-flex align-items-center justify-content-between">
              <span class="fw-bold text-dark small">
                <i class="bi bi-journal-text me-1"></i> <?php echo count($author['articles']); ?> Published Articles
              </span>
              <a href="<?php echo base_url('author/' . $author['slug']); ?>" class="btn btn-sm btn-danger fw-bold">
                View Profile & Articles <i class="bi bi-arrow-right me-1"></i>
              </a>
            </div>

          </div>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>

  <!-- JOIN AS A WRITER CTA BOX -->
  <div class="join-author-box shadow">
    <div class="row align-items-center">
      <div class="col-lg-8">
        <h3 class="fw-bold mb-2 text-white"><i class="bi bi-feather me-2"></i> Want to Publish Your Expertise on Imperialpedia?</h3>
        <p class="text-white-50 mb-0">We are always seeking subject matter experts, financial analysts, tech engineers, and legal practitioners to join our editorial network. Submit your portfolio or original research paper today.</p>
      </div>
      <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
        <a href="<?php echo base_url('careers'); ?>" class="btn btn-warning btn-lg fw-bold px-4">
          <i class="bi bi-send-fill me-2"></i> Submit Writing Pitch
        </a>
      </div>
    </div>
  </div>

</div>