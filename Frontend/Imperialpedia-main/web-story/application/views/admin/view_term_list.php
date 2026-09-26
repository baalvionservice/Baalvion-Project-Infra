<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper">

  

   <section class="content-header">

      <h1> Terms </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Terms</li>

      </ol>

   </section>

   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>

   <a href="<?php echo base_url(); ?>imp-admin/add_term" style="float:right;">Add term</a>

   <br/>

   <table id="example" class="table table-striped table-bordered" style="width:100%;padding-left:1%;">

      <thead>

         <tr>

            <th>Term</th>

            <th>Category</th>

            <th>Posted time</th>

            <th>Action</th>

         </tr>

      </thead>

      <tbody>

         <?php  

            foreach($res as $val) {   

            ?> 

         <tr>

            <td><?php echo $val['term_name']; ?></td>

            <td><?php echo $val['term_category']; ?></td>

            <td><?php echo $val['added_date']; ?></td>

            <td><a href="<?php echo base_url(); ?>imp-admin/term_edit/<?php echo $val['term_id']; ?>">Edit</a>/<a onclick="del_confirm('<?php echo $val['term_id']; ?>');" href="<?php echo base_url(); ?>imp-admin/del_term/<?php echo $val['term_id']; ?>">Delete</a></td>

         </tr>

         <?php } ?>

      </tbody>

   </table>

</div>



<script>

   function del_confirm(val){ 

       var con = confirm('Are you sure want to delete this Term?'); 

       if(con==true){ 

           window.location.href="<?php echo base_url(); ?>imp-admin/del_term/"+val; 

       }else{ 

           return false; 

       }   

   } 

</script>