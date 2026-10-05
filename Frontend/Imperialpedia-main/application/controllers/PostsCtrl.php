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
		$this->load->model('Setting_model');
		// Section switched off in the admin panel: 410 so search engines drop it.
		if($this->uri->segment(1) === 'cookies' && !$this->Setting_model->cookies_section_enabled()){
			$this->output->set_status_header(410);
			$this->output->set_header('X-Robots-Tag: noindex');
			$this->output->set_content_type('text/plain', 'utf-8');
			$this->output->set_output("410 Gone\n")->_display();
			exit;
		}
	} 



	private function gone(){
		$this->output->set_status_header(410);
		$this->output->set_header('X-Robots-Tag: noindex');
		$this->output->set_output('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page removed - Imperialpedia</title></head><body style="font-family:sans-serif;max-width:560px;margin:15vh auto;padding:0 20px"><h1>This page has been removed</h1><p>The page you are looking for no longer exists. <a href="' . htmlspecialchars(base_url()) . '">Go to the Imperialpedia homepage</a>.</p></body></html>');
	}

	private function slugify($v){
		return strtolower(str_replace(' ', '-', trim($v)));
	}

	// The one real URL for a post is /category/sub-category/post, the same shape the sitemap lists.
	private function canonical_post_path($post){
		$row = $this->db->select('c.cat_name, s.sub_cat_name')
			->from('post p')
			->join('category c', 'c.cat_id = p.cat_id')
			->join('sub_category s', 's.sub_cat_id = p.sub_cat_id')
			->where('p.post_id', $post['post_id'])
			->get()->row_array();
		if(empty($row)){
			return null;
		}
		return $this->slugify($row['cat_name']) . '/' . $this->slugify($row['sub_cat_name']) . '/' . $this->slugify($post['uri']);
	}

	private function redirect_to_canonical($path){
		if(trim(uri_string(), '/') === $path){
			return false;
		}
		redirect(base_url($path), 'location', 301);
		return true;
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

			if(!empty($data['get_subcat_info'])){
				$on_own_category = false;
				foreach($data['get_subcat_info'] as $sc){
					if($this->slugify($sc['cat_name']) === $seg1){
						$on_own_category = true;
					}
				}
				if(!$on_own_category){
					$first = $data['get_subcat_info'][0];
					$this->redirect_to_canonical($this->slugify($first['cat_name']) . '/' . $this->slugify($first['sub_cat_name']));
				}
			}

			if(empty($data['get_subcat_info'])){
				$post_by_url = $this->Post_model->get_post_by_url($seg2);
				if(empty($post_by_url)){
					$post_by_url = $this->Post_model->get_post_by_url(str_replace('-',' ',$seg2));
				}
				if(!empty($post_by_url)){
					$canonical = $this->canonical_post_path($post_by_url[0]);
					if($canonical !== null){
						$this->redirect_to_canonical($canonical);
					}
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

			// Neither a sub-category nor a post: nothing real lives at this URL.
			if(empty($data['get_subcat_info']) && empty($data['post'])){
				$this->gone();
				return;
			}

			// Unknown top-level section (e.g. a URL from the retired Next.js site): 410, not a template-load 500.
			if(!file_exists(APPPATH.'views/'.$seg1.'_view.php')){
				$this->gone();
				return;
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
			if(empty($data['post_details'])){
				$this->gone();
				return;
			}
			$canonical = $this->canonical_post_path($data['post_details'][0]);
			if($canonical !== null){
				$this->redirect_to_canonical($canonical);
			}
			if(!file_exists(APPPATH.'views/'.$this->uri->segment(1).'_details_view.php')){
				$this->gone();
				return;
			}
			$this->load->view('includes/header', $data); 
			$this->load->view($this->uri->segment(1).'_details_view'); 
			$this->load->view('includes/footer'); 
		}else{ redirect(base_url()); } 
	}




}