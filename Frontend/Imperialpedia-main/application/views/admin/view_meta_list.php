<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <!-- Content Header (Page header) -->
   <section class="content-header">
      <h1> Meta </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Meta</li>
      </ol>
   </section>
   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>
   <a href="<?php echo base_url(); ?>imp-admin/add_meta" style="float:right;">Add Meta</a>
   <br/>
   <?php //echo '<pre>';print_r($res); ?>
   <table id="example" class="table table-striped table-bordered" style="width:100%;padding-left:1%;">
      <thead>
         <tr>
            <th>Page URL</th>
            <th>Posted time</th>
            <th>Action</th>
         </tr>
      </thead>
      <tbody>
         <?php  foreach($res as $val) { ?> 
         <tr>
            <td><?php echo $val['page_url']; ?></td>
            <td><?php echo $val['added_date']; ?></td>
            <td><a href="<?php echo base_url(); ?>imp-admin/edit_meta/<?php echo $val['meta_id']; ?>">Edit</a>/<a onclick="del_confirm('<?php echo $val['meta_id']; ?>');" href="#">Delete</a></td>
         </tr>
         <?php } ?>
      </tbody>
   </table>
</div>
<!-- /.content-wrapper -->
<script>
   function del_confirm(val){ 
       var con = confirm('Are you sure want to delete this Meta?'); 
       if(con==true){ 
           window.location.href="<?php echo base_url(); ?>imp-admin/del_meta/"+val;  
       }else{ 
           return false; 
       }    
   } 
</script>