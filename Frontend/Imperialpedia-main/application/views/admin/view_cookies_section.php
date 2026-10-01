<div class="content-wrapper">

  <section class="content-header" style="padding: 20px 25px 10px 25px;">
    <h1 class="m-0 fw-bold" style="font-size: 1.8rem; color: #0f172a;">
      <i class="fa fa-eye-slash text-warning me-2"></i> Cookies Section Visibility
    </h1>
    <small class="text-muted">Control whether the /cookies pages are open to visitors and search engines</small>
  </section>

  <section class="content" style="padding: 15px 25px;">
    <?php if($this->session->flashdata('succ_msg')){ ?>
      <div class="alert alert-success"><?php echo htmlspecialchars($this->session->flashdata('succ_msg')); ?></div>
    <?php } ?>

    <div class="card border-0 shadow-sm rounded p-4" style="max-width: 640px;">
      <div class="mb-3">
        Current status:
        <?php if($enabled){ ?>
          <span class="badge bg-success">LIVE — open to search engines</span>
        <?php } else { ?>
          <span class="badge bg-secondary">HIDDEN — 410 Gone</span>
        <?php } ?>
      </div>

      <p class="text-muted small">
        <strong>Hidden:</strong> every /cookies URL returns 410 Gone with noindex, and the section is removed from the sitemap and the site menu.<br>
        <strong>Live:</strong> the pages work as before and are listed in the sitemap, so search engines can index them again.
      </p>

      <form method="post" action="<?php echo base_url('imp-admin/cookies_section_save'); ?>">
        <input type="hidden" name="enabled" value="<?php echo $enabled ? '0' : '1'; ?>">
        <button type="submit" class="btn btn-lg fw-bold w-100 <?php echo $enabled ? 'btn-danger' : 'btn-success'; ?>">
          <?php echo $enabled ? 'Hide cookies section from search engines' : 'Enable cookies section for search engines'; ?>
        </button>
      </form>
      <small class="text-muted mt-3 d-block">After switching, rebuild the sitemap in Search Console. Google needs days to weeks to re-index or drop pages.</small>
    </div>
  </section>
</div>
