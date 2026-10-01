<?php
// Expects $row (the post). Prints the avatar + author + date block of the article byline.
$au = post_author($row);
$date = !empty($row['post_updated']) ? $row['post_updated'] : $row['posted_date'];
?>
<div class="d-flex align-items-center gap-3">
   <?php if($au){ ?>
      <img src="<?php echo htmlspecialchars($au['avatar_url']); ?>" alt="<?php echo htmlspecialchars($au['name']); ?>" width="42" height="42" class="rounded-circle flex-shrink-0" style="object-fit:cover;">
   <?php } ?>
   <div>
      <?php if($au){ ?>
         <div>
            <a href="<?php echo $au['url']; ?>" rel="author" class="fw-bold text-dark text-decoration-none"><?php echo htmlspecialchars($au['name']); ?></a>
            <span class="text-muted" style="font-size:0.85rem;">&middot; <?php echo htmlspecialchars($au['title']); ?></span>
         </div>
      <?php } ?>
      <div class="text-muted" style="font-size: 0.8rem;">
         Published <?php echo date('F d, Y', strtotime($row['posted_date'])); ?>
         <?php if(!empty($row['post_updated']) && date('Y-m-d', strtotime($row['post_updated'])) !== date('Y-m-d', strtotime($row['posted_date']))){ ?>
            &bull; Updated <?php echo date('F d, Y', strtotime($row['post_updated'])); ?>
         <?php } ?>
         &bull; <?php echo post_read_minutes($row['post_desc'] ?? ''); ?> min read
      </div>
   </div>
</div>
