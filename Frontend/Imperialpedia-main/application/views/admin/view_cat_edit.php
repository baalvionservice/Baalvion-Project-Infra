<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper">

  

   <section class="content-header">

      <h1> Edit Page</h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Edit Page</li>

      </ol>

   </section>

   <?php $flash = $this->session->flashdata('msg'); if(!empty($flash)): ?>
   <div class="container">
      <div class="alert <?php echo (stripos($flash, 'fail') !== false || stripos($flash, 'but ') !== false) ? 'alert-warning' : 'alert-success'; ?>"><?php echo $flash; ?></div>
   </div>
   <?php endif; ?>

   <?php echo form_open('imp-admin/update_cat', array('name' => 'edit_cat', 'id' => 'edit_page', 'enctype' => 'multipart/form-data')); ?>

      <?php 

         foreach($res as $val){

         ?>

      <div class="container">

         <label for="last name"><b>Category Name:</b></label>

         <input class="form-control" type="text"  name="title" value="<?php echo $val['cat_name']; ?>" required>

         <br/>

         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['cat_id']; ?>" />

         <label><b>Category image:</b> <small class="text-muted">(any size up to 20 MB, auto-shrunk to about 300 KB)</small></label>
         <input type="file" name="section_img" accept="image/png,image/jpeg,image/webp,image/gif"/>
         <?php if(!empty($val['cat_image'])): ?><img src="<?php echo base_url(); ?>uploads/category/<?php echo $val['cat_image']; ?>" style="max-width:200px;max-height:120px;margin-top:8px;border:1px solid #ddd;padding:4px;"/><?php endif; ?>
         <br/><br/>
         <button type="submit" class="btn btn-default" name="submit" value="Update">Update</button>

      </div>

      <?php  } ?>

   </form>

</div>