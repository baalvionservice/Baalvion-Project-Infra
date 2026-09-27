<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper"> 

   <section class="content-header">
      <h1>   Add Term </h1>
      <ol class="breadcrumb">
         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
         <li class="active">Add Term</li>
      </ol>
   </section>
   <form name="add_meta" id="add_meta" method="POST" action=""  enctype="multipart/form-data">
      <div class="container">  <br>
         <div id="tit"></div>
         <label for="last name"><b>Term Name:</b></label>
         <input type="text" class="form-control" name="name" value="" required>
         <br/>
         <label for="last name"><b>Term Category:</b></label>
         <input type="text" class="form-control" name="cat" value="" required>
         <br/>
         <label for="last name"><b>Posted By:</b></label>
         <input type="text" class="form-control" name="by" value="" required>
         <br/>
         <label for="last name"><b>Reviewed By:</b></label>
         <input type="text" class="form-control" name="review" value="" required>
         <br/>
         <label for="last name"><b>Description:</b></label>
         <textarea type="text" class="form-control" id="desc" name="desc"></textarea>
         <br/>
         <button type="submit" class="btn btn-default" name="submit" value="Add">Add</button>
      </div>
   </form>
</div>

<script>
   CKEDITOR.replace( 'desc' );
</script>