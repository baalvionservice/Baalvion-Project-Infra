<?php

defined('BASEPATH') or exit('No direct script access allowed');



class AboutCtrl extends CI_Controller{ 

	public function __construct(){ 
		parent::__construct(); 
		$this->load->model('Category_model'); 
		$this->load->model('SubCategory_model'); 
		$this->load->model('Meta_model');  
		$this->load->model('Quots_model'); 
		$this->load->library('session');
	} 
	public function index(){ 
		$data['meta'] = $this->Meta_model->meta_details(uri_string());
        $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$this->load->view('includes/header' , $data); 
		$this->load->view('about_view'); 
		$this->load->view('includes/footer'); 
	}

}