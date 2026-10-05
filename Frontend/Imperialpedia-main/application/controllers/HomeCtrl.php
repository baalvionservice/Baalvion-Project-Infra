<?php

defined('BASEPATH') or exit('No direct script access allowed'); 

class HomeCtrl extends CI_Controller{ 
    public function __construct(){ 
		parent::__construct(); 
		$this->load->model('Category_model'); 
		$this->load->model('SubCategory_model'); 
		$this->load->model('Meta_model'); 
		$this->load->model('Post_model'); 
		$this->load->model('Quots_model'); 
		$this->load->library('session');
	}



	public function index(){ 
        $data['meta'] = $this->Meta_model->meta_details('index.php');
        $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());   
        $data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list(); 
        $data['latest_post'] = $this->Post_model->latest_post(); 
        $data['six_simillar_post'] = $this->Post_model->six_simillar_post(); 
        $data['unique_latest_posts'] = $this->Post_model->unique_latest_posts(); 

        // Homepage feed: every published post outside the cookies section, newest first, with a short text sample for excerpts.
        $data['home_posts'] = $this->db->query(
            "SELECT p.post_id, p.uri, p.post_title, p.post_img, p.posted_date, p.post_updated, p.author_id,
                    SUBSTRING(p.post_desc, 1, 900) AS post_sample, CHAR_LENGTH(p.post_desc) AS post_chars,
                    c.cat_name, s.sub_cat_name
             FROM post p
             JOIN category c ON c.cat_id = p.cat_id
             JOIN sub_category s ON s.sub_cat_id = p.sub_cat_id
             WHERE p.status = 'published' AND c.cat_name <> 'cookies'
             ORDER BY p.posted_date DESC"
        )->result_array();
        $data['home_authors'] = $this->db->table_exists('author') ? $this->db->get('author')->result_array() : array();
        // echo'<pre/>'; print_r($data['unique_latest_posts']);die;  
		$this->load->view('includes/header', $data); 
		$this->load->view('home_view'); 
		$this->load->view('includes/footer'); 
	}



}