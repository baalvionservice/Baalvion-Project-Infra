<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper"> 



   <section class="content-header">

      <h1>  Edit Term </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Edit Term</li>

      </ol>

   </section>

   <?php echo form_open('imp-admin/update_term', array('name' => 'edit_meta', 'id' => 'edit_meta', 'enctype' => 'multipart/form-data')); ?>

      <?php  foreach($res as $val){?>

      <div class="container"><br>

         <label for="last name"><b>Term Name:</b></label>

         <input type="text" class="form-control" name="name" value="<?php echo $val['term_name']; ?>" required>

         <br/>

         <label for="last name"><b>Term Category:</b></label>

         <input type="text" class="form-control" name="cat" value="<?php echo $val['term_category']; ?>" required>

         <br/>

         <label for="last name"><b>Posted By:</b></label>

         <input type="text" class="form-control" name="by" value="<?php echo $val['posted_by']; ?>" required>

         <br/>

         <label for="last name"><b>Reviewed By:</b></label>

         <input type="text" class="form-control" name="review" value="<?php echo $val['reviewed_by']; ?>" required>

         <br/> 

         <label for="last name"><b>Description:</b></label>

         <textarea type="text" class="form-control" id="desc" name="desc"><?php echo $val['term_desc']; ?></textarea>

         <br/>

         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['term_id']; ?>" />

         <button type="submit" class="btn btn-default" name="submit" value="Update">Update</button>

      </div>

      <?php }  ?>

   </form>

</div> 



<script>

   CKEDITOR.replace( 'desc' );

</script>