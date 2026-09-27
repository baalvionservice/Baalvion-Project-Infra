<!-- Content Wrapper. Contains page content -->

<div class="content-wrapper"> 



   <section class="content-header">

      <h1>  Posts </h1>

      <ol class="breadcrumb">

         <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>

         <li class="active">Posts</li>

      </ol>

   </section>

   <h5 class="text-center"><?php echo $this->session->flashdata('msg'); ?></h5>

   <a href="<?php echo base_url(); ?>imp-admin/add_post" style="float:right;">Add Post</a>

   <br/>

   <div id="post-finder" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 1% 14px 1%;">
      <input id="pf-q" type="search" autofocus autocomplete="off" placeholder="Search any article: title, section, topic or status  (press / to jump here)"
             style="flex:1 1 380px;min-width:260px;padding:11px 14px;font-size:15px;border:2px solid #2563eb;border-radius:8px;outline:none;">
      <select id="pf-cat" style="padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;">
         <option value="">All sections</option>
         <?php foreach (array_unique(array_filter(array_column($res, 'cat_name'))) as $cn): ?>
            <option value="<?php echo htmlspecialchars($cn); ?>"><?php echo htmlspecialchars(ucfirst($cn)); ?></option>
         <?php endforeach; ?>
      </select>
      <label style="margin:0;font-size:14px;display:flex;align-items:center;gap:6px;cursor:pointer;">
         <input id="pf-short" type="checkbox"> Short articles only (under 400 words)
      </label>
      <span id="pf-count" style="font-weight:700;color:#334155;"></span>
   </div>

   <table id="example" class="table table-striped table-bordered" style="width:100%;padding-left:1%;">

      <thead>

         <tr>

            <th>Title</th>

            <th>Category</th>

            <th>Sub Category</th>

            <th>Status</th>

            <th>Words</th>

            <th>Posted time</th>

            <th>Action</th>

         </tr>

      </thead>

      <tbody>

         <?php  foreach($res as $val) {  ?>

         <tr>

            <td><?php echo $val['post_title']; ?><?php if(!empty($val['is_page'])): ?> <span style="background:#dbeafe;color:#1e40af;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700;">PAGE</span><?php endif; ?></td> 

            <td><?php echo $val['cat_name']; ?></td>

            <td><?php echo $val['sub_cat_name']; ?></td>

            <td><?php echo ucfirst($val['status']); ?></td>

            <?php $wc = count(preg_split('/\s+/', trim(preg_replace('/<[^>]*>/', ' ', (string)($val['post_desc'] ?? ''))), -1, PREG_SPLIT_NO_EMPTY)); ?>
            <td data-order="<?php echo $wc; ?>"><?php echo $wc; ?><?php if ($wc < 400): ?> <span style="background:#fef3c7;color:#92400e;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700;">SHORT</span><?php endif; ?></td>

            <td><?php echo $val['posted_date']; ?></td>

            <?php if(!empty($val['is_page'])): ?>
            <td><a href="<?php echo base_url(); ?>imp-admin/subcat_edit/<?php echo $val['post_id']; ?>">Edit</a></td>
            <?php else: ?>
            <td><a href="<?php echo base_url(); ?>imp-admin/edit_post/<?php echo $val['post_id']; ?>">Edit</a>/<a onclick="del_confirm('<?php echo $val['post_id']; ?>');" href="<?php echo base_url(); ?>imp-admin/del_post/<?php echo $val['post_id']; ?>">Delete</a></td>
            <?php endif; ?>

         </tr>

         <?php } ?>

      </tbody>

   </table>

</div>



<script>
window.addEventListener('load', function(){
   var $ = window.jQuery; if (!$ || !$.fn.DataTable) return;
   if ($.fn.DataTable.isDataTable('#example')) { $('#example').DataTable().destroy(); }
   var t = $('#example').DataTable({ pageLength: 200, lengthChange: false, dom: 't<"mt-2"i>p', order: [[5, 'desc']],
      language: { info: 'Showing _TOTAL_ articles', infoFiltered: '(of _MAX_)', zeroRecords: 'No article matches. Try fewer words.' } });
   var q = document.getElementById('pf-q'), cat = document.getElementById('pf-cat'), sh = document.getElementById('pf-short');
   $.fn.dataTable.ext.search.push(function(settings, row){
      return !sh.checked || parseInt(row[4], 10) < 400;
   });
   function run(){
      t.search(q.value);
      t.column(1).search(cat.value ? '^' + cat.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$' : '', true, false);
      t.draw();
   }
   q.addEventListener('input', run); cat.addEventListener('change', run); sh.addEventListener('change', run);
   document.addEventListener('keydown', function(e){
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); q.select(); }
   });
   q.focus();
});

   function del_confirm(val){ 

       var con = confirm('Are you sure want to delete this Post?'); 

       if(con==true){ 

           window.location.href="<?php echo base_url(); ?>imp-admin/del_post/"+val; 

       }else{ 

           return false; 

       }   

   } 

</script>