<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1> Comment's Info.</h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Comment's Info.</li>
      </ol>
   </section>
   <form>
      <?php foreach($res as $val){ ?>
      <div class="container">
         <label for="last name"><b>Name:</b></label>
         <input class="form-control" value="<?php echo $val['commenter_name']; ?>" readonly>
         <br/>
         <label for="last name"><b>User Id:</b></label>
         <input class="form-control"   value="<?php echo $val['comment_userid']; ?>" readonly>
         <br/>
         <label for="last name"><b>Page:</b></label>
         <input class="form-control"   value="<?php echo $val['comment_page']; ?>" readonly>
         <br/>
         <label for="last name"><b>text:</b></label>
         <input class="form-control"   value="<?php echo $val['comment_txt']; ?>" readonly>
         <br/> 
         <label for="last name"><b>Status:</b></label>
         <input class="form-control"   value="<?php echo $val['comment_approve']; ?>" readonly>
         <br/> 
         <label for="last name"><b>Date:</b></label>
         <input class="form-control"   value="<?php echo $val['added_date']; ?>" readonly>
         <br/> 
      </div>
      <?php  } ?>
   </form>
</div>