
<style>
  .main-sidebar{
    overflow-y: scroll;
    height: 100%;
  } 
.main-sidebar::-webkit-scrollbar {
  width: 5px;
} 
.main-sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
} 
.main-sidebar::-webkit-scrollbar-thumb {
  background: #3c8dbc
} 
.main-sidebar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

<!-- Left side column. contains the logo and sidebar --> 
<aside class="main-sidebar">
  <section class="sidebar">
  <h5 class="text-center text-light mt-3">CATEGORIES</h5> 
  <ul class="sidebar-menu" data-widget="tree">
  <?php foreach($catss as $cato){?>
      <li>
        <a href="<?php echo base_url() ?>imp-admin/catss/<?php echo str_replace(' ','-',$cato['cat_name'])?>">
        <i class="fa fa-edit"></i> <span class="text-capitalize"><?php echo $cato['cat_name']?></span>
        </a>
      </li>
    <?php } ?>
  </ul>
<br><hr>

         <h5 class="text-center text-light ">SETTINGS</h5>
    <ul class="sidebar-menu" data-widget="tree">
      <li>
        <a href="<?php echo base_url() ?>imp-admin/category">
        <i class="fa fa-solid fa-gear"></i> <span>Category</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url() ?>imp-admin/sub_cat">
         <i class="fa fa-solid fa-gear"></i> <span>Sub Category</span>
        </a>
      </li> 
      <li>
        <a href="<?php echo base_url() ?>imp-admin/quots">
         <i class="fa fa-solid fa-gear"></i> <span>Quots</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url() ?>imp-admin/post">
         <i class="fa fa-solid fa-gear"></i> <span>Post</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url() ?>imp-admin/terms">
         <i class="fa fa-solid fa-gear"></i> <span>Terms</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url() ?>imp-admin/meta">
         <i class="fa fa-solid fa-gear"></i> <span>Meta Tags</span>
        </a>
      </li>
      <li>
        <a href="<?php echo base_url() ?>imp-admin/comment">
         <i class="fa fa-solid fa-gear"></i> <span>Comments</span>
        </a>
      </li>
    </ul>

  </section>
</aside>