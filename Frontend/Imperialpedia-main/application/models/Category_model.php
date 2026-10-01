<?php
defined('BASEPATH') OR exit('No direct script access allowed');
 
class Category_model extends CI_Model{ 
	
	public function __construct(){ 
		parent::__construct(); 
	}

	public function cat_list(){ 
		$this->load->model('Setting_model');
		if(!$this->Setting_model->cookies_section_enabled()){
			$this->db->where('cat_name !=', 'cookies');
		}
		$query = $this->db->get('category');
 		return $query->result_array();
	} 

	// get cat id by page url
	public function get_cat($pg_url){ 
		$this->db->select('*');
		$this->db->from('category');
		$this->db->where('cat_name',$pg_url);
		$query = $this->db->get(); 
		foreach ($query->result_array() as $row){
		  return $row['cat_id'];
		}
	} 

  

}



