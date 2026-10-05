<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');


function debug($ele = array()) {
    echo '<pre>';
    print_r($ele);
    $data=debug_backtrace();
    echo '<br>File Name => '.$data[0]['file'];
    echo '<br>Line No => '.$data[0]['line'];
} 
if (!function_exists('author_avatar_url')) {
    // Uploaded photos are stored as "uploads/author/x.jpg" so they survive a domain change;
    // with no photo, show a neutral initials tile rather than someone else's face.
    function author_avatar_url($avatar, $name = '') {
        $avatar = trim((string)$avatar);
        if ($avatar !== '') {
            return preg_match('#^(https?:)?//#', $avatar) ? $avatar : base_url(ltrim($avatar, '/'));
        }
        $parts = preg_split('/\s+/', trim(preg_replace('/[^\p{L}\s]/u', '', (string)$name)));
        $initials = '';
        foreach (array_slice(array_filter($parts), 0, 2) as $w) $initials .= mb_strtoupper(mb_substr($w, 0, 1));
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e2e8f0"/><text x="100" y="118" font-family="Arial,sans-serif" font-size="72" font-weight="700" text-anchor="middle" fill="#475569">' . htmlspecialchars($initials) . '</text></svg>';
        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }
}

if (!function_exists('seo_excerpt')) {
    // Plain-text summary cut at a word boundary, for meta descriptions.
    function seo_excerpt($html, $max = 155) {
        $t = trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags((string)$html), ENT_QUOTES, 'UTF-8')));
        if (mb_strlen($t) <= $max) return $t;
        $cut = mb_substr($t, 0, $max);
        $sp = mb_strrpos($cut, ' ');
        return rtrim(mb_substr($cut, 0, $sp > 60 ? $sp : $max), " ,;:-") . '…';
    }
}


if (!function_exists('post_author')) {
    // The author row for a post, or null when none is assigned.
    function post_author($post) {
        static $cache = array();
        $id = (int)(is_array($post) ? ($post['author_id'] ?? 0) : $post);
        if ($id < 1) return null;
        if (!array_key_exists($id, $cache)) {
            $CI =& get_instance();
            $CI->load->database();
            $row = $CI->db->get_where('author', array('id' => $id))->row_array();
            if ($row) {
                $row['url'] = base_url('author/' . $row['slug']);
                $row['avatar_url'] = author_avatar_url($row['avatar'] ?? '', $row['name']);
            }
            $cache[$id] = $row ?: null;
        }
        return $cache[$id];
    }
}

if (!function_exists('post_read_minutes')) {
    function post_read_minutes($html) {
        return max(1, (int)ceil(str_word_count(strip_tags((string)$html)) / 200));
    }
}

if (!function_exists('render_related_reading')) {
    // Turns the "Related reading: <a>…</a>, <a>…</a>" sentence stored in article bodies into a card grid
    // (image, section, title, read time). Cards are built from the database, so links always use the real URL.
    function render_related_reading($html) {
        if (strpos((string)$html, 'imp-related-reading') === false) return $html;
        return preg_replace_callback('#<p class="imp-related-reading">(.*?)</p>#s', function ($m) {
            if (!preg_match_all('#<a [^>]*href="([^"]+)"#i', $m[1], $links)) return $m[0];
            $CI =& get_instance();
            $CI->load->database();
            $cards = '';
            foreach (array_unique($links[1]) as $href) {
                $uri = basename(rtrim(parse_url($href, PHP_URL_PATH) ?: '', '/'));
                if ($uri === '') continue;
                $row = $CI->db->select('p.post_title, p.uri, p.post_img, p.post_desc, c.cat_name, s.sub_cat_name')
                    ->from('post p')
                    ->join('category c', 'c.cat_id = p.cat_id')
                    ->join('sub_category s', 's.sub_cat_id = p.sub_cat_id')
                    ->where('p.uri', $uri)->where('p.status', 'published')
                    ->get()->row_array();
                if (!$row) continue;
                $url = base_url(str_replace(' ', '-', $row['cat_name']) . '/' . str_replace(' ', '-', $row['sub_cat_name']) . '/' . str_replace(' ', '-', $row['uri']));
                $img = '';
                if (!empty($row['post_img'])) {
                    $src = post_thumb($row['post_img'], 480);
                    $img = '<span class="imp-rel-thumb"><img src="' . htmlspecialchars($src) . '" alt="" loading="lazy" onerror="this.parentNode.style.display=\'none\'"></span>';
                }
                $cards .= '<a class="imp-rel-card" href="' . htmlspecialchars($url) . '">' . $img
                    . '<span class="imp-rel-body"><span class="imp-rel-tag">' . htmlspecialchars($row['sub_cat_name']) . '</span>'
                    . '<span class="imp-rel-title">' . htmlspecialchars(ucfirst($row['post_title'])) . '</span>'
                    . '<span class="imp-rel-meta">' . post_read_minutes($row['post_desc']) . ' min read</span></span></a>';
            }
            if ($cards === '') return $m[0];
            return '<aside class="imp-related" aria-label="Related reading"><h3 class="imp-related-head">Related reading</h3><div class="imp-rel-grid">' . $cards . '</div></aside>';
        }, $html);
    }
}

