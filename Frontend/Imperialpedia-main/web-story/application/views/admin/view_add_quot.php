<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper"> 



   <section class="content-header">

      <h1>   Add Quot  </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Add Quot</li>

      </ol>

   </section>

   <form name="add_meta" id="add_meta" method="POST" action=""  enctype="multipart/form-data">

      <div class="container">

         <label for="last name"><b>Page:</b></label>

         <select name="page_url" id="page_url" class="form-control">

            <option value="">--Select Page--</option>

            <?php 

               foreach($get_pages as $val_page){ 

               ?>

            <option value="<?php echo $val_page['page_url'];?>"><?php echo $val_page['title']; ?></option>

            <?php } ?>

         </select>

         <br/>

         <div id="tit"></div>

         <label for="last name"><b>Quot Title:</b></label>

         <input type="text" class="form-control" name="quot_name" value="" required>

         <br/>
         <label for="last name"><b>Quot By (Name):</b></label>

         <input type="text" class="form-control" name="quot_by" value="" required>

         <br/>

         <label for="last name"><b>Quot:</b></label>

         <textarea type="text" class="form-control" id="desc" name="desc"></textarea>

         <br/>

         <button type="submit" class="btn btn-default" name="submit" value="Add">Add</button>

      </div>

   </form>

</div>



<script>

   CKEDITOR.replace( 'desc' );

</script>