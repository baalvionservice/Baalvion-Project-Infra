<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1>  Add Post  </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Add Post</li>
      </ol>
   </section>
   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>
   <?php echo form_open('imp-admin/add_post', array('name' => 'add_post', 'id' => 'add_post', 'enctype' => 'multipart/form-data')); ?>
      <div class="container">
         <label for="last name"><b>Title:</b></label>
         <input type="text" class="form-control" id="post_title"  name="post_title" value="" required>
         <br/>
         <label for="last name"><b>Page url:</b></label>
         <input type="text" class="form-control" id="post_url"  name="post_url" value="" required>
         <br/>
         <label for="last name"><b>Description:</b></label>
         <textarea type="text" class="form-control" id="desc" name="desc"></textarea>
         <br/>
         <label for="last name"><b>Cover image:</b></label>
         <br>
         <div class="px-2" style="background-color: #3c8dbc1c">
            <label for="last name">Image Alt:</label>
            <input type="text" class="form-control w-50 d-inline" id="post_alt_title" name="post_alt_title" value="">
            <label for="last name" class="ml-4">Image:</label>
            <input type="file" name="pimg" id="pimg" accept="image/png,image/jpeg,image/gif"/>
            <br/>
            <img id="pimg_preview" src="" alt="" style="display:none;max-width:200px;max-height:200px;margin-top:10px;border:1px solid #ddd;padding:4px;">
         </div>
         <br/>
         <label for="last name"><b>Category:</b></label>
         <select name="cate" id="cate" class="form-control" onchange="filterSubcats()">
            <option value="">--Select--</option>
            <?php
               foreach($get_category as $get_cate_val){
               ?>
            <option value="<?php echo $get_cate_val['cat_id']; ?>"><?php echo $get_cate_val['cat_name']; ?></option>
            <?php } ?>
         </select>
         <br/>
         <label for="last name"><b>Sub Categopry:</b></label>
         <select name="scat" id="scat" class="form-control">
            <option value="">--Select--</option>
            <?php
               foreach($get_sub_cat as $get_subcat_val){
               ?>
            <option value="<?php echo $get_subcat_val['sub_cat_id']; ?>" data-cat-id="<?php echo $get_subcat_val['cat_id']; ?>"><?php echo $get_subcat_val['sub_cat_name']; ?></option>
            <?php } ?>
         </select>
         <br/>
         <label for="last name"><b>Status:</b></label>
         <select name="status" id="status" class="form-control">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
         </select>
         <br/>
         <div class="px-2 py-2" style="background-color: #3c8dbc1c">
            <label for="meta_title"><b>Meta Title:</b> <small class="text-muted">(shown in search results / browser tab)</small></label>
            <input type="text" class="form-control" id="meta_title" name="meta_title" value="">
            <br/>
            <label for="meta_desc"><b>Meta Description:</b> <small class="text-muted">(shown under the title in search results)</small></label>
            <textarea class="form-control" id="meta_desc" name="meta_desc" rows="2"></textarea>
         </div>
         <br/>
         <button type="submit" class="btn btn-primary" name="submit" value="Add">Add Post</button> <br> <br>
      </div>
   </form>
</div>
<script>
   CKEDITOR.replace( 'desc' );

   // Auto-fill the URL slug from the title, unless the user has typed into
   // the URL field themselves.
   (function(){
      var urlTouched = false;
      var titleEl = document.getElementById('post_title');
      var urlEl = document.getElementById('post_url');
      urlEl.addEventListener('input', function(){ urlTouched = true; });
      titleEl.addEventListener('input', function(){
         if(urlTouched){ return; }
         urlEl.value = titleEl.value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
      });
   })();

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

   // Preview the cover image before uploading.
   document.getElementById('pimg').addEventListener('change', function(e){
      var file = e.target.files[0];
      var preview = document.getElementById('pimg_preview');
      if(file){
         preview.src = URL.createObjectURL(file);
         preview.style.display = 'block';
      }else{
         preview.style.display = 'none';
      }
   });
</script>
