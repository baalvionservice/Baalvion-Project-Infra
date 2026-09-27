<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper"> 



   <section class="content-header">

      <h1>  Edit Quot </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Edit Quot</li>

      </ol>

   </section>

   <?php echo form_open('imp-admin/update_quot', array('name' => 'edit_meta', 'id' => 'edit_meta', 'enctype' => 'multipart/form-data')); ?>

      <?php  foreach($res as $val) {?>

      <div class="container">

         <label for="last name"><b>Page:</b></label>

         <select class="form-control" name="page_url" id="page_url">

            <option value="0">--Select Page--</option>

            <?php  

               foreach($get_pages as $all_page){

               ?>

            <option value="<?php echo $all_page['page_url'];?>" 

            <?php  if($all_page['page_url'] ==$val['page_url'] ) {echo 'selected'; } ?>><?php echo $all_page['title']; ?></option>

            <?php } ?> 

         </select>

         <label for="last name"><b>Quot Title:</b></label>

         <input class="form-control" type="text"  name="quot_name" value="<?php echo $val['quot_title']; ?>" required>

         <br/>
         <label for="last name"><b>Quot By (Name):</b></label>

         <input type="text" class="form-control" name="quot_by" value="<?php echo $val['quot_by']; ?>" required>

         <br/>

         <label for="last name"><b>Quot:</b></label>

         <textarea type="text" class="form-control" id="desc" name="desc"><?php echo $val['quot_txt']; ?></textarea>

         <br/>

         <input type="hidden" name="upd_id" id="upd_id" value="<?php echo $val['quot_id']; ?>" />

         <button type="submit" class="btn btn-default" name="submit" value="Update">Update</button>

      </div>

      <?php }  ?>

   </form>

</div> 



<script>

   CKEDITOR.replace( 'desc' );

</script>