<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
  
  <section class="content-header" style="padding: 20px 25px 10px 25px;">
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h1 class="m-0 fw-bold" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.8rem; color: #0f172a;">
          <i class="fa fa-users text-info me-2"></i> Writers & Editorial Board Manager
        </h1>
        <small class="text-muted">Manage verified author profiles, credentials, bios, & publication assignments</small>
      </div>
      <div>
        <a href="<?php echo base_url('imp-admin/add_author'); ?>" class="btn btn-info btn-sm fw-bold me-1 text-white">
          <i class="fa fa-user-plus me-1"></i> Add New Writer
        </a>
        <a href="<?php echo base_url('author'); ?>" target="_blank" class="btn btn-outline-dark btn-sm fw-bold">
          <i class="fa fa-external-link me-1"></i> View Writers Hub
        </a>
      </div>
    </div>
  </section>

  <section class="content" style="padding: 15px 25px;">
    <?php if ($this->session->flashdata('msg')): ?>
      <div class="alert alert-info fw-bold"><?php echo $this->session->flashdata('msg'); ?></div>
    <?php endif; ?>
    
    <div class="card border-0 shadow-sm rounded">
      <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
        <span><i class="fa fa-id-card me-2"></i> Editorial Board Members</span>
        <span class="badge bg-info text-dark"><?php echo count($authors ?? []); ?> Verified Writers</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle m-0">
          <thead class="table-light">
            <tr>
              <th>Writer</th>
              <th>Role & Title</th>
              <th>Credentials</th>
              <th>Matching Articles</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <?php if (!empty($authors) && is_array($authors)): ?>
              <?php foreach ($authors as $author): ?>
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img src="<?php echo htmlspecialchars($author['avatar'] ?? ''); ?>" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                      <div>
                        <strong class="text-dark"><?php echo htmlspecialchars($author['name'] ?? ''); ?></strong>
                        <div class="extra-small text-muted">Slug: <code><?php echo htmlspecialchars($author['slug'] ?? ''); ?></code></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="fw-bold text-danger extra-small"><?php echo htmlspecialchars($author['title'] ?? ''); ?></span>
                  </td>
                  <td>
                    <small class="text-muted"><?php echo htmlspecialchars($author['credentials'] ?? ''); ?></small>
                  </td>
                  <td>
                    <span class="badge bg-primary"><?php echo count($author['articles'] ?? []); ?> Articles</span>
                    <?php if (!empty($author['suggested'])): ?>
                      <div class="extra-small text-muted mt-1">Could also cover:
                        <?php foreach ($author['suggested'] as $sg): ?>
                          <span class="badge bg-light text-dark border"><?php echo htmlspecialchars($sg['topic']); ?> (<?php echo (int)$sg['posts']; ?>)</span>
                        <?php endforeach; ?>
                      </div>
                    <?php endif; ?>
                  </td>
                  <td>
                    <a href="<?php echo base_url('author/' . htmlspecialchars($author['slug'] ?? '')); ?>" target="_blank" class="btn btn-xs btn-outline-danger fw-bold">
                      <i class="fa fa-user"></i> Profile
                    </a>
                    <a href="<?php echo base_url('imp-admin/edit_author/' . (int)($author['id'] ?? 0)); ?>" class="btn btn-xs btn-info text-white fw-bold ms-1">
                      <i class="fa fa-pencil"></i> Edit
                    </a>
                    <a href="<?php echo base_url('imp-admin/del_author/' . htmlspecialchars($author['id'] ?? $author['slug'] ?? '')); ?>" onclick="return confirm('Delete this author profile?');" class="btn btn-xs btn-outline-dark fw-bold ms-1">
                      <i class="fa fa-trash"></i> Delete
                    </a>
                  </td>

                </tr>
              <?php endforeach; ?>
            <?php else: ?>
              <tr>
                <td colspan="5" class="text-muted text-center py-4">No authors registered.</td>
              </tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>


    <div class="card border-0 shadow-sm rounded mt-4">
      <div class="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
        <span><i class="fa fa-lightbulb-o me-2"></i> Expertise Suggestions — based on what the site publishes</span>
        <span class="badge bg-warning text-dark"><?php echo count(array_filter($coverage ?? [], function($c){ return $c['posts'] > 0 && !$c['writers']; })); ?> topics without a writer</span>
      </div>
      <div class="card-body pb-0">
        <small class="text-muted">Each topic below is a section of this site. A topic is a gap when it has published articles but no writer lists a matching expertise. Add a real writer for it, or add the topic to an existing writer's expertise if it is genuinely theirs.</small>
      </div>
      <div class="table-responsive">
        <table class="table table-sm align-middle m-0">
          <thead class="table-light"><tr><th>Topic</th><th>Section</th><th>Published articles</th><th>Writers covering it</th><th></th></tr></thead>
          <tbody>
            <?php foreach (($coverage ?? []) as $c): if ($c['posts'] < 1) continue; ?>
              <tr>
                <td class="fw-bold"><?php echo htmlspecialchars($c['topic']); ?></td>
                <td><?php echo htmlspecialchars($c['category']); ?></td>
                <td><?php echo (int)$c['posts']; ?></td>
                <td>
                  <?php if ($c['writers']): echo htmlspecialchars(implode(', ', $c['writers'])); else: ?>
                    <span class="badge bg-danger">No writer</span>
                  <?php endif; ?>
                </td>
                <td>
                  <?php if (!$c['writers']): ?>
                    <a class="btn btn-xs btn-outline-primary fw-bold" href="<?php echo base_url('imp-admin/add_author?topics=' . urlencode($c['topic'])); ?>"><i class="fa fa-user-plus"></i> Add writer</a>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</div>
