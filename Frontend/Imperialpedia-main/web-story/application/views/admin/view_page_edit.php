<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper">

  

   <section class="content-header">

      <h1> Edit Page</h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Edit Page</li>

      </ol>

   </section>

   <form name="edit_page" id="edit_page" method="POST" action="<?php echo base_url(); ?>imp-admin/update_page"  enctype="multipart/form-data"/>

      <?php 

         foreach($res as $val) 

         {

         ?>

      <div class="container">

         <label for="last name"><b>Title:</b></label>

         <input class="form-control" type="text"  name="title" value="<?php echo $val['title']; ?>" required>

         <br/>

         <label for="last name"><b>Page url:</b></label>

         <input class="form-control" type="text"  name="url" value="<?php echo $val['page_url']; ?>" required>

         <br/>

         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['id']; ?>" />

         <button type="submit" class="btn btn-default" name="submit" value="Update">Update</button>

      </div>

      <?php  } ?>

   </form>

</div>