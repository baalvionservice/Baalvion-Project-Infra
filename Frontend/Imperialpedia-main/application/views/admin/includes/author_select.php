<?php
/**
 * "Written by" picker for a post. Expects $authors (rows from the author table) and optional $selected_author (id).
 * The chosen writer shows as the byline and the "Written by" card on the article, and on their author page.
 */
$selected_author = isset($selected_author) ? (int)$selected_author : 0;
?>
<label for="author_id"><b>Author (Written by):</b> <small class="text-muted">(shown on the article byline and the author page)</small></label>
<select name="author_id" id="author_id" class="form-control">
   <option value="">-- Select the writer --</option>
   <?php foreach($authors as $a){ ?>
   <option value="<?php echo (int)$a['id']; ?>" <?php echo ((int)$a['id'] === $selected_author) ? 'selected' : ''; ?>><?php echo htmlspecialchars($a['name'] . (!empty($a['title']) ? ' — ' . $a['title'] : '')); ?></option>
   <?php } ?>
</select>
<a href="<?php echo base_url('imp-admin/add_author'); ?>" target="_blank" class="small">+ Add a new writer</a>
