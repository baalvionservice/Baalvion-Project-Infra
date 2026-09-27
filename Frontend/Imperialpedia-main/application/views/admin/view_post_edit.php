<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1>   Edit Post  </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Edit Post</li>
      </ol>
   </section>
   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>
   <?php echo form_open('imp-admin/update_post', array('name' => 'edit_post', 'id' => 'edit_post', 'enctype' => 'multipart/form-data')); ?>
      <?php
         foreach($res as $val){
           $get_avl_cat = explode(',',$val['cat_id']);
           $get_avl_loc = explode(',',$val['sub_cat_id']);
         ?>
      <div class="container">
         <label for="last name"><b>Title:</b></label>
         <input type="text" class="form-control" id="post_title"  name="post_title" value="<?php echo $val['post_title']; ?>" required>
         <br/>
         <label for="last name"><b>Page url:</b></label>
         <input type="text" class="form-control" id="post_url"  name="post_url" value="<?php echo $val['uri']; ?>" required>
         <br/>
         <label for="last name"><b>Description:</b></label>
         <textarea type="text" class="form-control" id="desc" name="desc"><?php echo $val['post_desc']; ?></textarea>
         <br/>
         <label for="last name"><b>Cover image:</b></label>
         <br>
         <div class="px-2" style="background-color: #3c8dbc1c">
            <label for="last name">Image Alt:</label>
            <input type="text" class="form-control w-50 d-inline" id="post_alt_title" name="post_alt_title" value="<?php echo $val['post_alt_title']; ?>">
            <label for="last name" class="ml-4">Image:</label>
            <input type="file" name="pimg" id="pimg" accept="image/png,image/jpeg,image/gif"/>
            <br/>
            <img id="pimg_preview" src="<?php echo base_url();?>uploads/post/<?php echo $val['post_img']; ?>" height="50" width="50" style="margin-top:10px;border:1px solid #ddd;padding:2px;">
         </div>
         <br/>
         <label for="last name"><b>Category:</b></label>
         <select name="cate" id="cate" class="form-control" onchange="filterSubcats()">
            <option value="">--Select--</option>
            <?php foreach($get_category as $all_cats){ ?>
            <option value="<?php echo $all_cats['cat_id'];?>" <?php if($all_cats['cat_id']==$val['cat_id']){echo 'selected';} ?>>  <?php echo $all_cats['cat_name']; ?>  </option>
            <?php } ?>
         </select>
         <br/>
         <label for="last name"><b>Sub Categopry:</b></label>
         <select name="scat" id="scat" class="form-control">
            <option value="">--Select--</option>
            <?php foreach($get_sub_cat as $get_subcat_val){ ?>
            <option value="<?php echo $get_subcat_val['sub_cat_id']; ?>" data-cat-id="<?php echo $get_subcat_val['cat_id']; ?>" <?php if($get_subcat_val['sub_cat_id'] == $val['sub_cat_id']){echo 'selected';} ?>>   <?php echo $get_subcat_val['sub_cat_name']; ?>   </option>
            <?php } ?>
         </select>
         <br/>
         <label for="status"><b>Status:</b></label>
         <select name="status" id="status" class="form-control">
            <option value="draft" <?php if($val['status']=='draft'){echo 'selected';} ?>>Draft</option>
            <option value="published" <?php if($val['status']=='published'){echo 'selected';} ?>>Published</option>
         </select>
         <br/>
         <div class="px-2 py-2" style="background-color: #3c8dbc1c">
            <label for="meta_title"><b>Meta Title:</b> <small class="text-muted">(shown in search results / browser tab)</small></label>
            <input type="text" class="form-control" id="meta_title" name="meta_title" value="<?php echo isset($meta['meta_title']) ? $meta['meta_title'] : ''; ?>">
            <br/>
            <label for="meta_desc"><b>Meta Description:</b> <small class="text-muted">(shown under the title in search results)</small></label>
            <textarea class="form-control" id="meta_desc" name="meta_desc" rows="2"><?php echo isset($meta['meta_desc']) ? $meta['meta_desc'] : ''; ?></textarea>
         </div>
         <br/>
         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['post_id']; ?>" />
         <button type="submit" class="btn btn-primary" name="update" value="Update">Update</button><br><br>
      </div>
      <?php } ?>
   </form>
</div>
<!-- cat on change functions   -->
<script>
   // Only show sub-categories that belong to the selected category.
   function filterSubcats(){
      var catId = document.getElementById('cate').value;
      var scat = document.getElementById('scat');
      var options = scat.querySelectorAll('option[data-cat-id]');
      options.forEach(function(opt){
         var matches = (catId === '' || opt.getAttribute('data-cat-id') === catId);
         opt.hidden = !matches;
         opt.disabled = !matches;
      });
      var selected = scat.options[scat.selectedIndex];
      if(selected && selected.hidden){
         scat.value = '';
      }
   }
   filterSubcats();

   // Preview the cover image before uploading (falls back to the existing image above).
   document.getElementById('pimg').addEventListener('change', function(e){
      var file = e.target.files[0];
      var preview = document.getElementById('pimg_preview');
      if(file){
         preview.src = URL.createObjectURL(file);
         preview.style.width = '200px';
         preview.style.height = 'auto';
      }
   });
</script>
<script>
   CKEDITOR.replace( 'desc' );

</script>
