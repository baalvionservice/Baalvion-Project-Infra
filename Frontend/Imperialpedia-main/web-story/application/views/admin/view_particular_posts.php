
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1> All Posts of <?php foreach($subcat as $sc){echo $sc['sub_cat_name'];} ?></h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home </a></li>
         <li><a href="#"><?php foreach($subcat as $sc){echo $sc['sub_cat_name'];} ?></a></li>
         <li class="active">Posts</li>
      </ol>
   </section> 
   <a href="<?php echo base_url(); ?>imp-admin/add_post" style="float:right;"><i class="fa fa-plus-circle mr-1"></i>Add Post</a>
   <br><hr/><br/>


   <style>
      .text-bold{font-weight: 800;color: #fff;padding-top: 1em;}.text-bold:hover{color: #000;}.lad a{text-decoration: none;color: #000;text-decoration: underline;}
    .color1{background-color:#9C27B0 ;}
    .color2{background-color:#D81B60 ;}
    .color3{background-color:#F44336 ;}   
    .color4{background-color: #2196F3;}
    .color5{background-color: #4CAF50;}
    .color6{background-color:#FFEB3B ;}
    .color7{background-color: #FF5722;}
    .color8{background-color:#00E676 ;}
    .color9{background-color:#651FFF ;}
    .color0{background-color: #7e7e7e;}
   </style>
   <div class="container"> 
   <div class="row">
      <?php if(!empty($res)){foreach($res as $re){?>
      <div class="col-lg-3 col-6 mb-3">
         <div class="small-box color<?php echo(rand(0,9))?>">
            <div class="inner">
               <h5 class="text-uppercase text-bold"><?php echo $re['post_title']; ?></h5>
               <p class="lad"><a href="<?php echo base_url(); ?>imp-admin/edit_post/<?php echo $re['post_id']; ?>" class="small-box-footer">Edit Post</a></p>
            </div>
            <div class="icon">
            <i class="fa fa-edit"></i>
            </div> 
            <a href="#" class="small-box-footer">View Post  <i class="fa fa-arrow-right ml-2" aria-hidden="true"></i></a> 
         </div>
      </div>
     <?php }}else{echo 'sorry no post yet..';} ?>
   </div>
</div>
</div>



