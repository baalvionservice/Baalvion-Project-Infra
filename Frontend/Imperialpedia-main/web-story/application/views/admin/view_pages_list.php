<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper">

   <section class="content-header">

      <h1> Pages </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Pages</li>

      </ol>

   </section>

   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>

   <a href="<?php echo base_url(); ?>imp-admin/add_page" style="float:right;">Add Page</a>

   <br/>

   <table id="example" class="table table-striped table-bordered" style="width:100%;padding-left:1%;">

      <thead>

         <tr>

            <th>Title</th>

            <th>Posted time</th>

            <th>Action</th>

         </tr>

      </thead>

      <tbody>

         <?php 

            foreach($res as $val) { 

            ?>

         <tr>

            <td><?php echo $val['title']; ?></td>

            <td><?php echo $val['added_date']; ?></td>

            <td><a href="<?php echo base_url(); ?>imp-admin/page_edit/<?php echo $val['id']; ?>">Edit</a>/<a onclick="del_confirm('<?php echo $val['id']; ?>');" href="<?php echo base_url(); ?>imp-admin/del_page/<?php echo $val['id']; ?>">Delete</a></td>

         </tr>

         <?php } ?>

      </tbody>

   </table>

</div>





<!-- delete conformation  -->

<script>

   function del_confirm(val){

       var con = confirm('Are you sure want to delete this Page?'); 

       if(con==true){ 

           window.location.href="<?php echo base_url()?>imp-admin/del_page/"+val;

       }else{ 

           return false; 

       }  

   }

 </script>