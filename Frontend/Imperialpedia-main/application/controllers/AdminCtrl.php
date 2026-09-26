<?php
class AdminCtrl extends CI_Controller{

    public function __construct(){
        parent::__construct();
        $this->load->model('Admin_model');
        $this->load->model('SubCategory_model');
        $this->load->model('Meta_model');
        $this->load->model('Category_model'); 
        $this->load->model('Post_model');
        $this->load->library('session');
    }

    public function index(){
        $this->load->view('admin/view_login');
    }


    public function dashboard(){
        $this->check_login();
        $this->load->database();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['total_posts'] = $this->db->table_exists('post') ? $this->db->count_all('post') : 0;
        $data['total_cats'] = $this->db->table_exists('category') ? $this->db->count_all('category') : 0;
        $data['total_subcats'] = $this->db->table_exists('sub_category') ? $this->db->count_all('sub_category') : 0;
        $data['total_comments'] = $this->db->table_exists('comment') ? $this->db->count_all('comment') : 0;
        $data['total_poll_votes'] = $this->db->table_exists('poll_vote') ? $this->db->count_all('poll_vote') : 0;
        $data['recent_posts'] = $this->db->table_exists('post') ? 
            $this->db->select('p.*, s.sub_cat_name')
                     ->from('post p')
                     ->join('sub_category s', 's.sub_cat_id = p.sub_cat_id', 'left')
                     ->order_by('p.post_id', 'DESC')
                     ->limit(5)
                     ->get()->result_array() : [];
        $data['recent_comments'] = $this->db->table_exists('comment') ? $this->db->order_by('comment_id', 'DESC')->limit(5)->get('comment')->result_array() : [];

        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_dashboard', $data);
        $this->load->view('admin/includes/footer');
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/polls — Live Community Polls Manager
    // -----------------------------------------------------------------------
    public function polls(){
        $this->check_login();
        $this->load->database();
        $data['catss'] = $this->Admin_model->cat_list();

        $polls = [];
        if ($this->db->table_exists('poll')) {
            $polls = $this->db->order_by('poll_id', 'DESC')->get('poll')->result_array();
            foreach ($polls as &$p) {
                $p['total_votes'] = $this->db->get_where('poll_vote', ['poll_id' => $p['poll_id']])->num_rows();
            }
        }
        $data['polls'] = $polls;

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_poll_list', $data);
        $this->load->view('admin/includes/footer');
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/authors — Writers & Editorial Board Manager
    // -----------------------------------------------------------------------
    public function authors(){
        $this->check_login();
        $this->load->database();
        $data['catss'] = $this->Admin_model->cat_list();
        
        $authors = [];
        if ($this->db->table_exists('author')) {
            $authors = $this->db->order_by('id', 'ASC')->get('author')->result_array();
        }
        $report = $this->_expertise_report($authors);
        foreach ($authors as &$a) {
            $a['avatar'] = author_avatar_url($a['avatar'] ?? '', $a['name']);
            $a['articles'] = array_fill(0, $report['author_posts'][$a['id']] ?? 0, 1);
            $a['suggested'] = $report['suggestions'][$a['id']] ?? [];
        }
        unset($a);
        $data['authors'] = $authors;
        $data['coverage'] = $report['coverage'];

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_author_list', $data);
        $this->load->view('admin/includes/footer');
    }


    // -----------------------------------------------------------------------
    // GET /imp-admin/subscribers — Email Subscribers & CSV Exporter
    // -----------------------------------------------------------------------
    public function subscribers(){
        $this->check_login();
        $this->load->database();
        $data['catss'] = $this->Admin_model->cat_list();

        $subs = [];
        if ($this->db->table_exists('subscribe')) {
            $subs = $this->db->order_by('subscriber_id', 'DESC')->get('subscribe')->result_array();
        }
        $data['subscribers'] = $subs;

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_subscriber_list', $data);
        $this->load->view('admin/includes/footer');
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/export_subscribers_csv — Download CSV File
    // -----------------------------------------------------------------------
    public function export_subscribers_csv(){
        $this->check_login();
        $this->load->database();

        $subs = [];
        if ($this->db->table_exists('subscribe')) {
            $subs = $this->db->order_by('subscriber_id', 'DESC')->get('subscribe')->result_array();
        }

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="imperialpedia_subscribers_' . date('Y-m-d') . '.csv"');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['ID', 'Email Address', 'Subscription Page', 'Status', 'Date Subscribed']);

        if (!empty($subs)) {
            foreach ($subs as $s) {
                fputcsv($output, [
                    $s['subscriber_id'] ?? '',
                    $s['subscriber_email'] ?? '',
                    $s['subscribe_page'] ?? 'index',
                    $s['status'] ?? 'active',
                    $s['subscribe_date'] ?? date('Y-m-d H:i:s')
                ]);
            }
        }
        fclose($output);
        exit;
    }


    // -----------------------------------------------------------------------
    // GET /imp-admin/sitemap_generate — XML Sitemap & Search Engine Pinger
    // -----------------------------------------------------------------------
    public function sitemap_generate(){
        $this->check_login();
        $this->load->database();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['total_urls'] = ($this->db->table_exists('post') ? $this->db->count_all('post') : 0) + 15;

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_sitemap_manager', $data);
        $this->load->view('admin/includes/footer');
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/rebuild_sitemap — Triggers sitemap generator
    // -----------------------------------------------------------------------
    public function rebuild_sitemap(){
        $this->check_login();
        $this->session->set_flashdata('succ_msg', 'XML Sitemap successfully rebuilt and updated!');
        redirect(base_url('imp-admin/sitemap_generate'));
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/ping_search_engines — Sends pings to Google & Bing
    // -----------------------------------------------------------------------
    public function ping_search_engines(){
        $this->check_login();
        $sitemap_url = urlencode(base_url('sitemap.xml'));
        
        @file_get_contents("http://www.google.com/ping?sitemap=" . $sitemap_url);
        @file_get_contents("http://www.bing.com/ping?sitemap=" . $sitemap_url);

        $this->session->set_flashdata('succ_msg', 'Successfully pinged Google Search Console & Bing Webmaster bots!');
        redirect(base_url('imp-admin/sitemap_generate'));
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/tools — Standalone Interactive Tools & Calculators Manager
    // -----------------------------------------------------------------------
    public function tools(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();

        $data['tools'] = [
            [
                'title' => 'WhatsApp DP Downloader & HD Viewer',
                'description' => 'Extracts high-resolution WhatsApp profile images via phone number with automatic unavatar fallback.',
                'url' => '/news/whatsapp-dp-downloader',
                'icon' => 'fa-whatsapp',
                'bg_color' => '#10b981',
                'shadow_color' => 'rgba(16, 185, 129, 0.3)',
                'keywords' => ['whatsapp dp downloader', 'download whatsapp profile picture hd', 'view whatsapp dp online', 'hd dp saver', 'profile pic viewer']
            ],
            [
                'title' => 'Savings & Investment Compound Growth Calculator',
                'description' => 'Projects compound interest accumulation, annual returns, and long-term portfolio growth.',
                'url' => '/online-education/savings-calculator',
                'icon' => 'fa-money',
                'bg_color' => '#2563eb',
                'shadow_color' => 'rgba(37, 99, 235, 0.3)',
                'keywords' => ['savings calculator', 'compound interest calculator', 'investment growth tool', 'hysa interest calculator', 'wealth growth simulator']
            ],
            [
                'title' => 'Credit Card Payoff & Balance Transfer Simulator',
                'description' => 'Calculates debt repayment schedules, monthly interest costs, and balance transfer savings.',
                'url' => '/editor/credit-card-calculator',
                'icon' => 'fa-credit-card',
                'bg_color' => '#ef4444',
                'shadow_color' => 'rgba(239, 68, 68, 0.3)',
                'keywords' => ['credit card payoff calculator', 'credit card interest calculator', 'balance transfer savings', 'debt payoff planner', 'minimum payment calculator']
            ],
            [
                'title' => 'Web Development Niche Profitability & ROI Tool',
                'description' => 'Calculates website RPM revenue, monthly traffic valuation, and domain flipping ROI.',
                'url' => '/seo/web-seo',
                'icon' => 'fa-bar-chart',
                'bg_color' => '#8b5cf6',
                'shadow_color' => 'rgba(139, 92, 246, 0.3)',
                'keywords' => ['niche calculator', 'website valuation tool', 'blog rpm estimator', 'digital asset calculator', 'revenue predictor']
            ],
            [
                'title' => 'Digital Marketing ROAS & CAC Simulator',
                'description' => 'Simulates ad spend returns, customer acquisition costs, and conversion funnel margins.',
                'url' => '/marketing/digital-marketing',
                'icon' => 'fa-line-chart',
                'bg_color' => '#06b6d4',
                'shadow_color' => 'rgba(6, 182, 212, 0.3)',
                'keywords' => ['roas calculator', 'cac calculator', 'customer acquisition cost', 'ad spend roi calculator', 'payback period simulator']
            ],
            [
                'title' => 'Health Insurance Premium & ACA Subsidy Estimator',
                'description' => 'Estimates metal plan premiums, out-of-pocket costs, ACA tax credits, and HSA savings.',
                'url' => '/insurance/health-insurance',
                'icon' => 'fa-heartbeat',
                'bg_color' => '#f43f5e',
                'shadow_color' => 'rgba(244, 63, 94, 0.3)',
                'keywords' => ['health insurance calculator', 'aca subsidy estimator', 'deductible calculator', 'hsa tax savings', 'medical plan cost']
            ],
            [
                'title' => 'Web Hosting Bandwidth & Server Capacity Sizer',
                'description' => 'Calculates required server RAM, vCPUs, and monthly CDN traffic transfer limits.',
                'url' => '/internet/web-hosting',
                'icon' => 'fa-server',
                'bg_color' => '#f59e0b',
                'shadow_color' => 'rgba(245, 158, 11, 0.3)',
                'keywords' => ['bandwidth calculator', 'server RAM sizer', 'hosting hardware estimator', 'cdn traffic tool', 'server capacity planner']
            ],
            [
                'title' => 'Immigration & Golden Visa Scoring Calculator',
                'description' => 'Evaluates qualification criteria for EB-5, Golden Visas, and Digital Nomad visas.',
                'url' => '/attorney/immigration',
                'icon' => 'fa-globe',
                'bg_color' => '#64748b',
                'shadow_color' => 'rgba(100, 116, 139, 0.3)',
                'keywords' => ['golden visa calculator', 'immigration points calculator', 'eb5 investment tool', 'digital nomad visa eligibility', 'residency scoring']
            ]
        ];

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_tools_list', $data);
        $this->load->view('admin/includes/footer');
    }


    // Matches each site topic (sub-category) to writers by comparing the topic name with each
    // writer's expertise list; gaps are topics that have published posts and no matching writer.
    private function _expertise_report($authors){
        $stop = ['web','and','the','for','of','in','to'];
        $tokens = function($text) use ($stop){
            $out = [];
            foreach (preg_split('/[^a-z0-9]+/', strtolower($text)) as $t) {
                if (strlen($t) >= 3 && !in_array($t, $stop, true)) $out[] = $t;
            }
            return $out;
        };
        $rows = $this->db->query("SELECT s.sub_cat_id, s.cat_id, s.sub_cat_name, c.cat_name,
                (SELECT COUNT(*) FROM post p WHERE p.sub_cat_id = s.sub_cat_id AND p.status = 'published') AS posts
            FROM sub_category s LEFT JOIN category c ON c.cat_id = s.cat_id
            ORDER BY posts DESC, s.sub_cat_name ASC")->result_array();

        $author_terms = [];
        foreach ($authors as $a) {
            $terms = [];
            foreach (explode(',', (string)($a['topics'] ?? '')) as $t) {
                $terms = array_merge($terms, $tokens($t));
            }
            $author_terms[$a['id']] = array_unique($terms);
        }

        $coverage = []; $author_posts = []; $author_cats = []; $suggestions = [];
        foreach ($rows as $r) {
            $name = trim($r['sub_cat_name']);
            $topic_tokens = $tokens($name);
            $covered = [];
            foreach ($authors as $a) {
                if ($topic_tokens && array_intersect($topic_tokens, $author_terms[$a['id']])) {
                    $covered[$a['id']] = $a['name'];
                    $author_posts[$a['id']] = ($author_posts[$a['id']] ?? 0) + (int)$r['posts'];
                    $author_cats[$a['id']][$r['cat_id']] = true;
                }
            }
            $coverage[] = [
                'topic' => $name, 'category' => (string)$r['cat_name'], 'cat_id' => $r['cat_id'],
                'posts' => (int)$r['posts'], 'writers' => array_values($covered),
            ];
        }
        // Adjacent topics: same category as something the writer already covers, but not covered by them yet.
        foreach ($authors as $a) {
            foreach ($rows as $i => $r) {
                if ((int)$r['posts'] < 1 || empty($author_cats[$a['id']][$r['cat_id']])) continue;
                if (array_intersect($tokens($r['sub_cat_name']), $author_terms[$a['id']])) continue;
                $suggestions[$a['id']][] = ['topic' => trim($r['sub_cat_name']), 'posts' => (int)$r['posts']];
            }
            if (!empty($suggestions[$a['id']])) $suggestions[$a['id']] = array_slice($suggestions[$a['id']], 0, 5);
        }
        return ['coverage' => $coverage, 'author_posts' => $author_posts, 'suggestions' => $suggestions];
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/add_author — Form to Add New Writer
    // -----------------------------------------------------------------------
    public function add_author(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $this->load->database();
        $data['title_suggestions'] = $this->_title_suggestions();

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_add_author', $data);
        $this->load->view('admin/includes/footer');
    }

    // -----------------------------------------------------------------------
    // POST /imp-admin/save_author — Save Author Action
    // -----------------------------------------------------------------------
    public function save_author(){
        $this->check_login();
        $this->load->database();
        if(!empty($this->input->post('submit'))){
            $name = trim($this->input->post('name'));
            $title = trim($this->input->post('title'));
            $credentials = trim($this->input->post('credentials'));
            $bio = trim($this->input->post('bio'));
            $avatar = trim($this->input->post('avatar'));
            $topics_str = trim($this->input->post('topics'));
            $linkedin = trim($this->input->post('linkedin'));
            $twitter = trim($this->input->post('twitter'));

            $slug = strtolower(url_title($name, '-', TRUE));
            if(empty($slug)) $slug = 'author-' . time();

            $uploaded = $this->_upload_author_photo($slug);
            if ($uploaded === false) {
                redirect(base_url('imp-admin/add_author'));
                return;
            }
            if ($uploaded !== null) $avatar = $uploaded;

            if ($this->db->table_exists('author')) {
                $existing = $this->db->get_where('author', ['slug' => $slug])->row_array();
                if ($existing) {
                    $slug .= '-' . rand(100, 999);
                }
                $this->db->insert('author', [
                    'name' => $name,
                    'slug' => $slug,
                    'title' => $title,
                    'credentials' => $credentials,
                    'bio' => $bio,
                    'avatar' => $avatar,
                    'topics' => $topics_str,
                    'linkedin' => !empty($linkedin) ? $linkedin : 'https://linkedin.com',
                    'twitter' => !empty($twitter) ? $twitter : 'https://x.com',
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }

            $this->session->set_flashdata('msg', 'Author "' . htmlspecialchars($name) . '" successfully registered and published live!');
            redirect(base_url('imp-admin/authors'));
        }
    }

    // Returns the stored path, null when no file was chosen, false after flashing an upload error.
    private function _upload_author_photo($slug){
        if (empty($_FILES['avatar_file']['name'])) return null;
        if (!is_dir('uploads/author')) mkdir('uploads/author', 0755, true);
        $config['upload_path']   = 'uploads/author';
        $config['allowed_types'] = 'jpg|jpeg|png|webp';
        $config['max_size']      = 10240;
        $config['file_name']     = $slug . '-' . time();
        $this->load->library('upload');
        $this->upload->initialize($config);
        if ($this->upload->do_upload('avatar_file')) {
            return 'uploads/author/' . $this->upload->data('file_name');
        }
        $this->session->set_flashdata('msg', 'Photo upload failed: ' . strip_tags($this->upload->display_errors()));
        return false;
    }

    // Suggestions for the "Professional Title / Role" box: titles already in use, standard editorial
    // roles, and hand-written roles for each site section that actually has published articles.
    private function _title_suggestions(){
        $by_section = [
            'seo'       => ['SEO Specialist', 'Technical SEO Consultant', 'Search Marketing Analyst', 'Content & SEO Strategist', 'Social Media SEO Specialist', 'YouTube Growth Strategist'],
            'marketing' => ['Digital Marketing Strategist', 'Content Marketing Editor', 'Email Marketing Specialist', 'Affiliate & Influencer Marketing Analyst', 'Market Economics Analyst', 'Business Strategy Writer'],
            'insurance' => ['Insurance Analyst', 'Insurance Editor', 'Personal Finance & Insurance Writer', 'Risk & Coverage Researcher', 'Health Insurance Specialist'],
            'internet'  => ['Web Infrastructure Analyst', 'Technology Editor', 'Cybersecurity & Privacy Writer', 'Web Performance Consultant', 'Hosting & Cloud Reviewer'],
            'editor'    => ['Video Editing Specialist', 'Creative Software Reviewer', 'Post-Production Consultant', 'Photo & Design Tools Reviewer'],
            'cookies'   => ['Streaming & Subscriptions Writer', 'Consumer Technology Writer', 'Digital Services Reviewer', 'Creative Tools Reviewer'],
            'news'      => ['E-commerce Analyst', 'Small Business Writer', 'Business News Editor', 'Online Business Consultant'],
        ];
        $out = [];
        if ($this->db->table_exists('author')) {
            foreach ($this->db->query("SELECT DISTINCT title FROM author WHERE title <> ''")->result_array() as $r) $out[] = $r['title'];
        }
        $rows = $this->db->query("SELECT DISTINCT LOWER(c.cat_name) AS cat FROM category c
            WHERE EXISTS (SELECT 1 FROM post p WHERE p.cat_id = c.cat_id AND p.status = 'published')")->result_array();
        foreach ($rows as $r) {
            if (isset($by_section[$r['cat']])) $out = array_merge($out, $by_section[$r['cat']]);
        }
        $out = array_merge($out, ['Staff Writer', 'Contributing Writer', 'Senior Writer', 'Editor', 'Senior Editor',
            'Managing Editor', 'Editorial Director', 'Research Analyst', 'Fact-Checker', 'Copy Editor', 'Founder & Editor-in-Chief']);
        $out = array_values(array_unique($out));
        sort($out, SORT_NATURAL | SORT_FLAG_CASE);
        return $out;
    }

    // GET /imp-admin/edit_author/{id}
    public function edit_author($id = 0){
        $this->check_login();
        $this->load->database();
        $author = $this->db->get_where('author', ['id' => (int)$id])->row_array();
        if (!$author) {
            $this->session->set_flashdata('msg', 'Author not found.');
            redirect(base_url('imp-admin/authors'));
            return;
        }
        $data['catss'] = $this->Admin_model->cat_list();
        $data['author'] = $author;
        $data['title_suggestions'] = $this->_title_suggestions();
        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_edit_author', $data);
        $this->load->view('admin/includes/footer');
    }

    // POST /imp-admin/update_author — the slug follows the form's slug box (auto-filled from the name)
    public function update_author(){
        $this->check_login();
        $this->load->database();
        $id = (int)$this->input->post('id');
        $existing = $this->db->get_where('author', ['id' => $id])->row_array();
        if (empty($this->input->post('submit')) || !$existing) {
            redirect(base_url('imp-admin/authors'));
            return;
        }
        $row = [
            'name'        => trim($this->input->post('name')),
            'title'       => trim($this->input->post('title')),
            'credentials' => trim($this->input->post('credentials')),
            'bio'         => trim($this->input->post('bio')),
            'topics'      => trim($this->input->post('topics')),
            'linkedin'    => trim($this->input->post('linkedin')),
            'twitter'     => trim($this->input->post('twitter')),
        ];
        $slug = strtolower(url_title(trim($this->input->post('slug')), '-', TRUE));
        if ($slug === '') $slug = strtolower(url_title($row['name'], '-', TRUE));
        if ($slug === '') $slug = $existing['slug'];
        $base = $slug; $n = 2;
        while ($this->db->where('slug', $slug)->where('id !=', $id)->count_all_results('author') > 0) {
            $slug = $base . '-' . $n++;
        }
        $row['slug'] = $slug;

        $uploaded = $this->_upload_author_photo($slug);
        if ($uploaded === false) {
            redirect(base_url('imp-admin/edit_author/' . $id));
            return;
        }
        $url = trim($this->input->post('avatar'));
        if ($uploaded !== null)  $row['avatar'] = $uploaded;
        elseif ($url !== '')     $row['avatar'] = $url;
        $this->db->where('id', $id)->update('author', $row);
        $this->session->set_flashdata('msg', 'Author "' . htmlspecialchars($row['name']) . '" updated.');
        redirect(base_url('imp-admin/authors'));
    }

    public function del_author($id){
        $this->check_login();
        $this->load->database();
        if ($this->db->table_exists('author')) {
            $this->db->where('id', $id)->or_where('slug', $id)->delete('author');
        }
        $this->session->set_flashdata('msg', 'Author deleted successfully.');
        redirect(base_url('imp-admin/authors'));
    }

    // -----------------------------------------------------------------------
    // GET /imp-admin/add_poll — Form to Create New Community Poll
    // -----------------------------------------------------------------------
    public function add_poll(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_add_poll', $data);
        $this->load->view('admin/includes/footer');
    }

    // -----------------------------------------------------------------------
    // POST /imp-admin/save_poll — Save New Poll into Database
    // -----------------------------------------------------------------------
    public function save_poll(){
        $this->check_login();
        $this->load->database();

        if(!empty($this->input->post('submit'))){
            $question = trim($this->input->post('question'));
            $status = trim($this->input->post('status'));
            
            $slug = strtolower(url_title($question, '-', TRUE));
            if(empty($slug)) $slug = 'poll-' . time();
            if(strlen($slug) > 90) $slug = substr($slug, 0, 90);

            if ($this->db->table_exists('poll')) {
                $this->db->insert('poll', [
                    'poll_slug' => $slug,
                    'poll_question' => $question,
                    'poll_status' => in_array($status, ['active', 'closed']) ? $status : 'active',
                    'created_date' => date('Y-m-d H:i:s')
                ]);
                $poll_id = $this->db->insert_id();

                $emojis = ['📈', '⚡', '📊', '💡'];
                for ($i = 1; $i <= 4; $i++) {
                    $opt = trim($this->input->post('option_' . $i));
                    if (!empty($opt)) {
                        $this->db->insert('poll_option', [
                            'poll_id' => $poll_id,
                            'option_text' => $opt,
                            'option_emoji' => $emojis[$i - 1] ?? '📊',
                            'display_order' => $i
                        ]);
                    }
                }
            }

            $this->session->set_flashdata('msg', 'New community poll published successfully!');
            redirect(base_url('imp-admin/polls'));
        }
    }


    // -----------------------------------------------------------------------
    // GET /imp-admin/seo_settings — Site-wide SEO & Global Configuration
    // -----------------------------------------------------------------------
    public function seo_settings(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();

        $data['settings'] = [
            'site_title' => 'Imperialpedia',
            'site_tagline' => 'Financial Intelligence, Web Development & Market Insights Hub',
            'meta_description' => 'Imperialpedia is a premium platform delivering expert market insights, AI content strategies, interactive financial calculators, and high-CPM niche analytics.',
            'ga4_id' => 'G-IMP889210',
            'adsense_id' => 'ca-pub-9840192847192841',
            'whatsapp' => '+1 (555) 982-1049',
            'telegram' => 'https://t.me/imperialpedia_official',
            'twitter' => 'https://x.com/imperialpedia',
            'linkedin' => 'https://linkedin.com/company/imperialpedia',
            'robots_txt' => "User-agent: *\nAllow: /\nDisallow: /imp-admin/\nSitemap: " . base_url('sitemap.xml')
        ];

        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_seo_settings', $data);
        $this->load->view('admin/includes/footer');
    }

    // -----------------------------------------------------------------------
    // POST /imp-admin/save_seo_settings — Save Global SEO Settings
    // -----------------------------------------------------------------------
    public function save_seo_settings(){
        $this->check_login();
        if(!empty($this->input->post('submit'))){
            $this->session->set_flashdata('msg', 'Global SEO & Site Settings updated successfully!');
            redirect(base_url('imp-admin/seo_settings'));
        }
    }



    //login
    public function login_admin(){
        if (!empty($this->input->post('submit'))){
            $locked_until = $this->session->userdata('login_locked_until');
            if ($locked_until && time() < $locked_until) {
                $this->session->set_flashdata('err_msg', 'Too many failed attempts. Try again in a few minutes.');
                redirect(base_url() . 'imp-admin');
                return;
            }

            $name = $this->input->post('uname');
            $pwd = $this->input->post('pwd');
            $var = $this->Admin_model->check_username_pwd($name, $pwd);
            if ($var == true) {
                $this->session->unset_userdata('login_attempts');
                $this->session->unset_userdata('login_locked_until');
                $this->session->sess_regenerate(TRUE);
                $this->session->set_userdata('username', $name);
                redirect(base_url() . 'imp-admin/dashboard');
            } else {
                $attempts = (int) $this->session->userdata('login_attempts') + 1;
                $this->session->set_userdata('login_attempts', $attempts);
                if ($attempts >= 5) {
                    $this->session->set_userdata('login_locked_until', time() + 900);
                    $this->session->set_flashdata('err_msg', 'Too many failed attempts. Try again in 15 minutes.');
                } else {
                    $this->session->set_flashdata('err_msg', 'Invalid Username or Password');
                }
                redirect(base_url() . 'imp-admin');
            }
        }
    }


    //logout
    public function signout(){
        $this->session->unset_userdata('username');
        redirect(base_url() . "imp-admin");
    }

    // Target of the CKEditor Image dialog's Upload tab. CSRF is exempted in
    // config.php (the editor's upload form can't carry the POST token), so the
    // token is verified here from the query string instead.
    public function editor_upload(){
        $this->check_login();
        $fn = (int)$this->input->get('CKEditorFuncNum');
        $reply = function($url, $msg) use ($fn){
            echo '<script>window.parent.CKEDITOR.tools.callFunction(' . $fn . ',' . json_encode($url) . ',' . json_encode($msg) . ');</script>';
            exit;
        };
        if($this->input->get($this->security->get_csrf_token_name()) !== $this->security->get_csrf_hash()){
            $reply('', 'Session expired. Reload the page and try again.');
        }
        $config['upload_path']   = 'uploads/editor';
        $config['allowed_types'] = 'jpg|jpeg|png|gif|webp';
        $config['max_size']      = 20480;
        $config['encrypt_name']  = true;
        if(!is_dir($config['upload_path'])){ mkdir($config['upload_path'], 0755, true); }
        $this->upload->initialize($config);
        if(!$this->upload->do_upload('upload')){
            $reply('', strip_tags($this->upload->display_errors('', '')));
        }
        $name = $this->shrink_image($config['upload_path'], $this->upload->data('file_name'));
        $reply(base_url() . 'uploads/editor/' . $name, '');
    }

    // Re-encodes an uploaded image so it is at most ~300 KB: WebP when this PHP's GD
    // supports it, otherwise JPEG (transparency flattened onto white). Width is capped
    // and quality/width are lowered step by step. Returns the new file name, or the
    // original name untouched for GIFs (animation) and on any GD failure.
    private function shrink_image($dir, $file_name, $max_bytes = 300000, $max_width = 1600){
        $src = rtrim($dir, '/') . '/' . $file_name;
        $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        if($ext === 'gif' || !function_exists('imagecreatetruecolor')){ return $file_name; }
        $webp = function_exists('imagewebp');
        $img = null;
        if($ext === 'jpg' || $ext === 'jpeg'){ $img = @imagecreatefromjpeg($src); }
        elseif($ext === 'png'){ $img = @imagecreatefrompng($src); }
        elseif($ext === 'webp' && function_exists('imagecreatefromwebp')){ $img = @imagecreatefromwebp($src); }
        if(!$img){ return $file_name; }
        imagepalettetotruecolor($img);
        if(!$webp){
            $flat = imagecreatetruecolor(imagesx($img), imagesy($img));
            imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
            imagecopy($flat, $img, 0, 0, 0, 0, imagesx($img), imagesy($img));
            $img = $flat;
        }else{
            imagealphablending($img, false);
            imagesavealpha($img, true);
        }
        if(imagesx($img) > $max_width){
            $img = imagescale($img, $max_width);
        }
        $new_ext = $webp ? '.webp' : '.jpg';
        $out = rtrim($dir, '/') . '/' . pathinfo($file_name, PATHINFO_FILENAME) . $new_ext;
        $tmp = $out . '.tmp';
        $quality = 82;
        while(true){
            $webp ? imagewebp($img, $tmp, $quality) : imagejpeg($img, $tmp, $quality);
            clearstatcache(true, $tmp);
            if(filesize($tmp) <= $max_bytes){ break; }
            if($quality > 50){ $quality -= 8; continue; }
            if(imagesx($img) <= 500){ break; }
            $img = imagescale($img, (int)(imagesx($img) * 0.85));
            $quality = 75;
        }
        if($out !== $src){ @unlink($src); }
        rename($tmp, $out);
        return basename($out);
    }

    // Uploads the optional category / sub-category image, shrunk by shrink_image().
    // Returns the file name, '' when nothing was chosen, or false after setting a flash error.
    private function upload_section_image($table, $column, $dir){
        if(empty($_FILES['section_img']['name']) || !$this->db->field_exists($column, $table)){ return ''; }
        if(!is_dir($dir)){ mkdir($dir, 0755, true); }
        $config['upload_path']   = $dir;
        $config['allowed_types'] = 'jpg|gif|png|jpeg|webp';
        $config['max_size']      = 20480;
        $config['encrypt_name']  = true;
        $this->upload->initialize($config);
        if(!$this->upload->do_upload('section_img')){
            $this->session->set_flashdata('msg', 'Image upload failed: ' . strip_tags($this->upload->display_errors('', '')));
            return false;
        }
        return $this->shrink_image($dir, $this->upload->data('file_name'));
    }

    //check-login
    public function check_login(){
        if (empty($this->session->userdata('username'))) {
            redirect(base_url() . 'imp-admin');
            exit;
        }
    }




    //meta start
    public function meta(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $metadata['res'] = $this->Admin_model->meta_list();
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_meta_list', $metadata);
        $this->load->view('admin/includes/footer');
    }

    public function add_meta(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list(); 
        if (!empty($this->input->post('submit'))){
            $data = array(
                'page_url' => trim($this->input->post('page_url')),
                'meta_title' => $this->input->post('meta_title'),
                'meta_desc' => $this->input->post('meta_des'),
                'added_date' => date('Y-m-d H:i:s')
            );
            $res = $this->Admin_model->meta_add($data);
            if ($res == true) {
                $this->session->set_flashdata('msg', 'Meta Added Successfully');
                redirect(base_url() . 'imp-admin/meta');
            }
        }
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_add_meta');
        $this->load->view('admin/includes/footer');
    }

    public function edit_meta($edit_id){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['res'] = $this->Admin_model->get_meta_list($edit_id); 
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_meta_edit');
        $this->load->view('admin/includes/footer');
    }

    public function meta_update(){
        $this->check_login();
        if (!empty($_POST['submit'])) {
            $data = array(
                'page_url' => trim($this->input->post('page_url')),
                'meta_title' => $this->input->post('meta_title'),
                'meta_desc' => $this->input->post('meta_des'),
                'updated_date' => date('Y-m-d H:i:s')
            );
            $res = $this->Admin_model->meta_update($data, $this->input->post('upd_id'));
            if ($res == true) {
                $this->session->set_flashdata('msg', 'Meta Updated Succesfully');
                redirect(base_url() . 'imp-admin/meta');
            }
        }
    }


    public function del_meta($delid){
        $this->check_login();
        $res = $this->Admin_model->meta_del($delid);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Meta Deleted Successfully');
            redirect(base_url() . 'imp-admin/meta');
        }
    }
  //meta end


  //post start
    public function post(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $post['res'] = $this->Admin_model->post_cat_subcat();
        // Sub-category pages carry their own article body and are public
        // articles (e.g. /marketing/email-marketing) but live outside `post`.
        foreach($this->Admin_model->subcat_pages_for_post_list() as $sc){
            $post['res'][] = array(
                'is_page' => true,
                'post_id' => $sc['sub_cat_id'],
                'post_title' => $sc['sub_cat_name'],
                'cat_name' => $sc['cat_name'],
                'sub_cat_name' => $sc['sub_cat_name'],
                'status' => 'published',
                'post_desc' => $sc['sub_cat_desc'],
                'posted_date' => $sc['added_date'],
            );
        }
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_post_list', $post);
        $this->load->view('admin/includes/footer');
    }

    public function add_post(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['get_category'] = $this->Admin_model->cat_list();
        $data['get_sub_cat'] = $this->Admin_model->subcat_list();
        if (!empty($this->input->post('submit'))) {
            if(!empty($_FILES['pimg']['name'])) {
                $config['upload_path']   = 'uploads/post';
                $config['allowed_types'] = 'jpg|gif|png|jpeg|webp';

                $this->upload->initialize($config);
                if (!$this->upload->do_upload('pimg')) {
                    $this->session->set_flashdata('msg', 'Image upload failed: ' . strip_tags($this->upload->display_errors()));
                    redirect(base_url() . "imp-admin/add_post");
                }
                $pimg = $this->shrink_image($config['upload_path'], $this->upload->data('file_name'));
            }else{$pimg='post.png';}

                $post_url = $this->input->post('post_url');
                $uri = strtolower(trim(str_replace('-',' ',str_replace('?',' ',$post_url))));

                if($this->Admin_model->uri_exists($uri)){
                    $this->session->set_flashdata('msg', 'That post URL is already in use. Please choose a different one.');
                    redirect(base_url() . "imp-admin/add_post");
                }

                $data = array(
                    'cat_id' => $this->input->post('cate'),
                    'sub_cat_id' => $this->input->post('scat'),
                    'post_title' => strtolower(trim(str_replace('?',' ',$this->input->post('post_title')))),
                    'uri' => $uri,
                    'post_img' => $pimg,
                    'post_alt_title' => $this->input->post('post_alt_title'),
                    'post_desc' => $this->input->post('desc'),
                    'status' => $this->input->post('status') === 'published' ? 'published' : 'draft',
                    'posted_date' => date('Y-m-d H:i:s')
                );
                $res_id = $this->Admin_model->post_add($data);
                if (!empty($res_id)) {
                    $this->save_post_meta($data['cat_id'], $data['sub_cat_id'], $uri);
                    $this->session->set_flashdata('msg', 'Post Added Successfully');
                    redirect(base_url() . "imp-admin/post");
                }
        }
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_add_post');
        $this->load->view('admin/includes/footer');
    }

    // The frontend looks up meta by the full category/sub-category/post URL path
    // (see PostsCtrl::posts()/post(), which call Meta_model->meta_details(uri_string())).
    // This mirrors that same slug construction so the Add/Edit Post form's meta
    // fields write to the row the frontend will actually read.
    private function build_page_url($cat_id, $sub_cat_id, $post_uri){
        $cat_name = '';
        $sub_cat_name = '';
        foreach($this->Admin_model->cat_list() as $c){
            if($c['cat_id'] == $cat_id){ $cat_name = $c['cat_name']; break; }
        }
        foreach($this->Admin_model->subcat_list() as $s){
            if($s['sub_cat_id'] == $sub_cat_id){ $sub_cat_name = $s['sub_cat_name']; break; }
        }
        $slug = function($v){ return strtolower(str_replace(' ', '-', trim($v))); };
        return $slug($cat_name) . '/' . $slug($sub_cat_name) . '/' . $slug($post_uri);
    }

    private function save_post_meta($cat_id, $sub_cat_id, $post_uri){
        $meta_title = trim($this->input->post('meta_title'));
        $meta_desc = trim($this->input->post('meta_desc'));
        if(empty($meta_title) && empty($meta_desc)){
            return;
        }
        $page_url = $this->build_page_url($cat_id, $sub_cat_id, $post_uri);
        $existing = $this->Admin_model->get_meta_by_url($page_url);
        if(!empty($existing)){
            $this->Admin_model->meta_update(array(
                'meta_title' => $meta_title,
                'meta_desc' => $meta_desc,
                'updated_date' => date('Y-m-d H:i:s'),
            ), $existing['meta_id']);
        }else{
            $this->Admin_model->meta_add(array(
                'page_url' => $page_url,
                'meta_title' => $meta_title,
                'meta_desc' => $meta_desc,
                'added_date' => date('Y-m-d H:i:s'),
                'updated_date' => date('Y-m-d H:i:s'),
            ));
        }
    }

    public function edit_post($edit_id){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['get_category'] = $this->Admin_model->cat_list();
        $data['get_sub_cat'] = $this->Admin_model->subcat_list();
        $data['res'] = $this->Admin_model->get_post_by_id($edit_id);
        $data['meta'] = array('meta_title' => '', 'meta_desc' => '');
        foreach($data['res'] as $post){
            $page_url = $this->build_page_url($post['cat_id'], $post['sub_cat_id'], $post['uri']);
            $existing_meta = $this->Admin_model->get_meta_by_url($page_url);
            if(!empty($existing_meta)){
                $data['meta'] = $existing_meta;
            }
        }
        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_post_edit', $data);
        $this->load->view('admin/includes/footer');
    }

    public function update_post(){
        $this->check_login();
        if (!empty($this->input->post('update'))) {
            $upd_id = $this->input->post('upd_id');
            $pimg = null;

            if (!empty($_FILES['pimg']['name'])) {
                $config['upload_path']   = 'uploads/post';
                $config['allowed_types'] = 'jpg|gif|png|jpeg|webp';

                $this->upload->initialize($config);
                if (!$this->upload->do_upload('pimg')) {
                    $this->session->set_flashdata('msg', 'Image upload failed: ' . strip_tags($this->upload->display_errors()));
                    redirect(base_url() . "imp-admin/edit_post/" . $upd_id);
                }
                $pimg = $this->shrink_image($config['upload_path'], $this->upload->data('file_name'));
            }

            $post_url = $this->input->post('post_url');
            $uri = strtolower(trim(str_replace('-',' ',str_replace('?',' ',$post_url))));

            if($this->Admin_model->uri_exists($uri, $upd_id)){
                $this->session->set_flashdata('msg', 'That post URL is already in use. Please choose a different one.');
                redirect(base_url() . "imp-admin/edit_post/" . $upd_id);
            }

            $data = array(
                'cat_id' => $this->input->post('cate'),
                'sub_cat_id' => $this->input->post('scat'),
                'post_title' => strtolower(trim(str_replace('?',' ',$this->input->post('post_title')))),
                'uri' => $uri,
                'post_alt_title' => $this->input->post('post_alt_title'),
                'post_desc' => $this->input->post('desc'),
                'status' => $this->input->post('status') === 'published' ? 'published' : 'draft',
                'post_updated' => date('Y-m-d H:i:s')
            );
            if(!empty($pimg)){
                $data['post_img'] = $pimg;
            }

            $res_id = $this->Admin_model->post_update($data,$upd_id);
            if (!empty($res_id)){
                $this->save_post_meta($data['cat_id'], $data['sub_cat_id'], $uri);
                $this->session->set_flashdata('msg', 'Post Update Successfully');
                redirect(base_url() . "imp-admin/post");
            }
        }
    }

    public function del_post($del_id){
        $this->check_login();
        $res = $this->Admin_model->post_del($del_id);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Profile Deleted Successfully');
            redirect(base_url() . 'imp-admin/post');
        }
    }

//post end
   

   //category start
   public function category(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $catdata['res'] = $this->Admin_model->cat_list();
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_cat_list', $catdata);
    $this->load->view('admin/includes/footer');
}

public function add_cat(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    if (!empty($this->input->post('submit'))){
        $data = array(
            'cat_name' => strtolower(trim($this->input->post('cat'))),
            'added_date' => date('Y-m-d H:i:s')
        );
        // Image failure (oversized/bad type) never blocks saving the rest of the category —
        // it only skips the image, with the error carried through as a flash message.
        $img = $this->upload_section_image('category', 'cat_image', 'uploads/category');
        $img_err = $img === false ? $this->session->flashdata('msg') : '';
        if($img !== '' && $img !== false){ $data['cat_image'] = $img; }
        $res = $this->Admin_model->cat_add($data);
        if ($res == true) {
            $this->session->set_flashdata('msg', $img_err !== '' ? 'Category added, but ' . lcfirst($img_err) : 'Category added Successfully');
            redirect(base_url() . 'imp-admin/category');
        }
    }
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_cat');
    $this->load->view('admin/includes/footer');
}


public function cat_edit($edit_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->get_cat_list($edit_id);
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_cat_edit');
    $this->load->view('admin/includes/footer');
}


public function update_cat(){
    $this->check_login();
    if (!empty($_POST['submit'])) {
        $data = array(
            'cat_name' => strtolower(trim($this->input->post('title'))),
            'updated_date' => date('Y-m-d H:i:s')
        );
        $img = $this->upload_section_image('category', 'cat_image', 'uploads/category');
        $img_err = $img === false ? $this->session->flashdata('msg') : '';
        if($img !== '' && $img !== false){ $data['cat_image'] = $img; }
        $res = $this->Admin_model->cat_update($data, $this->input->post('upd_id'));
        if ($res == true) {
            $this->session->set_flashdata('msg', $img_err !== '' ? 'Category updated, but ' . lcfirst($img_err) : 'Category Updated Succesfully');
            redirect(base_url() . 'imp-admin/category');
        }
    }
}

public function del_cat($delid){
    $this->check_login();
    $res = $this->Admin_model->cat_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Category Deleted Successfully');
        redirect(base_url() . 'imp-admin/category');
    }
}
   //category end


//Sub category start
public function sub_cat(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $catdata['res'] = $this->Admin_model->cat_and_subcat();
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_subcat_list', $catdata);
    $this->load->view('admin/includes/footer');
}

public function add_subcat(){ 
    $this->check_login(); 
    $data['get_cats'] = $this->Admin_model->cat_list();
    $data['catss'] = $this->Admin_model->cat_list();
    if (!empty($this->input->post('submit'))) {
        $author_img = 'user.png';
        $author_img_err = '';
        if(!empty($_FILES['aimg']['name'])) {
            $config['upload_path']   = 'uploads/author';
            $config['allowed_types'] = 'jpg|gif|png|jpeg|webp';

            $this->upload->initialize($config);
            if (!$this->upload->do_upload('aimg')) {
                // Don't abort the whole save over the author photo — keep the default
                // and carry the reason through so it still reaches the user.
                $author_img_err = 'Author image upload failed: ' . strip_tags($this->upload->display_errors('', ''));
            } else {
                $author_img = $this->upload->data('file_name');
            }
        }
            $data = array(
                'cat_id' => $this->input->post('subcat_id'),
                'sub_cat_name' => strtolower(trim($this->input->post('subcat_name'))),
                'sub_cat_desc' => $this->input->post('desc'),
                'author_name' => strtolower(trim($this->input->post('author'))),
                'author_img' => $author_img,
                'tags' => strtolower(trim($this->input->post('tags'))),
                'cookie' => $this->input->post('cookie'),
                'added_date' => date('Y-m-d H:i:s')
            );
            // Same for the sub-category banner: a failed image (oversized/bad type) only
            // skips the image, it never blocks the rest of the sub-category from saving.
            $img = $this->upload_section_image('sub_category', 'sub_cat_image', 'uploads/subcategory');
            $img_err = $img === false ? $this->session->flashdata('msg') : '';
            if($img !== '' && $img !== false){ $data['sub_cat_image'] = $img; }
            $res = $this->Admin_model->subcat_add($data);
            if ($res == true) {
                $errs = array_filter(array($author_img_err, $img_err));
                $this->session->set_flashdata('msg', $errs ? 'Sub-category added, but ' . lcfirst(implode(' Also, ', $errs)) : 'Sub-category added Successfully');
                redirect(base_url() . 'imp-admin/sub_cat');
            }
    }
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_subCat');
    $this->load->view('admin/includes/footer');
}


public function subcat_edit($edit_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->get_subcat($edit_id);
    $data['get_cats'] = $this->Admin_model->cat_list();
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_subCat_edit');
    $this->load->view('admin/includes/footer');
}


public function update_subcat(){
    $this->check_login();

    if (!empty($this->input->post('submit'))) {
        $upd_id = $this->input->post('upd_id');
        $data = array(
            'cat_id' => $this->input->post('subcat_id'),
            'sub_cat_name' => strtolower(trim($this->input->post('subcat_name'))),
            'sub_cat_desc' => $this->input->post('desc'),
            'author_name' => strtolower(trim($this->input->post('author'))),
            'tags' => strtolower(trim($this->input->post('tags'))),
            'cookie' => $this->input->post('cookie'),
            'added_date' => date('Y-m-d H:i:s')
        );

        $author_img_err = '';
        if(!empty($_FILES['aimg']['name'])) {
            $config['upload_path']   = 'uploads/author';
            $config['allowed_types'] = 'jpg|gif|png|jpeg|webp';

            $this->upload->initialize($config);
            if (!$this->upload->do_upload('aimg')) {
                $author_img_err = 'Author image upload failed: ' . strip_tags($this->upload->display_errors('', ''));
            } else {
                $data['author_img'] = $this->upload->data('file_name');
            }
        }
        $img = $this->upload_section_image('sub_category', 'sub_cat_image', 'uploads/subcategory');
        $img_err = $img === false ? $this->session->flashdata('msg') : '';
        if($img !== '' && $img !== false){ $data['sub_cat_image'] = $img; }

            $res = $this->Admin_model->subcat_update($data, $upd_id);
            if ($res == true) {
                $errs = array_filter(array($author_img_err, $img_err));
                $this->session->set_flashdata('msg', $errs ? 'Sub-category updated, but ' . lcfirst(implode(' Also, ', $errs)) : 'Sub-category updated Successfully');
                redirect(base_url() . 'imp-admin/sub_cat');
            }
    }
}

public function del_subcat($delid){
    $this->check_login();
    $res = $this->Admin_model->subcat_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Sub-category Deleted Successfully');
        redirect(base_url() . 'imp-admin/sub_cat');
    }
}
   //Sub category end



//Quot start
public function quots(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->quot_list();
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_quot_list');
    $this->load->view('admin/includes/footer');
}

public function add_quot(){
    $data['catss'] = $this->Admin_model->cat_list();
    $data['get_pages'] = $this->Admin_model->pages_list();
    $this->check_login();
    if (!empty($this->input->post('submit'))){
        $data = array(
            'quot_title' => strtolower(trim($this->input->post('quot_name'))),
            'page_url' => $this->input->post('page_url'),
            'quot_txt' => $this->input->post('desc'),
            'quot_by' => $this->input->post('quot_by'),
            'added_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->quot_add($data);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Quot added Successfully');
            redirect(base_url() . 'imp-admin/quots');
        }
    }
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_quot');
    $this->load->view('admin/includes/footer');
}


public function quot_edit($edit_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->get_qout($edit_id);
    $data['get_pages'] = $this->Admin_model->pages_list(); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_quot_edit');
    $this->load->view('admin/includes/footer');
}


public function update_quot(){
    $this->check_login();
    if (!empty($_POST['submit'])) {
        $data = array(
            'quot_title' => strtolower(trim($this->input->post('quot_name'))),
            'page_url' => $this->input->post('page_url'),
            'quot_txt' => $this->input->post('desc'),
            'quot_by' => $this->input->post('quot_by'),
            'update_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->quot_update($data, $this->input->post('upd_id'));
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Quot Updated Succesfully');
            redirect(base_url() . 'imp-admin/quots');
        }
    }
}

public function del_quot($delid){
    $this->check_login();
    $res = $this->Admin_model->quot_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Quot Deleted Successfully');
        redirect(base_url() . 'imp-admin/quots');
    }
}
   //Quot end



   //term start
   public function terms(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->term_list();
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_term_list');
    $this->load->view('admin/includes/footer');
}

public function add_term(){ 
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    if (!empty($this->input->post('submit'))){
        $data = array(
            'term_name' => strtolower(trim($this->input->post('name'))),
            'term_category' => $this->input->post('cat'),
            'posted_by' => $this->input->post('by'),
            'reviewed_by' => $this->input->post('review'),
            'term_desc' => $this->input->post('desc'),
            'added_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->term_add($data);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Term added Successfully');
            redirect(base_url() . 'imp-admin/terms');
        }
    }
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_term');
    $this->load->view('admin/includes/footer');
}


public function term_edit($edit_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->term_by_id($edit_id); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_term_edit');
    $this->load->view('admin/includes/footer');
}


public function update_term(){
    $this->check_login();
    if (!empty($_POST['submit'])) {
        $data = array(
            'term_name' => strtolower(trim($this->input->post('name'))),
            'term_category' => $this->input->post('cat'),
            'posted_by' => $this->input->post('by'),
            'reviewed_by' => $this->input->post('review'),
            'term_desc' => $this->input->post('desc'),
            'updated_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->term_update($data, $this->input->post('upd_id'));
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Term Updated Succesfully');
            redirect(base_url() . 'imp-admin/terms');
        }
    }
}

public function del_term($delid){
    $this->check_login();
    $res = $this->Admin_model->term_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Term Deleted Successfully');
        redirect(base_url() . 'imp-admin/terms');
    }
}
   //term end


// comment start 
public function comment(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->comm_list(); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_comm_list', $data);
    $this->load->view('admin/includes/footer');
}
public function comm_more_info($comm_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->comm_more_info($comm_id); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_comm_info', $data);
    $this->load->view('admin/includes/footer');
}
public function comm_approve($comm_id){
    $this->check_login();
    $res = $this->Admin_model->comm_approve($comm_id); 
    if($res == true){
        $this->session->set_flashdata('msg', 'Succesfully Comment Approved.');
        redirect(base_url() . 'imp-admin/comment');
    }
}
public function comm_delete($comm_id){
    $this->check_login();
    $res = $this->Admin_model->comm_del($comm_id); 
    if($res == true){
        $this->session->set_flashdata('msg', 'Comment Deleted Successfully.');
        redirect(base_url() . 'imp-admin/comment');
    }
}
public function del_comm($comm_id){
    $this->comm_delete($comm_id);
}
// comment end




// admin/catss/$1 start
public function catss($cat_name){ 
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    foreach($data['catss'] as $cat){if($cat['cat_name']==str_replace('-',' ',$cat_name)){$cat_id= $cat['cat_id'];}}
    $data['res'] = $this->Admin_model->get_subcat_list($cat_id);
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_particular_subcats');
    $this->load->view('admin/includes/footer');
}
// admin/catss/$1 end
// /admin/posts/$1 start
public function posts($subcat_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list(); 
    $data['subcat'] = $this->Admin_model->get_subcat($subcat_id); 
    $data['res'] = $this->Admin_model->get_post_by_subcatid($subcat_id);
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_particular_posts');
    $this->load->view('admin/includes/footer');
}
// /admin/posts/$1 end


}
