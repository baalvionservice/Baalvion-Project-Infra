<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1> Comments </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Comments</li>
      </ol>
   </section>
   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5> 
   <br/>
   <table id="example" class="table table-striped table-bordered" style="width:100%;padding-left:1%;">
      <thead>
         <tr>
            <th>Name</th>
            <th>Text</th>
            <th>Posted time</th>
            <th>Action</th>
         </tr>
      </thead>
      <tbody>
         <?php 
            foreach($res as $val) { 
            ?>
         <tr>
            <td><?php echo $val['commenter_name']; ?></td>
            <td><?php echo $val['comment_txt']; ?></td>
            <td><?php echo $val['added_date']; ?></td>
            <td><a class="btn btn-info" href="<?php echo base_url(); ?>imp-admin/comm_more_info/<?php echo $val['comment_id']; ?>">More Info.</a>
                <a class="btn btn-success mx-2" href="<?php echo base_url(); ?>imp-admin/comm_approve/<?php echo $val['comment_id']; ?>">Approve</a>
                <a class="btn btn-danger" onclick="del_confirm('<?php echo $val['comment_id']; ?>');" href="<?php echo base_url(); ?>imp-admin/comm_delete/<?php echo $val['comment_id']; ?>">Delete</a></td>
         </tr>
         <?php } ?>
      </tbody>
   </table>
</div>


<!-- delete conformation  -->
<script>
   function del_confirm(val){
       var con = confirm('Are you sure want to delete this comm?'); 
       if(con==true){ 
           window.location.href="<?php echo base_url()?>imp-admin/del_comm/"+val;
       }else{ 
           return false; 
       }  
   }
 </script>