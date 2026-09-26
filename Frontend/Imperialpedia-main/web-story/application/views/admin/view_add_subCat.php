<style> #cookie,#cookieLevel{display: none;} </style>
<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
   <section class="content-header">
      <h1>   Add Sub Catagory  </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Add Sub Catagory</li>
      </ol>
   </section>
   <form name="add_meta" id="add_meta" method="POST" action=""  enctype="multipart/form-data">
      <div class="container">
         <label for="last name"><b>Category:</b></label>
         <select name="subcat_id" id="subcat_id" class="form-control">
            <option value="">--Select Category--</option>
            <?php 
               foreach($get_cats as $val_cat){  
               ?>
            <option value="<?php echo $val_cat['cat_id'];?>"><?php echo $val_cat['cat_name']; ?></option>
            <?php } ?>
         </select>
         <br/>
         <div id="tit"></div>
         <label for="last name"><b>Sub Catagory Name:</b></label>
         <input type="text" class="form-control" name="subcat_name" value="" required>
         <br/>
         <label for="last name"><b>Description:</b></label>
         <textarea type="text" class="form-control" id="desc" name="desc"></textarea>
         <br/>
         <label for="last name"><b>Author Info:</b></label>
         <div class="px-2" style="background-color: #3c8dbc1c">
            <label for="last name">Author name:</label>
            <input type="text" class="form-control w-50 d-inline" id="author" name="author" value="">
            <label for="last name" class="ml-4">Auther Image:</label>
            <input type="file" name="aimg"/>
         </div>
         <br/>
         <label for="last name"><b>Tags:</b></label>
         <input type="text" class="form-control" id="tags"  name="tags" value="">
         <br/>
         <label for="last name" id="cookieLevel"><b>Cookie:</b></label> 
         <textarea type="text" class="form-control" id="cookie" name="cookie"></textarea>
         <br/> 
         <button type="submit" class="btn btn-default" name="submit" value="Add">Add</button>
         <br/>
      </div>
   </form>
</div>
<script>
   CKEDITOR.replace( 'desc' ); 
</script>