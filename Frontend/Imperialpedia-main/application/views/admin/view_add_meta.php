<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper"> 
   <section class="content-header">
      <h1> Add Meta </h1>
      <ol class="breadcrumb">
         <li><a href="<?php echo base_url()?>imp-admin/meta"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Add Meta</li>
      </ol>
   </section>
   <?php echo form_open('', array('name' => 'add_meta', 'id' => 'add_meta', 'enctype' => 'multipart/form-data')); ?>
      <div class="container"> 
         <label for="last name"><b>Page URL (Enter after base url):</b></label>
         <input type="text" class="form-control" name="page_url" placeholder="<?php echo base_url()?>" value="" required>
         <br/>
         <label for="last name"><b>Meta title:</b></label>
         <input type="text" class="form-control" name="meta_title" value="" required>
         <br/>
         <label for="last name"><b>Meta Description:</b></label>
         <textarea class="form-control" name="meta_des" id="meta_des" cols="30" rows="5" required></textarea>
         <br/>
         <button type="submit" class="btn btn-default" name="submit" value="Add">Add</button>
      </div>
   </form>
</div> 