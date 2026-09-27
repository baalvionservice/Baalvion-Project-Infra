<div class="content-wrapper" style="min-height: 900px; background-color: #f8fafc; padding: 25px;">
  <!-- Header -->
  <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 20px 25px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div>
      <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">Edit Writer / Author</h2>
      <p style="color: #64748b; margin: 0; font-size: 13px;">Change the details or photo. The profile URL follows the name unless you edit it yourself.</p>
    </div>
    <a href="<?php echo base_url('imp-admin/authors'); ?>" style="background: #f1f5f9; color: #334155; padding: 9px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #cbd5e1;">
      <i class="fa fa-arrow-left"></i> Back to Authors List
    </a>
  </div>

  <?php if($this->session->flashdata('msg')): ?>
    <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 14px 20px; border-radius: 10px; margin-bottom: 20px; font-weight: 600;">
      <i class="fa fa-exclamation-circle" style="margin-right: 8px;"></i> <?php echo $this->session->flashdata('msg'); ?>
    </div>
  <?php endif; ?>

  <?php if($this->session->flashdata('err_msg')): ?>
    <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 14px 20px; border-radius: 10px; margin-bottom: 20px; font-weight: 600;">
      <i class="fa fa-exclamation-circle" style="margin-right: 8px;"></i> <?php echo $this->session->flashdata('err_msg'); ?>
    </div>
  <?php endif; ?>

  <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 850px;">
    <form action="<?php echo base_url('imp-admin/update_author'); ?>" method="POST" enctype="multipart/form-data">
      <input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>">
      <input type="hidden" name="id" value="<?php echo (int)$author['id']; ?>">

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Full Name *</label>
          <input type="text" name="name" required value="<?php echo htmlspecialchars((string)($author['name'] ?? '')); ?>" placeholder="e.g. Dr. Emily Carter" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Professional Title / Role *</label>
          <input type="text" name="title" required list="title-suggestions" autocomplete="off" value="<?php echo htmlspecialchars((string)($author['title'] ?? '')); ?>" placeholder="e.g. Senior Financial Analyst" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Profile URL</label>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#64748b;font-size:13px;white-space:nowrap;"><?php echo base_url('author/'); ?></span>
            <input type="text" id="author-slug" name="slug" value="<?php echo htmlspecialchars((string)($author['slug'] ?? '')); ?>" pattern="[a-z0-9\-]+" title="lowercase letters, numbers and hyphens" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Credentials / Badge</label>
          <input type="text" name="credentials" value="<?php echo htmlspecialchars((string)($author['credentials'] ?? '')); ?>" placeholder="e.g. CFA • 10+ Yrs Experience" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Profile Photo (upload a new one to replace; JPG / PNG / WebP, max 10 MB)</label>
          <img src="<?php echo htmlspecialchars(author_avatar_url($author['avatar'] ?? '', $author['name'])); ?>" alt="Current photo" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:8px;display:block;">
          <input type="file" name="avatar_file" accept="image/jpeg,image/png,image/webp" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #f8fafc;">
          <input type="url" name="avatar" placeholder="or paste a new image URL (leave empty to keep current)" style="margin-top: 8px; width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Author Bio / Summary *</label>
        <textarea name="bio" rows="4" required placeholder="Provide a brief overview of the author's expertise, background, and published topics..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; font-family: inherit;"><?php echo htmlspecialchars((string)($author['bio'] ?? '')); ?></textarea>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Topics & Specialties (Comma-Separated)</label>
        <input type="text" name="topics" value="<?php echo htmlspecialchars((string)($author['topics'] ?? '')); ?>" placeholder="Web SEO, Fintech, Credit Cards, Healthcare Policy" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">LinkedIn Profile URL</label>
          <input type="url" name="linkedin" value="<?php echo htmlspecialchars((string)($author['linkedin'] ?? '')); ?>" placeholder="https://linkedin.com/in/username" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Twitter / X Profile URL</label>
          <input type="url" name="twitter" value="<?php echo htmlspecialchars((string)($author['twitter'] ?? '')); ?>" placeholder="https://x.com/username" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
        <a href="<?php echo base_url('imp-admin/authors'); ?>" style="background: #f1f5f9; color: #475569; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Cancel</a>
        <button type="submit" name="submit" value="1" style="background: #2563eb; color: #ffffff; padding: 10px 24px; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          <i class="fa fa-save" style="margin-right: 6px;"></i> Save Changes
        </button>
      </div>
    <script>
(function(){
  var name=document.querySelector('input[name=name]'), slug=document.getElementById('author-slug');
  var make=function(v){return v.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');};
  var touched=false; slug.addEventListener('input',function(){touched=true;});
  name.addEventListener('input',function(){ if(!touched) slug.value=make(name.value); });
})();
</script>
<datalist id="title-suggestions">
        <?php foreach (($title_suggestions ?? []) as $t): ?><option value="<?php echo htmlspecialchars($t); ?>"><?php endforeach; ?>
      </datalist>
    </form>
  </div>
</div>
