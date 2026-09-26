<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1>   Edit Post  </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Edit Post</li>
      </ol>
   </section>
   <form name="edit_post" id="edit_post" method="POST" action="<?php echo base_url('imp-admin/update_post'); ?>"  enctype="multipart/form-data">
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
            <input type="file" name="pimg"/>
            <image src="<?php echo base_url();?>uploads/post/<?php echo $val['post_img']; ?>"  height="50" width="50" />
         </div>
         <br/>
         <label for="last name"><b>Category:</b></label>
         <select name="cate" id="cate" class="form-control" onchange="changeSubcat()">
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
            <option value="<?php echo $get_subcat_val['sub_cat_id']; ?>" <?php if($get_subcat_val['sub_cat_id'] == $val['sub_cat_id']){echo 'selected';} ?>>   <?php echo $get_subcat_val['sub_cat_name']; ?>   </option>
            <?php } ?>
         </select>
         <br/> 
         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['post_id']; ?>" />
         <button type="submit" class="btn btn-primary" name="update" value="Update">Update</button><br><br>
      </div>
      <?php } ?>
   </form>
</div>
<!-- cat on change functions   -->
<script>
   function changeSubcat(){ 
   
       var con = document.getElementById('cate').value;
   
      //  alert(con);
   
      //   window.location.href="<?php echo base_url(); ?>imp-admin/del_post/"+val; 
   
   } 
   
</script>
<script>
   CKEDITOR.replace( 'desc' );
   
</script>