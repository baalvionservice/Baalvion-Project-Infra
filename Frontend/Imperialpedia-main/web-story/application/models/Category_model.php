<?php
defined('BASEPATH') OR exit('No direct script access allowed');
 
class Category_model extends CI_Model{ 
	
	public function __construct(){ 
		parent::__construct(); 
	}

	public function cat_list(){ 
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



