



  <!-- Content Wrapper. Contains page content -->



  <div class="content-wrapper">



    <!-- Content Header (Page header) -->



    <section class="content-header">



      <h1>



        Dashboard



        



      </h1>



      <ol class="breadcrumb">



        <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>



        <li class="active">Dashboard</li>



      </ol>



    </section>
<div class="container">
  <h2 class="mt-3 mb-3">Categories Overview</h2>
  <?php foreach($catss as $cat): ?>
    <div class="card mb-2">
      <div class="card-header" id="heading<?php echo $cat['cat_id']; ?>">
        <h5 class="mb-0">
          <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse<?php echo $cat['cat_id']; ?>" aria-expanded="false" aria-controls="collapse<?php echo $cat['cat_id']; ?>">
            <?php echo ucfirst($cat['cat_name']); ?>
          </button>
        </h5>
      </div>
      <div id="collapse<?php echo $cat['cat_id']; ?>" class="collapse" aria-labelledby="heading<?php echo $cat['cat_id']; ?>" data-parent=".container">
        <div class="card-body">
          <ul>
            <?php foreach($cat_sub as $sub): ?>
              <?php if($sub['cat_id'] == $cat['cat_id']): ?>
                <li><?php echo ucfirst($sub['sub_cat_name']); ?></li>
              <?php endif; ?>
            <?php endforeach; ?>
          </ul>
        </div>
      </div>
    </div>
  <?php endforeach; ?>
</div>
<!-- Command Dashboard -->
<h2 class="mt-3 mb-3">Command Dashboard</h2>
<p>Here you can view and manage system commands.</p>

<!-- Content Management -->
<h2 class="mt-3 mb-3">Content Management</h2>
<p>Manage articles, posts, and other content.</p>

<!-- Category Taxonomy -->
<h2 class="mt-3 mb-3">Category Taxonomy</h2>
<p>Overview of categories and their hierarchy.</p>

<!-- System Overview -->
<h2 class="mt-3 mb-3">System Overview</h2>
<p>Summary of system status and metrics.</p>
    



  </div>



  <!-- /.content-wrapper -->







 