if (!function_exists('related_reading_uris')) {
    // Post slugs already linked from the article's "Related reading" block, so the bottom grid can skip them.
    function related_reading_uris($html) {
        $out = array();
        if (preg_match('#<p class="imp-related-reading">(.*?)</p>#s', (string)$html, $m) && preg_match_all('#<a [^>]*href="([^"]+)"#i', $m[1], $l)) {
            foreach ($l[1] as $href) {
                $out[] = basename(rtrim(parse_url($href, PHP_URL_PATH) ?: '', '/'));
            }
        }
        return $out;
    }
}

if (!function_exists('upload_image_url')) {
    // Full URL for a stored image name. Older rows hold a complete URL (Cloudinary), newer ones a file in uploads/<dir>/.
    function upload_image_url($dir, $file) {
        $file = trim((string)$file);
        if ($file === '') return '';
        if (preg_match('#^https?://#i', $file)) return $file;
        return base_url('uploads/' . $dir . '/' . $file);
    }
}

if (!function_exists('brand_name')) {
    // Display name for a sub-category. A few keep an old spelling in their URL, so the real brand name is shown instead.
    function brand_name($name) {
        static $map = array('envanto' => 'Envato', 'grammerly' => 'Grammarly', 'quillbot' => 'QuillBot', 'amazon prime' => 'Amazon Prime Video', 'hotstar' => 'Disney+ Hotstar');
        $key = strtolower(trim((string)$name));
        return isset($map[$key]) ? $map[$key] : ucwords($name);
    }
}

if (!function_exists('post_thumb')) {
    // URL of a resized WebP copy of an uploaded post image (made once with GD, then served as a plain file).
    // Falls back to the original if the file is missing, remote, already small, or GD cannot read it.
    function post_thumb($file, $width = 640) {
        $file = trim((string)$file);
        if ($file === '') return '';
        if (preg_match('#^https?://#i', $file)) return $file;
        $dir = FCPATH . 'uploads/post/';
        $src = $dir . $file;
        $orig = base_url('uploads/post/' . $file);
        if (!is_file($src) || !function_exists('imagewebp')) return $orig;
        $name = preg_replace('/[^A-Za-z0-9_.-]/', '_', pathinfo($file, PATHINFO_FILENAME));
        $out = $dir . 'thumbs/' . (int)$width . '-' . $name . '.webp';
        if (!is_file($out)) {
            $info = @getimagesize($src);
            if (!$info || $info[0] <= $width) return $orig;
            switch ($info[2]) {
                case IMAGETYPE_PNG:  $im = @imagecreatefrompng($src); break;
                case IMAGETYPE_JPEG: $im = @imagecreatefromjpeg($src); break;
                case IMAGETYPE_WEBP: $im = @imagecreatefromwebp($src); break;
                default: return $orig;
            }
            if (!$im) return $orig;
            $h = (int)round($info[1] * ($width / $info[0]));
            $dst = imagecreatetruecolor((int)$width, $h);
            imagealphablending($dst, false); imagesavealpha($dst, true);
            imagefill($dst, 0, 0, imagecolorallocatealpha($dst, 255, 255, 255, 127));
            imagecopyresampled($dst, $im, 0, 0, 0, 0, (int)$width, $h, $info[0], $info[1]);
            if (!is_dir($dir . 'thumbs')) { @mkdir($dir . 'thumbs', 0775, true); }
            $ok = @imagewebp($dst, $out, 78);
            imagedestroy($im); imagedestroy($dst);
            if (!$ok) return $orig;
        }
        return base_url('uploads/post/thumbs/' . (int)$width . '-' . $name . '.webp');
    }
}

