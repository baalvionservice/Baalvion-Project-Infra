<?php
defined('BASEPATH') or exit('No direct script access allowed');

// GET /news: the latest news, grouped by day. "Today" and "Yesterday" are worked out on every request.
class NewsCtrl extends CI_Controller {
	public function __construct() {
		parent::__construct();
		$this->load->model('Category_model');
		$this->load->model('SubCategory_model');
		$this->load->model('Quots_model');
		$this->load->library('session');
	}

	public function index() {
		$data['meta'] = array(array(
			'meta_title' => 'Latest News - Imperialpedia',
			'meta_desc'  => 'The latest news and trending stories from Imperialpedia, updated daily.',
		));
		$data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list();
		$data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$data['items'] = news_feed(80);
		$this->load->view('includes/header', $data);
		$this->load->view('news_index_view', $data);
		$this->load->view('includes/footer');
	}
}
