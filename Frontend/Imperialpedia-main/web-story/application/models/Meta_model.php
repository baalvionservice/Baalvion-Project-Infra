<?php

defined('BASEPATH') OR exit('No direct script access allowed'); 

class Meta_model extends CI_Model{  
	public function __construct(){  
		parent::__construct();  
	} 

	public function meta_details($pg_url){
        $this->db->select('*'); 
        $this->db->from('meta');  
        $this->db->where('page_url',$pg_url);  
        $query = $this->db->get();
        return $query->result_array(); 
    }
  

}