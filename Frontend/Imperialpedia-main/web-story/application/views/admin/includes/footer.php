<footer class="main-footer">
   <strong>Copyright &copy; <?php echo date('Y'); ?> <a href="/">imperialpedia.com</a></strong> All rights
   reserved.
</footer>
</div>


<!-- jQuery 3 -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script src="https://cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js"></script>
<script src="https://kit.fontawesome.com/0fa3aab205.js"></script><!--Font Awesome CDN-->
<script src="https://cdn.datatables.net/1.10.19/js/dataTables.bootstrap4.min.js"></script>


<!-- cookies field add  -->
<script>
$('#subcat_id').on('change',function(){
   var cate_id = $('#subcat_id').val();
         if(cate_id == 6){
            document.getElementById("cookie").style.display = "block";
            document.getElementById("cookieLevel").style.display = "block";
         }
});
</script>

<script>
   $(document).ready(function() {
       $('#example').DataTable();
   }); 
   $(document).on('click','#logout_open',function(){
            $('.user-footer').show(); 
   }); 
   $('.sidebar-toggle').on('click',function(){
         var togg_clsname = $('body').hasClass('sidebar-collapse');
         if(!togg_clsname){
            $('body').addClass('sidebar-collapse');
         }else{
            $('body').removeClass('sidebar-collapse');
         }   
   });
</script>

<script> 
   
   $('#submit').click(function(){
   var files = $('input#loc_img')[0].files;
   if(files.length > 2){ 
       $('#err_fil_msg').text('Please upload maximum 2 files'); 
       return false; 
   }else{ 
        $('#err_fil_msg').text(''); 
        return true; 
   }   
   });
</script>

</body>
</html>