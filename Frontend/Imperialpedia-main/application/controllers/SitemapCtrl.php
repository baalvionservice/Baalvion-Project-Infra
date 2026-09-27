<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// The static sitemap.xml this replaced was a one-time 2022 export hardcoded to
// www.imperialpedia.com — the wrong domain, and frozen in time. This generates
// the real thing from the live database on every request.
class SitemapCtrl extends CI_Controller{

    public function __construct(){
        parent::__construct();
        $this->load->database();
    }

    // robots.txt is generated so the Sitemap line always names the host the request came in on;
    // the same file then works on legacy.imperialpedia.com and after the move to imperialpedia.com.
    public function robots(){
        header('Content-Type: text/plain; charset=utf-8');
        echo "User-agent: *\nAllow: /\nDisallow: /imp-admin/\nDisallow: /login\nDisallow: /register\nDisallow: /user/\nDisallow: /forgot-password\n\n";
        echo 'Sitemap: ' . rtrim(base_url(), '/') . "/sitemap.xml\n";
    }

    public function index(){
        $base = rtrim(base_url(), '/');
        $slug = function($v){ return strtolower(str_replace(' ', '-', trim($v))); };

        $urls = array();
        $urls[] = array('loc' => $base . '/', 'lastmod' => null, 'priority' => '1.0');

        $static_pages = array(
            'about', 'contact', 'careers', 'disclaimer', 'privacy-policy',
            'editorial-policy', 'terms-use', 'advertise', 'author',
        );
        foreach($static_pages as $p){
            $urls[] = array('loc' => $base . '/' . $p, 'lastmod' => null, 'priority' => '0.5');
        }

        // Sub-category pages that actually have real content — either a real
        // sub_cat_desc article or at least one published post. Skips pages
        // with nothing behind them (e.g. news/usa) and orphaned subcategories
        // whose cat_id doesn't match a real category (can't build a valid URL).
        $this->db->select('c.cat_name, s.sub_cat_name, CHAR_LENGTH(s.sub_cat_desc) AS desc_len, COUNT(p.post_id) AS post_count, MAX(p.post_updated) AS latest_post');
        $this->db->from('sub_category s');
        $this->db->join('category c', 'c.cat_id = s.cat_id');
        $this->db->join('post p', 'p.sub_cat_id = s.sub_cat_id AND p.status = "published"', 'left');
        $this->db->group_by('s.sub_cat_id, c.cat_name, s.sub_cat_name, s.sub_cat_desc');
        $subcats = $this->db->get()->result_array();
        foreach($subcats as $sc){
            if($sc['desc_len'] < 50 && $sc['post_count'] == 0){
                continue;
            }
            $loc = $base . '/' . $slug($sc['cat_name']) . '/' . $slug($sc['sub_cat_name']);
            $urls[] = array('loc' => $loc, 'lastmod' => $sc['latest_post'], 'priority' => '0.7');
        }

        // Individual published posts.
        $this->db->select('p.uri, p.post_updated, c.cat_name, s.sub_cat_name');
        $this->db->from('post p');
        $this->db->join('category c', 'c.cat_id = p.cat_id', 'left');
        $this->db->join('sub_category s', 's.sub_cat_id = p.sub_cat_id', 'left');
        $this->db->where('p.status', 'published');
        $posts = $this->db->get()->result_array();
        foreach($posts as $p){
            // A post whose category/sub-category link is broken (data bug, not
            // a routing bug) has no valid canonical URL to list here.
            if(empty($p['cat_name']) || empty($p['sub_cat_name'])){
                continue;
            }
            $path = $slug($p['cat_name']) . '/' . $slug($p['sub_cat_name']) . '/' . $slug($p['uri']);
            $urls[] = array('loc' => $base . '/' . $path, 'lastmod' => $p['post_updated'], 'priority' => '0.8');
        }

        header('Content-Type: application/xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach($urls as $u){
            echo "  <url>\n";
            echo "    <loc>" . htmlspecialchars($u['loc'], ENT_XML1 | ENT_QUOTES) . "</loc>\n";
            if(!empty($u['lastmod'])){
                echo "    <lastmod>" . date('c', strtotime($u['lastmod'])) . "</lastmod>\n";
            }
            echo "    <priority>" . $u['priority'] . "</priority>\n";
            echo "  </url>\n";
        }
        echo '</urlset>';
    }
}