if (!function_exists('embed_social')) {
    // Turns plain Instagram and Facebook post addresses typed or pasted into an article into embedded posts.
    // Works at display time, so nothing in the database changes. Uses the platforms' own iframe embeds
    // (no script is loaded) with lazy loading, and keeps a "view on ..." link underneath.
    function embed_social($html) {
        $html = (string)$html;
        if (stripos($html, 'instagram.com') === false && stripos($html, 'facebook.com') === false && stripos($html, 'fb.watch') === false) return $html;

        // 1) An anchor whose visible text is just the address becomes the bare address.
        $html = preg_replace('#<a\b[^>]*href=["\'](https?://(?:www\.)?(?:instagram\.com|facebook\.com|m\.facebook\.com|fb\.watch)/[^"\']+)["\'][^>]*>\s*(?:https?://[^<]+|www\.[^<]+)\s*</a>#i', '$1', $html);

        $make_ig = function ($m) {
            $url = 'https://www.instagram.com/' . $m[1] . '/' . $m[2] . '/';
            return '<div class="imp-embed imp-embed--ig"><iframe src="' . $url . 'embed/" loading="lazy" title="Instagram post" allowtransparency="true" scrolling="no" frameborder="0"></iframe>'
                 . '<a class="imp-embed-link" href="' . $url . '" target="_blank" rel="noopener nofollow">View this post on Instagram &rarr;</a></div>';
        };
        // 2) Instagram posts, reels and IGTV (not already inside an attribute).
        $html = preg_replace_callback('#(?<![="\'/\w])https?://(?:www\.)?instagram\.com/(p|reel|reels|tv)/([A-Za-z0-9_-]+)/?(?:\?[^\s<"\']*)?#i', function ($m) use ($make_ig) {
            return $make_ig(array(0, $m[1] === 'reels' ? 'reel' : strtolower($m[1]), $m[2]));
        }, $html);

        // 3) Facebook posts, photos, videos and reels.
        $html = preg_replace_callback('#(?<![="\'/\w])https?://(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.watch)/[^\s<"\']+#i', function ($m) {
            $url = rtrim(html_entity_decode($m[0]), '.,;)');
            $is_video = (bool)preg_match('#(fb\.watch|/videos?/|/watch|/reel/)#i', $url);
            if (!$is_video && !preg_match('#(/posts/|/permalink|/photo|/photos/|/share/|/story\.php|story_fbid|/pfbid)#i', $url)) { return $m[0]; }   // a profile or page address: leave as text
            $plugin = $is_video ? 'video' : 'post';
            $src = 'https://www.facebook.com/plugins/' . $plugin . '.php?href=' . rawurlencode($url) . '&show_text=true&width=500';
            return '<div class="imp-embed imp-embed--fb' . ($is_video ? ' imp-embed--fbv' : '') . '"><iframe src="' . htmlspecialchars($src) . '" loading="lazy" title="Facebook post" allowfullscreen="true" scrolling="no" frameborder="0" allow="clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>'
                 . '<a class="imp-embed-link" href="' . htmlspecialchars($url) . '" target="_blank" rel="noopener nofollow">View this post on Facebook &rarr;</a></div>';
        }, $html);
        // A block-level embed cannot sit inside <p>; unwrap paragraphs that hold only an embed.
        $html = preg_replace('#<p\b[^>]*>(?:\s|<br\s*/?>|&nbsp;)*(<div class="imp-embed.*?</div>)(?:\s|<br\s*/?>|&nbsp;)*</p>#is', '$1', $html);
        return $html;
    }
}

if (!function_exists('render_content')) {
    // Everything an article body needs at display time: related-reading cards and social embeds.
    function render_content($html) {
        return embed_social(render_related_reading($html));
    }
}

