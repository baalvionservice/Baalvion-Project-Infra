<?php

defined('BASEPATH') OR exit('No direct script access allowed');

 

class Quots_model extends CI_Model{  
	public function __construct(){  
		parent::__construct();  
	} 

	public function page_wise_quots($title){ 
        $this->db->select('*'); 
        $this->db->from('quots');  
       $this->db->where('page_url',$title); 
        $query = $this->db->get();  
        return $query->result_array(); 
    }



  



}