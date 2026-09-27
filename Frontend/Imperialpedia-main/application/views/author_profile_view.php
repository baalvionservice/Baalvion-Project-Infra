<?php
/**
 * Imperialpedia — Individual Author Profile & Articles Page
 * URL: /author/{slug}
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

/* Author Header Banner */
.profile-banner {
   background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
   color: #ffffff;
   border-bottom: 4px solid var(--p6-red);
   padding: 45px 0 35px 0;
   margin-bottom: 35px;
}

.profile-avatar {
   width: 120px;
   height: 120px;
   border-radius: 50%;
   object-fit: cover;
   border: 4px solid #ffffff;
   box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.profile-name {
   font-family: var(--p6-font-headline);
   font-weight: 800;
   font-size: 2.4rem;
   color: #ffffff;
   margin-bottom: 6px;
   letter-spacing: -0.025em;
}

.profile-title {
   font-size: 1.1rem;
   color: #f87171;
   font-weight: 700;
   margin-bottom: 12px;
}

.article-card {
   background: #ffffff;
   border: 1px solid #e2e8f0;
   border-radius: 10px;
   padding: 24px;
   margin-bottom: 20px;
   box-shadow: 0 4px 15px rgba(0,0,0,0.03);
   transition: transform 0.2s ease, border-color 0.2s ease;
}

.article-card:hover {
   transform: translateY(-2px);
   border-color: #cbd5e1;
}

.article-title-link {
   font-family: var(--p6-font-headline);
   font-weight: 800;
   font-size: 1.35rem;
   color: #0f172a;
   text-decoration: none;
   line-height: 1.3;
   display: block;
   margin-bottom: 8px;
}

.article-title-link:hover {
   color: var(--p6-red);
}
</style>

<!-- PROFILE HEADER BANNER -->
<div class="profile-banner">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-md-3 text-center text-md-start mb-3 mb-md-0">
        <img src="<?php echo htmlspecialchars($author['avatar']); ?>" alt="<?php echo htmlspecialchars($author['name']); ?>" class="profile-avatar">
      </div>
      <div class="col-md-9 text-center text-md-start">
        <div class="badge bg-danger text-uppercase fw-bold mb-2">
          <i class="bi bi-shield-check me-1"></i> VERIFIED EXPERT WRITER
        </div>
        <h1 class="profile-name"><?php echo htmlspecialchars($author['name']); ?></h1>
        <div class="profile-title"><?php echo htmlspecialchars($author['title']); ?></div>
        
        <p class="text-white-50 small mb-3 max-w-700">
          <?php echo htmlspecialchars($author['bio']); ?>
        </p>

        <div class="d-flex align-items-center gap-3 justify-content-center justify-content-md-start flex-wrap">
          <span class="badge bg-secondary text-white p-2">
            <i class="bi bi-award me-1"></i> <?php echo htmlspecialchars($author['credentials']); ?>
          </span>
          <span class="badge bg-dark text-white p-2">
            <i class="bi bi-journal-text me-1"></i> <?php echo count($author['articles']); ?> Published Guides
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="container mb-5">
  <div class="row">
    <!-- MAIN CONTENT: AUTHOR'S PUBLISHED ARTICLES -->
    <div class="col-lg-8">
      
      <div class="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
        <h3 class="fw-bold text-dark m-0">
          <i class="bi bi-journal-richtext text-danger me-2"></i> Articles Authored by <?php echo htmlspecialchars($author['name']); ?>
        </h3>
        <span class="badge bg-danger"><?php echo count($author['articles']); ?> Total</span>
      </div>

      <?php if (!empty($author['articles']) && is_array($author['articles'])): ?>
        <?php foreach ($author['articles'] as $art): ?>
          <div class="article-card">
            <div class="d-flex align-items-center gap-2 mb-2">
              <span class="badge bg-dark text-uppercase"><?php echo htmlspecialchars($art['category']); ?></span>
              <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> <?php echo htmlspecialchars($art['date']); ?></small>
              <small class="text-muted me-2">&bull; <?php echo htmlspecialchars($art['read_time'] ?? '5 min read'); ?></small>
            </div>

            <a href="<?php echo $art['url']; ?>" class="article-title-link">
              <?php echo htmlspecialchars($art['title']); ?>
            </a>

            <p class="text-secondary small mb-3">
              <?php echo htmlspecialchars($art['excerpt']); ?>
            </p>

            <a href="<?php echo $art['url']; ?>" class="btn btn-sm btn-outline-danger fw-bold">
              Read Full Article <i class="bi bi-arrow-right me-1"></i>
            </a>
          </div>
        <?php endforeach; ?>
      <?php else: ?>
        <div class="alert alert-light border text-muted">
          No articles currently listed for this author.
        </div>
      <?php endif; ?>

      <div class="mt-4">
        <a href="<?php echo base_url('author'); ?>" class="btn btn-dark fw-bold">
          <i class="bi bi-arrow-left me-1"></i> Back to All Writers & Editorial Board
        </a>
      </div>

    </div>

    <!-- RIGHT SIDEBAR: AUTHOR INFO & CONTACT -->
    <div class="col-lg-4">
      
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-dark text-white fw-bold">
          <i class="bi bi-person-badge text-warning me-2"></i> AUTHOR CREDENTIALS & TOPICS
        </div>
        <div class="card-body">
          <h6 class="fw-bold text-uppercase text-danger extra-small mb-2">Core Expertise Areas:</h6>
          <div class="mb-3">
            <?php foreach ($author['topics'] as $topic): ?>
              <span class="badge bg-light text-dark border me-1 mb-1 p-2"><?php echo htmlspecialchars($topic); ?></span>
            <?php endforeach; ?>
          </div>

          <h6 class="fw-bold text-uppercase text-danger extra-small mb-2">Editorial Verification:</h6>
          <p class="small text-muted mb-3">
            Articles by <?php echo htmlspecialchars($author['name']); ?> adhere to the Imperialpedia Editorial Policy, requiring primary source documentation, empirical data verification, and peer review.
          </p>

          <a href="<?php echo base_url('editorial-policy'); ?>" class="btn btn-sm btn-outline-dark w-100 fw-bold">
            Read Editorial Policy
          </a>
        </div>
      </div>

      <!-- AD / FEATURED TOOL WIDGET -->
      <div class="card bg-primary text-white p-4 rounded shadow-sm">
        <h5 class="fw-bold mb-2"><i class="bi bi-envelope-paper me-2"></i> Follow <?php echo htmlspecialchars($author['name']); ?>'s Work</h5>
        <p class="small text-white-50 mb-3">Get notified whenever <?php echo htmlspecialchars($author['name']); ?> publishes new research or analytical guides.</p>
        <form action="<?php echo base_url('subscribe'); ?>" method="POST">
          <div class="mb-2">
            <input type="email" name="email" class="form-control" placeholder="Enter your email" required>
          </div>
          <button type="submit" class="btn btn-warning w-100 fw-bold">Subscribe to Updates</button>
        </form>
      </div>

    </div>
  </div>
</div>
