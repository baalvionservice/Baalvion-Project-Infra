<?php
/**
 * SEO fields for a sub-category: meta title, meta description, and a live Google-style preview.
 * Expects (all optional): $seo_title, $seo_desc, $seo_url (the public address shown in the preview).
 * Saved into the `meta` table under the page address "category/sub-category" (see AdminCtrl::save_subcat_meta()).
 */
$seo_title = isset($seo_title) ? $seo_title : '';
$seo_desc  = isset($seo_desc) ? $seo_desc : '';
$seo_url   = isset($seo_url) ? $seo_url : 'category/sub-category';
?>
<div class="well" style="margin:18px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc">
   <label for="meta_title"><b>Meta Title</b> <small class="text-muted">(the blue headline in Google; keep it under 60 characters)</small></label>
   <input type="text" class="form-control" id="meta_title" name="meta_title" maxlength="120" value="<?php echo htmlspecialchars($seo_title); ?>" placeholder="Leave empty to use the sub-category name">
   <small id="meta_title_count" class="text-muted"></small>
   <br/><br/>
   <label for="meta_desc"><b>Meta Description</b> <small class="text-muted">(the grey text under it; 120 to 160 characters works best)</small></label>
   <textarea class="form-control" id="meta_desc" name="meta_desc" rows="3" maxlength="320" placeholder="One clear sentence that tells a reader what they will find here."><?php echo htmlspecialchars($seo_desc); ?></textarea>
   <small id="meta_desc_count" class="text-muted"></small>

   <div style="margin-top:14px">
      <b>Search result preview</b>
      <div style="margin-top:6px;padding:12px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;max-width:640px;font-family:Arial,sans-serif">
         <div id="seo_prev_url" style="font-size:12px;color:#202124;word-break:break-all"></div>
         <div id="seo_prev_title" style="font-size:19px;line-height:1.3;color:#1a0dab;margin:2px 0"></div>
         <div id="seo_prev_desc" style="font-size:13px;line-height:1.5;color:#4d5156"></div>
      </div>
   </div>
</div>
<script>
(function(){
   var t = document.getElementById('meta_title'), d = document.getElementById('meta_desc');
   var catSel = document.getElementById('subcat_id'), nameEl = document.querySelector('input[name="subcat_name"]');
   var base = <?php echo json_encode(rtrim(base_url(), '/')); ?>, fallbackUrl = <?php echo json_encode($seo_url); ?>;
   function slug(v){ return (v || '').toLowerCase().trim().replace(/[^a-z0-9\s-]+/g, ' ').trim().replace(/[\s-]+/g, '-'); }
   function count(el, out, lo, hi){
      var n = el.value.length; out.textContent = n + ' characters';
      out.style.color = (n === 0) ? '#64748b' : (n > hi ? '#b91c1c' : (n < lo ? '#b45309' : '#15803d'));
   }
   function draw(){
      var cat = catSel ? slug(catSel.options[catSel.selectedIndex].text) : '', sub = nameEl ? slug(nameEl.value) : '';
      var path = (cat && sub) ? cat + '/' + sub : fallbackUrl;
      document.getElementById('seo_prev_url').textContent = base.replace(/^https?:\/\//, '') + ' › ' + path.replace(/\//g, ' › ');
      var title = t.value.trim() || (nameEl ? nameEl.value.trim() : '') || 'Page title';
      document.getElementById('seo_prev_title').textContent = title.length > 60 ? title.slice(0, 57) + '...' : title;
      var desc = d.value.trim() || 'No description yet. Google will pick a snippet from the page text.';
      document.getElementById('seo_prev_desc').textContent = desc.length > 160 ? desc.slice(0, 157) + '...' : desc;
      count(t, document.getElementById('meta_title_count'), 30, 60);
      count(d, document.getElementById('meta_desc_count'), 120, 160);
   }
   [t, d, catSel, nameEl].forEach(function(el){ if(el){ el.addEventListener('input', draw); el.addEventListener('change', draw); } });
   draw();
})();
</script>
