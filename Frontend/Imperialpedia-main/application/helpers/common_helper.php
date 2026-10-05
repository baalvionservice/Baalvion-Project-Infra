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
                    $src = (strpos($row['post_img'], 'http') === 0) ? $row['post_img'] : base_url('uploads/post/' . $row['post_img']);
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

