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
