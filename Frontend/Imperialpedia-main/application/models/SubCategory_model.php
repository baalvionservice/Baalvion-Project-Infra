<?php
defined('BASEPATH') OR exit('No direct script access allowed');
 
class SubCategory_model extends CI_Model{ 
	
	public function __construct(){ 
		parent::__construct(); 
	}

	public function subcat_list(){ 
		$query = $this->db->get('sub_category');
 		return $query->result_array();
	} 

	// selected subcate by category id 
	public function get_subcat($cat_id){ 
		$this->db->select('*');
        $this->db->from('sub_category');
		$this->db->where('cat_id',$cat_id);
		$query=$this->db->get();
 		return $query->result_array();
	} 

	// all subcategory of given "category" 
	public function get_subcat_list($pg_url){ 
		$this->db->select('*');
        $this->db->from('sub_category s'); 
        $this->db->join('category c', 's.cat_id=c.cat_id');
        $this->db->where('c.cat_name',$pg_url);
		$query=$this->db->get();
 		return $query->result_array();
	} 


	// all info about given "subcategory" 
	public function get_subcat_details($title){ 
		$this->db->select('*');
        $this->db->from('sub_category s'); 
        $this->db->join('category c', 's.cat_id=c.cat_id');
        $this->db->where('s.sub_cat_name',$title);
		$query=$this->db->get();
 		return $query->result_array();
	} 

	// get sub-cat id by page url
	public function get_subcat_id($pg_url){ 
		$this->db->select('*');
		$this->db->from('sub_category');
		$this->db->where('sub_cat_name',$pg_url);
		$query = $this->db->get(); 
		foreach ($query->result_array() as $row){
		  return $row['sub_cat_id'];
		}
	}
  

}



