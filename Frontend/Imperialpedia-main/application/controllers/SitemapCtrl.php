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
        echo 'Sitemap: ' . rtrim(base_url(), '/') . "/news-sitemap.xml\n";
    }


    // Google News sitemap: articles from the news section published in the last 2 days (Google ignores older ones).
    // A news section post is either a row in `post` or a sub-category that is itself the article (no posts of its own).
    public function news(){
        $base = rtrim(base_url(), '/');
        $slug = function($v){ return strtolower(str_replace(' ', '-', trim($v))); };
        $since = date('Y-m-d H:i:s', time() - 2 * 86400);
        $items = array();

        $this->db->select('p.post_title, p.uri, p.posted_date, c.cat_name, s.sub_cat_name');
        $this->db->from('post p')->join('category c', 'c.cat_id = p.cat_id')->join('sub_category s', 's.sub_cat_id = p.sub_cat_id');
        $this->db->where('p.status', 'published')->where('c.cat_name', 'news')->where('p.posted_date >=', $since);
        foreach($this->db->get()->result_array() as $r){
            $items[] = array('loc' => $base . '/' . $slug($r['cat_name']) . '/' . $slug($r['sub_cat_name']) . '/' . $slug($r['uri']),
                             'date' => $r['posted_date'], 'title' => ucfirst($r['post_title']));
        }
        $rows = $this->db->query("SELECT s.sub_cat_name, s.added_date, c.cat_name, m.meta_title,
                (SELECT COUNT(*) FROM post p WHERE p.sub_cat_id = s.sub_cat_id AND p.status = 'published') AS n
            FROM sub_category s JOIN category c ON c.cat_id = s.cat_id
            LEFT JOIN meta m ON m.page_url = CONCAT(REPLACE(c.cat_name, ' ', '-'), '/', REPLACE(s.sub_cat_name, ' ', '-'))
            WHERE c.cat_name = 'news' AND s.added_date >= ? AND CHAR_LENGTH(s.sub_cat_desc) > 200", array($since))->result_array();
        foreach($rows as $r){
            if((int)$r['n'] > 0){ continue; }
            $items[] = array('loc' => $base . '/' . $slug($r['cat_name']) . '/' . $slug($r['sub_cat_name']),
                             'date' => $r['added_date'], 'title' => !empty($r['meta_title']) ? $r['meta_title'] : ucwords($r['sub_cat_name']));
        }

        header('Content-Type: application/xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";
        foreach($items as $i){
            echo "  <url>\n    <loc>" . htmlspecialchars($i['loc'], ENT_XML1 | ENT_QUOTES) . "</loc>\n    <news:news>\n";
            echo "      <news:publication><news:name>Imperialpedia</news:name><news:language>en</news:language></news:publication>\n";
            echo "      <news:publication_date>" . date('c', strtotime($i['date'])) . "</news:publication_date>\n";
            echo "      <news:title>" . htmlspecialchars($i['title'], ENT_XML1 | ENT_QUOTES) . "</news:title>\n    </news:news>\n  </url>\n";
        }
        echo '</urlset>';
    }

    // RSS 2.0 feed of the 30 newest published articles (feed readers and search engines use it to find new pages fast).
    public function feed(){
        $base = rtrim(base_url(), '/');
        $slug = function($v){ return strtolower(str_replace(' ', '-', trim($v))); };
        $rows = $this->db->query("SELECT p.post_title, p.uri, p.post_desc, p.posted_date, p.post_updated, c.cat_name, s.sub_cat_name
            FROM post p JOIN category c ON c.cat_id = p.cat_id JOIN sub_category s ON s.sub_cat_id = p.sub_cat_id
            WHERE p.status = 'published' AND c.cat_name <> 'cookies' ORDER BY p.posted_date DESC LIMIT 30")->result_array();
        $this->load->helper('common');
        header('Content-Type: application/rss+xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>' . "\n";
        echo "<title>Imperialpedia</title><link>" . $base . "/</link><description>SEO guides and practical education.</description><language>en</language>\n";
        echo '<atom:link href="' . $base . '/feed.xml" rel="self" type="application/rss+xml"/>' . "\n";
        foreach($rows as $r){
            $url = $base . '/' . $slug($r['cat_name']) . '/' . $slug($r['sub_cat_name']) . '/' . $slug($r['uri']);
            echo "<item><title>" . htmlspecialchars(ucfirst($r['post_title']), ENT_XML1) . "</title><link>" . htmlspecialchars($url, ENT_XML1) . "</link><guid isPermaLink=\"true\">" . htmlspecialchars($url, ENT_XML1) . "</guid>";
            echo "<pubDate>" . date('r', strtotime($r['posted_date'])) . "</pubDate><description>" . htmlspecialchars(seo_excerpt($r['post_desc'], 300), ENT_XML1) . "</description></item>\n";
        }
        echo '</channel></rss>';
    }

    public function index(){
        $base = rtrim(base_url(), '/');
        $slug = function($v){ return strtolower(str_replace(' ', '-', trim($v))); };

        $this->load->model('Setting_model');
        $cookies_on = $this->Setting_model->cookies_section_enabled();

        $urls = array();
        $urls[] = array('loc' => $base . '/', 'lastmod' => null, 'priority' => '1.0');

        $static_pages = array(
            'about', 'contact', 'careers', 'disclaimer', 'privacy-policy',
            'editorial-policy', 'terms-use', 'advertise', 'author',
        );
        if($cookies_on){
            $urls[] = array('loc' => $base . '/cookies', 'lastmod' => null, 'priority' => '0.7');
        }
        foreach($static_pages as $p){
            $urls[] = array('loc' => $base . '/' . $p, 'lastmod' => null, 'priority' => '0.5');
        }

        // Sub-category pages that actually have real content — either a real
        // sub_cat_desc article or at least one published post. Skips pages
        // with nothing behind them (e.g. news/usa) and orphaned subcategories
        // whose cat_id doesn't match a real category (can't build a valid URL).
        $this->db->select('c.cat_name, s.sub_cat_name, CHAR_LENGTH(s.sub_cat_desc) AS desc_len, COUNT(p.post_id) AS post_count, MAX(p.post_updated) AS latest_post, s.added_date AS sub_added');
        $this->db->from('sub_category s');
        $this->db->join('category c', 'c.cat_id = s.cat_id');
        $this->db->join('post p', 'p.sub_cat_id = s.sub_cat_id AND p.status = "published"', 'left');
        if(!$cookies_on){
            $this->db->where('c.cat_name !=', 'cookies');
        }
        $this->db->group_by('s.sub_cat_id, c.cat_name, s.sub_cat_name, s.sub_cat_desc');
        $subcats = $this->db->get()->result_array();
        foreach($subcats as $sc){
            if($sc['desc_len'] < 50 && $sc['post_count'] == 0){
                continue;
            }
            $loc = $base . '/' . $slug($sc['cat_name']) . '/' . $slug($sc['sub_cat_name']);
            $urls[] = array('loc' => $loc, 'lastmod' => !empty($sc['latest_post']) ? $sc['latest_post'] : $sc['sub_added'], 'priority' => '0.7');
        }

        // Individual published posts.
        $this->db->select('p.uri, p.post_updated, c.cat_name, s.sub_cat_name');
        $this->db->from('post p');
        $this->db->join('category c', 'c.cat_id = p.cat_id', 'left');
        $this->db->join('sub_category s', 's.sub_cat_id = p.sub_cat_id', 'left');
        $this->db->where('p.status', 'published');
        if(!$cookies_on){
            $this->db->where('c.cat_name !=', 'cookies');
        }
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
