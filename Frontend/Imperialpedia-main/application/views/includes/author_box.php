<?php
// Expects $row (the post). Prints the "written by" card under an article; nothing if no author is assigned.
$au = post_author($row);
if($au){ ?>
<div class="p6-widget-box mt-4 p-4 d-flex align-items-start gap-3 bg-light border-0 shadow-sm" style="border-radius:12px;">
   <img src="<?php echo htmlspecialchars($au['avatar_url']); ?>" alt="<?php echo htmlspecialchars($au['name']); ?>" width="56" height="56" class="rounded-circle flex-shrink-0" style="object-fit:cover;">
   <div>
      <h4 class="h6 mb-1 fw-bold text-dark">Written by <a href="<?php echo $au['url']; ?>" rel="author" class="text-dark"><?php echo htmlspecialchars($au['name']); ?></a></h4>
      <div class="small text-muted mb-1"><?php echo htmlspecialchars($au['title']); ?></div>
      <?php if(!empty($au['bio'])){ ?><p class="small text-muted mb-1"><?php echo htmlspecialchars($au['bio']); ?></p><?php } ?>
      <a href="<?php echo $au['url']; ?>" class="small fw-bold">More articles by <?php echo htmlspecialchars($au['name']); ?></a>
   </div>
</div>
<?php } ?>
