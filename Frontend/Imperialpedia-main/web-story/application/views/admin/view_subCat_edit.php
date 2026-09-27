<!-- <style> #cookie,#cookieLevel{display: none;} </style> -->
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1>  Edit Sub Category </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Edit Sub Category</li>
      </ol>
   </section>
   <form name="edit_meta" id="edit_meta" method="POST" action="<?php echo base_url(); ?>imp-admin/update_subcat"  enctype="multipart/form-data">
      <?php  foreach($res as $val) {?>
      <div class="container">
         <label for="last name"><b>Category:</b></label>
         <select class="form-control" name="subcat_id" id="subcat_id">
            <option value="0">--Select Category--</option>
            <?php 
               foreach($get_cats as $all_cats){
               
               ?>
            <option value="<?php echo $all_cats['cat_id'];?>" 
               <?php  if($all_cats['cat_id'] ==$val['cat_id'] ) {echo 'selected'; } ?>><?php echo $all_cats['cat_name']; ?></option>
            <?php } ?>
            <!-- <script>
               document.getElementById('subcat_id').value="<?php echo $val['sub_cat_id']; ?>";
               
               </script> -->
         </select>
         <label for="last name"><b>Sub Catagory Name:</b></label>
         <input class="form-control" type="text"  name="subcat_name" value="<?php echo $val['sub_cat_name']; ?>" required>
         <br/>
         <label for="last name"><b>Description:</b></label>
         <textarea type="text" class="form-control" id="desc" name="desc"><?php echo $val['sub_cat_desc']; ?></textarea>
         <br/> 
         <label for="last name"><b>Author Info:</b></label>
         <div class="px-2" style="background-color: #3c8dbc1c">
            <label for="last name">Author name:</label>
            <input type="text" class="form-control w-50 d-inline" id="author" name="author" value="<?php echo $val['author_name']; ?>">
            <label for="last name" class="ml-4">Auther Image:</label>
            <input type="file" name="aimg"/>
            <img src="<?php echo base_url()?>uploads/author/<?php echo $val['author_img']; ?>" height="50" width="50"/>
         </div>
         <br/>
         <label for="last name"><b>Tags:</b></label>
         <input type="text" class="form-control" id="tags"  name="tags" value="<?php echo $val['tags']; ?>">
         <br/>
         <label for="last name" id="cookieLevel"><b>Cookie:</b></label> 
         <textarea type="text" class="form-control" id="cookie" name="cookie"><?php echo $val['cookie']; ?></textarea>
         <br/>
         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['sub_cat_id']; ?>" />
         <button type="submit" class="btn btn-default" name="submit" value="Update">Update</button>
      </div>
      <?php }  ?>
   </form>
</div>
<script>
   CKEDITOR.replace( 'desc' );
   
</script>