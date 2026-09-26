<?php
// Lead image for a sub-category page: its own image, else its category's.
$sb = !empty($get_subcat_info[0]) ? $get_subcat_info[0] : (!empty($post[0]) ? $post[0] : null);
if($sb){
   $sb_src = !empty($sb['sub_cat_image']) ? 'uploads/subcategory/' . $sb['sub_cat_image']
           : (!empty($sb['cat_image']) ? 'uploads/category/' . $sb['cat_image'] : '');
   if($sb_src !== ''){ ?>
<div class="container" style="max-width:1100px;margin:16px auto 0;">
   <img src="<?php echo base_url() . htmlspecialchars($sb_src); ?>" alt="<?php echo htmlspecialchars(ucfirst($sb['sub_cat_name'])); ?>" width="1100" height="440" style="width:100%;height:auto;max-height:440px;object-fit:cover;border-radius:8px;display:block;">
</div>
<?php } } ?>
