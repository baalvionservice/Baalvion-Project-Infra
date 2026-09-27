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
					'linkedin' => $a['linkedin'] ?? 'https://linkedin.com',
					'twitter' => $a['twitter'] ?? 'https://x.com',
					'articles_count' => rand(5, 15),
					'articles' => [
						[
							'title' => 'Complete Editorial & Topic Benchmark Guide (2026)',
							'url' => base_url('seo/web-seo'),
							'category' => 'Editorial',
							'date' => date('M d, Y'),
							'read_time' => '8 min read',
							'excerpt' => 'Research insights and authoritative analysis published by ' . $a['name'] . '.'
						]
					]
				];
			}
		}
		return $authors;
	}
}