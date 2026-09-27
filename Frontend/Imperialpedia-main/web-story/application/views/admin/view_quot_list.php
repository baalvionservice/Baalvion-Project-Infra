<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper">

  

   <section class="content-header">

      <h1> Quots </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active"> Quots </li>

      </ol>

   </section>

   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>

   <a href="<?php echo base_url(); ?>imp-admin/add_quot" style="float:right;">Add Quot</a>

   <br/>

   <table id="example" class="table table-striped table-bordered" style="width:100%;padding-left:1%;">

      <thead>

         <tr>

            <th>Quots</th>

            <th>Pages</th>

            <th>Posted time</th>

            <th>Action</th>

         </tr>

      </thead>

      <tbody>

         <?php  

            foreach($res as $val) {   

            ?> 

         <tr>

            <td><?php echo $val['quot_title']; ?></td>

            <td><?php echo $val['page_url']; ?></td>

            <td><?php echo $val['added_date']; ?></td>

            <td><a href="<?php echo base_url(); ?>imp-admin/quot_edit/<?php echo $val['quot_id']; ?>">Edit</a>/<a onclick="del_confirm('<?php echo $val['quot_id']; ?>');" href="<?php echo base_url(); ?>imp-admin/del_quot/<?php echo $val['quot_id']; ?>">Delete</a></td>

         </tr>

         <?php } ?>

      </tbody>

   </table>

</div>



<script>

   function del_confirm(val){ 

       var con = confirm('Are you sure want to delete this Quot?'); 

       if(con==true){ 

           window.location.href="<?php echo base_url(); ?>imp-admin/del_quot/"+val; 

       }else{ 

           return false; 

       }   

   } 

</script>