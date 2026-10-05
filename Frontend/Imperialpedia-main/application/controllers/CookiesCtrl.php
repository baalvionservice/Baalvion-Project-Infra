<?php
defined('BASEPATH') or exit('No direct script access allowed');

// GET /cookies — landing page listing every service in the cookies section.
class CookiesCtrl extends CI_Controller {

	public function __construct() {
		parent::__construct();
		$this->load->model('Category_model');
		$this->load->model('SubCategory_model');
		$this->load->model('Quots_model');
		$this->load->model('Setting_model');
		$this->load->library('session');
	}

	public function index() {
		// Section switched off in the admin panel: 410 so search engines drop it (same as the section's own pages).
		if (!$this->Setting_model->cookies_section_enabled()) {
			$this->output->set_status_header(410);
			$this->output->set_header('X-Robots-Tag: noindex');
			$this->output->set_content_type('text/plain', 'utf-8');
			$this->output->set_output("410 Gone\n");
			return;
		}

		$services = $this->db->select('s.sub_cat_name, s.sub_cat_desc, COUNT(p.post_id) AS article_count')
			->from('sub_category s')
			->join('category c', 'c.cat_id = s.cat_id')
			->join('post p', 'p.sub_cat_id = s.sub_cat_id AND p.status = "published"', 'left')
			->where('c.cat_name', 'cookies')
			->group_by('s.sub_cat_id, s.sub_cat_name, s.sub_cat_desc')
			->order_by('s.sub_cat_name', 'ASC')
			->get()->result_array();

		$data['meta'] = array(array(
			'meta_title' => 'Cookies: Streaming, Design and Writing Tool Guides - Imperialpedia',
			'meta_desc'  => 'Guides to the streaming, design and writing services people ask about most, from Netflix and Prime Video to Canva, Grammarly and Skillshare.',
		));
		$data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list();
		$data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$data['services'] = $services;

		$this->load->view('includes/header', $data);
		$this->load->view('cookies_index_view', $data);
		$this->load->view('includes/footer');
	}
}
