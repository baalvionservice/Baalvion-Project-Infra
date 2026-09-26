<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper">

  

   <section class="content-header">

      <h1>Add Category</h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Add Catagory</li>

      </ol>

   </section>

   <?php //echo '<pre>';print_r($res);?>

   <form name="add_page" id="add_page" method="POST" action="<?php echo base_url()?>imp-admin/add_cat" enctype="multipart/form-data"/>

      <div class="container">

         <label for="last name"><b>Category Name:</b></label>

         <input class="form-control" type="text"  name="cat" value="" required>

         <br/>

         <button type="submit" class="btn btn-default" name="submit" value="Add">Add</button>

      </div>

   </form>

</div>