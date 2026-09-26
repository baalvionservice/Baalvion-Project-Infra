<?php

defined('BASEPATH') OR exit('No direct script access allowed');



class TermsCtrl extends CI_Controller {  
	public function __construct(){ 
		parent::__construct(); 
		$this->load->model('Category_model'); 
		$this->load->model('SubCategory_model'); 
		$this->load->model('Meta_model');  
		$this->load->model('Term_model');   
		$this->load->model('Quots_model');
		$this->load->library('session');
    }

	public function load($letter){   
		$data['meta'] = $this->Meta_model->meta_details(uri_string());  
		$data['quots'] = $this->Quots_model->page_wise_quots(uri_string()); 
        $data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list(); 
        $data['terms'] = $this->Term_model->term_list($letter); 
		// print_r($data['terms']);die; 
		$this->load->view('includes/header', $data); 
		$this->load->view('terms_view');  
		$this->load->view('includes/footer'); 
	}

}