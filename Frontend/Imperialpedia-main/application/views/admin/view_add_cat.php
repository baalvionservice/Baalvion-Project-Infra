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

   <?php $flash = $this->session->flashdata('msg'); if(!empty($flash)): ?>
   <div class="container">
      <div class="alert <?php echo (stripos($flash, 'fail') !== false || stripos($flash, 'but ') !== false) ? 'alert-warning' : 'alert-success'; ?>"><?php echo $flash; ?></div>
   </div>
   <?php endif; ?>

   <?php echo form_open('imp-admin/add_cat', array('name' => 'add_page', 'id' => 'add_page', 'enctype' => 'multipart/form-data')); ?>

      <div class="container">

         <label for="last name"><b>Category Name:</b></label>

         <input class="form-control" type="text"  name="cat" value="" required>

         <br/>

         <label><b>Category image:</b> <small class="text-muted">(any size up to 20 MB, auto-shrunk to about 300 KB)</small></label>
         <input type="file" name="section_img" accept="image/png,image/jpeg,image/webp,image/gif"/>
         <br/><br/>
         <button type="submit" class="btn btn-default" name="submit" value="Add">Add</button>

      </div>

   </form>

</div>