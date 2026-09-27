<?php

defined('BASEPATH') OR exit('No direct script access allowed');



class TermCtrl extends CI_Controller {

	public function __construct(){

		parent::__construct();

		$this->load->model('Category_model');

		$this->load->model('SubCategory_model');

		$this->load->model('Meta_model'); 

		$this->load->model('Term_model');

		$this->load->model('Post_model');

		$this->load->model('Quots_model');
		
		$this->load->library('session');

	}

	public function term(){
		// echo '<pre/>';print_r($word);die;

		$pg_url = str_replace('-',' ',$this->uri->segment(1)); 
        $title = str_replace('-',' ',$this->uri->segment(2));
        $word = str_replace('-',' ',$this->uri->segment(3));

		$data['meta'] = $this->Meta_model->meta_details(uri_string()); 

		$data['quots'] = $this->Quots_model->page_wise_quots(uri_string());

        $data['cat_list'] = $this->Category_model->cat_list();

        $data['subcat_list'] = $this->SubCategory_model->subcat_list(); 

        $data['term'] = $this->Term_model->term_info(str_replace('-',' ',$word));

        $data['related_term'] = $this->Term_model->related_term(str_replace('-',' ',$word));

		//foreach($data['term'] as $tc){$term_cate=$tc['term_category'];}   //is there any simple way to print 'term_category'

		$data['related_post'] = $this->Post_model->related_post(str_replace('-',' ',$word));		 


		$this->load->view('includes/header', $data);

		$this->load->view('term_details_view');

		$this->load->view('includes/footer'); 

	}

}