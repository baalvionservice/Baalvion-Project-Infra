<?php 
defined('BASEPATH') or exit('No direct script access allowed'); 

/**
 * AuthorCtrl — Imperialpedia Editorial Board & Writers Controller
 */
class AuthorCtrl extends CI_Controller { 

	public function __construct() { 
		parent::__construct(); 
		$this->load->model('Category_model'); 
		$this->load->model('SubCategory_model'); 
		$this->load->model('Meta_model');  
		$this->load->model('Quots_model'); 
		$this->load->library('session');
	}

	// -----------------------------------------------------------------------
	// GET /author — Writers & Editorial Board Directory Hub
	// -----------------------------------------------------------------------
	public function index() { 
		$data['meta'] = $this->Meta_model->meta_details(uri_string());  
		$data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list(); 
		$data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$data['authors'] = $this->_get_authors();

		$this->load->view('includes/header', $data); 
		$this->load->view('author_view', $data); 
		$this->load->view('includes/footer'); 
	} 

	// -----------------------------------------------------------------------
	// GET /author/{slug} — Individual Writer Profile & Authored Articles Page
	// -----------------------------------------------------------------------
	public function profile($slug = '') {
		if (empty($slug)) {
			redirect(base_url('author'));
			return;
		}

		$authors = $this->_get_authors();
		if (!isset($authors[$slug])) {
			show_404();
			return;
		}

		$data['meta'] = $this->Meta_model->meta_details(uri_string());  
		$data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list(); 
		$data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$data['author'] = $authors[$slug];

		$this->load->view('includes/header', $data); 
		$this->load->view('author_profile_view', $data); 
		$this->load->view('includes/footer'); 
	}

	// -----------------------------------------------------------------------
	// Private: Real Authors & Writers Master Data Registry (DB-driven)
	// -----------------------------------------------------------------------
	private function _get_authors() {
		$this->load->database();
		$authors = [];
		if ($this->db->table_exists('author')) {
			$db_authors = $this->db->order_by('id', 'ASC')->get('author')->result_array();
			foreach ($db_authors as $a) {
				$topics = is_array($a['topics']) ? $a['topics'] : array_map('trim', explode(',', $a['topics'] ?? ''));
				$slug = $a['slug'];
				$authors[$slug] = [
					'id' => $a['id'],
					'name' => $a['name'],
					'slug' => $slug,
					'title' => $a['title'],
					'credentials' => $a['credentials'],
					'bio' => $a['bio'],
					'avatar' => author_avatar_url($a['avatar'] ?? '', $a['name']),
					'topics' => $topics,
					'linkedin' => $a['linkedin'] ?? '',
					'twitter' => $a['twitter'] ?? '',
					'articles' => $this->_articles_by($a['id'])
				];
			}
		}
		return $authors;
	}

	// Published articles written by one author, newest first.
	private function _articles_by($author_id) {
		$rows = $this->db->select('p.post_title, p.uri, p.post_desc, p.posted_date, c.cat_name, s.sub_cat_name')
			->from('post p')
			->join('category c', 'c.cat_id = p.cat_id', 'left')
			->join('sub_category s', 's.sub_cat_id = p.sub_cat_id', 'left')
			->where('p.author_id', (int)$author_id)
			->where('p.status', 'published')
			->order_by('p.posted_date', 'DESC')
			->get()->result_array();
		$out = [];
		foreach ($rows as $r) {
			$out[] = [
				'title' => ucfirst($r['post_title']),
				'url' => base_url(str_replace(' ', '-', $r['cat_name']) . '/' . str_replace(' ', '-', $r['sub_cat_name']) . '/' . str_replace(' ', '-', $r['uri'])),
				'category' => ucfirst($r['cat_name']),
				'date' => date('M d, Y', strtotime($r['posted_date'])),
				'read_time' => post_read_minutes($r['post_desc']) . ' min read',
				'excerpt' => seo_excerpt($r['post_desc'], 160),
			];
		}
		return $out;
	}
}
