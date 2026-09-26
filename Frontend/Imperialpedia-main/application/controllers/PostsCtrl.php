<?php

defined('BASEPATH') or exit('No direct script access allowed');



class PostsCtrl extends CI_Controller{ 
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
		$this->load->view('includes/header'); 
		$this->load->view('seo_view'); 
		$this->load->view('includes/footer'); 
	}

	public function posts(){ 
	    $pg_url = str_replace('-',' ',$this->uri->segment(1)); 
        $title = str_replace('-',' ',$this->uri->segment(2));
		$uri= array_values(explode('/',uri_string()))[0]; 
		$data['meta'] = $this->Meta_model->meta_details(uri_string());  
		$data['quots'] = $this->Quots_model->page_wise_quots($uri); 
        $data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list(); 
        $data['get_subcat_list'] = $this->SubCategory_model->get_subcat_list($pg_url); 
        $data['get_subcat_info'] = $this->SubCategory_model->get_subcat_details($title); 
        $data['post'] = $this->Post_model->post_cat_subcat($title); 
		$data['comments'] = $this->Post_model->comm_list(uri_string());//for cookies and editor page 
		if(!empty($this->uri->segment(1))){ 
			$seg1 = $this->uri->segment(1);
			$seg2 = $this->uri->segment(2);

			if($seg1 == 'seo' && ($seg2 == 'web-seo' || $seg2 == 'high-traffic-niche-calculator')){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/niche_calculator_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}
			if($seg1 == 'marketing' && ($seg2 == 'digital-marketing' || $seg2 == 'roas-cac-simulator')){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/roas_cac_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}
			if($seg1 == 'insurance' && ($seg2 == 'health-insurance' || $seg2 == 'health-premium-estimator')){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/health_premium_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}
			if($seg1 == 'internet' && ($seg2 == 'web-hosting' || $seg2 == 'server-bandwidth-sizer')){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/bandwidth_sizer_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}
			if($seg1 == 'attorney' && ($seg2 == 'immigration' || $seg2 == 'golden-visa-cost-index')){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/golden_visa_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}
			if(($seg1 == 'news' || $seg1 == 'tools') && $seg2 == 'whatsapp-dp-downloader'){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/whatsapp_dp_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}
			if(($seg1 == 'online-education' || $seg1 == 'tools') && $seg2 == 'savings-calculator'){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/savings_calc_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}
			if(($seg1 == 'editor' || $seg1 == 'tools') && $seg2 == 'credit-card-calculator'){
				$this->load->view('includes/header', $data); 
				$this->load->view('tools/credit_card_calc_view', $data); 
				$this->load->view('includes/footer');  
				return;
			}

			if(empty($data['get_subcat_info'])){
				$post_by_url = $this->Post_model->get_post_by_url($seg2);
				if(empty($post_by_url)){
					$post_by_url = $this->Post_model->get_post_by_url(str_replace('-',' ',$seg2));
				}
				if(!empty($post_by_url)){
					$data['post_details'] = $post_by_url;
					$this->load->view('includes/header', $data); 
					if(file_exists(APPPATH.'views/'.$seg1.'_details_view.php')){
						$this->load->view($seg1.'_details_view', $data); 
					} else {
						$this->load->view('seo_details_view', $data); 
					}
					$this->load->view('includes/footer');  
					return;
				}
			}

			$this->load->view('includes/header', $data); 
			$this->load->view($this->uri->segment(1).'_view', $data); 
			$this->load->view('includes/footer');  
		}else{ 
			redirect(base_url()); 
		} 
	}


	public function post(){  
	    $pg_url = str_replace('-',' ',$this->uri->segment(1)); 
        $title = str_replace('-',' ',$this->uri->segment(2));
        $url = str_replace('-',' ',$this->uri->segment(3));
		$uri= array_values(explode('/',uri_string()))[0]; 
		$data['meta'] = $this->Meta_model->meta_details(uri_string());  
		$data['quots'] = $this->Quots_model->page_wise_quots($uri); 
        $data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list(); 
        $data['get_subcat_list'] = $this->SubCategory_model->get_subcat_list($pg_url);  //get sub-category details
        $data['get_subcat_info'] = $this->SubCategory_model->get_subcat_details($title); //get given sub-category details
        $data['post'] = $this->Post_model->post_cat_subcat($title);
        $data['post_details'] = $this->Post_model->get_post_by_url($url);
        $data['comments'] = $this->Post_model->comm_list(uri_string());  
		if(!empty($this->uri->segment(1))){ 
			$this->load->view('includes/header', $data); 
			$this->load->view($this->uri->segment(1).'_details_view'); 
			$this->load->view('includes/footer'); 
		}else{ redirect(base_url()); } 
	}




}