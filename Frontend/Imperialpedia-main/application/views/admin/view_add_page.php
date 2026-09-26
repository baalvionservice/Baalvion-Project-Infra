<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper">

  

   <section class="content-header">

      <h1>Add Page</h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Add Page</li>

      </ol>

   </section>

   <?php //echo '<pre>';print_r($res);?>

   <?php echo form_open('imp-admin/add_page', array('name' => 'add_page', 'id' => 'add_page', 'enctype' => 'multipart/form-data')); ?>

      <div class="container">

         <label for="last name"><b>Title:</b></label>

         <input class="form-control" type="text"  name="title" value="" required>

         <br/>

         <label for="last name"><b>Page url:</b></label>

         <input  class="form-control" type="text"  name="url" value="" required>

         <br/>

         <button type="submit" class="btn btn-default" name="submit" value="Add">Add</button>

      </div>

   </form>

</div>