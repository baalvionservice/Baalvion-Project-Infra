<!-- read more  -->
<?php if(!empty($post)){?>
<style>.cust-cd{ background: #222; color: #fff; box-shadow: 0 5px 15px rgb(0 0 0 / 8%);} .hash-tag{ margin-bottom: 10px; font-size: 13px; font-weight: 300; text-decoration: none; color: #007bff;} .cust-cd .card-title{ font-size: 18px; font-weight: bold; color: #ddd; letter-spacing: .9px; line-height: 28px; text-transform: uppercase; margin: 12px 0px;} .cust-cd .bottom-cd{ font-size: 14px; font-weight: 300; line-height: 24px; color: #888;} .bottom-cd{ display: flex; justify-content: space-between;} .slick-arrow{ display: none !important;} @media (min-width: 768px){ .cust-cd .card-title{ font-size: 1.2rem;}}</style>
<div class="container my-5">
   <h2 class="other-imp">Learn about other daily use editor</h2>
   <div class="center-slide">
   <?php  foreach($post as $gsl){  ?>
      <div class="card p-0 cust-cd m-1">
         <img src="<?php echo base_url() ?>assets/img/one.jpg" class="card-img-top" style="border-radius:.8em" alt="...">
         <div class="card-body">
            <a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'editor/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst['uri']); ?>" class="hash-tag">#<?php echo strtoupper(str_replace('-',' ',$this->uri->segment(2)));?></a>
            <h5 class="card-title"><?php echo strtouppercase($pst['post_alt_title']);?></h5>
            <div class="ml-3 bottom-cd"><span class="posted-dt text-uppercase">NOVEMBER 18, 2021</span><span class="comm-share"><i class="fa-solid fa-message"></i></span><span class="comm-share"><i class="fa-solid fa-share-nodes"></i></span><span class="comm-share"><i class="fa-solid fa-thumbs-up"></i></span></div>
         </div>
      </div>
     <?php } ?>
   </div>
</div>
<?php }?>



<?php foreach($post as $pst1){ ?>
                  <li class="post-list"><a href="<?php echo base_url();foreach($get_subcat_info as $subcat_info){echo 'editor/'.str_replace(' ','-',$subcat_info['sub_cat_name']);}; echo '/'.str_replace(' ','-',$pst1['uri']); ?>"><?php echo ucfirst($pst1['post_title']);?></a></li>
               <?php } ?>