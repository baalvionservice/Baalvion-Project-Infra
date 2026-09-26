<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1>  Edit Meta </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Edit Meta</li>
      </ol>
   </section>
   <form name="edit_meta" id="edit_meta" method="POST" action="<?php echo base_url(); ?>imp-admin/meta_update"  enctype="multipart/form-data">
      <?php  foreach($res as $val) { ?>
      <div class="container">
          <label for="last name"><b>Page URL (Enter after base url):</b></label>
         <input type="text" class="form-control" name="page_url" placeholder="<?php echo base_url()?>" value="<?php echo $val['page_url']; ?>" required>
         <br/> 
         <label for="last name"><b>Meta title:</b></label>
         <input class="form-control" type="text"  name="meta_title" value="<?php echo $val['meta_title']; ?>" required>
         <br/>
         <label for="last name"><b>Meta Description:</b></label>
         <textarea class="form-control" name="meta_des" id="meta_des"  cols="30" rows="5" required><?php echo $val['meta_desc']; ?></textarea>
         <br/>
         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['meta_id']; ?>" />
         <button type="submit" class="btn btn-default" name="submit" value="Update">Update</button>
      </div>
      <?php }  ?>
   </form>
</div>