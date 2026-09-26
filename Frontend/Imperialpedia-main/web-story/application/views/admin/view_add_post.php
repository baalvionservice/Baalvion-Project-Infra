<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1>  Add Post  </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Add Post</li>
      </ol>
   </section>
   <form name="add_post" id="add_post" method="POST" action="<?php echo base_url('imp-admin/add_post'); ?>"  enctype="multipart/form-data">
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
            <input type="file" name="pimg"/>
         </div>
         <br/>
         <label for="last name"><b>Category:</b></label>
         <select name="cate" id="cate" class="form-control">
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
            <option value="<?php echo $get_subcat_val['sub_cat_id']; ?>"><?php echo $get_subcat_val['sub_cat_name']; ?></option>
            <?php } ?>
         </select>
         <br/> 
         <button type="submit" class="btn btn-primary" name="submit" value="Add">Add Post</button> <br> <br>
      </div>
   </form>
</div>
<script>
   CKEDITOR.replace( 'desc' );
   
</script>