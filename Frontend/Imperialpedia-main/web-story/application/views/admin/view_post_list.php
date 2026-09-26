<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper"> 



   <section class="content-header">

      <h1>  Posts </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Posts</li>

      </ol>

   </section>

   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>

   <a href="<?php echo base_url(); ?>imp-admin/add_post" style="float:right;">Add Post</a>

   <br/>

   <table id="example" class="table table-striped table-bordered" style="width:100%;padding-left:1%;">

      <thead>

         <tr>

            <th>Title</th>

            <th>Category</th>

            <th>Sub Category</th>

            <th>Posted time</th>

            <th>Action</th>

         </tr>

      </thead>

      <tbody>

         <?php  foreach($res as $val) {  ?>

         <tr>

            <td><?php echo $val['post_title']; ?></td> 

            <td><?php echo $val['cat_name']; ?></td>

            <td><?php echo $val['sub_cat_name']; ?></td>

            <td><?php echo $val['posted_date']; ?></td>

            <td><a href="<?php echo base_url(); ?>imp-admin/edit_post/<?php echo $val['post_id']; ?>">Edit</a>/<a onclick="del_confirm('<?php echo $val['post_id']; ?>');" href="<?php echo base_url(); ?>imp-admin/del_post/<?php echo $val['post_id']; ?>">Delete</a></td>

         </tr>

         <?php } ?>

      </tbody>

   </table>

</div>



<script>

   function del_confirm(val){ 

       var con = confirm('Are you sure want to delete this Post?'); 

       if(con==true){ 

           window.location.href="<?php echo base_url(); ?>imp-admin/del_post/"+val; 

       }else{ 

           return false; 

       }   

   } 

</script>