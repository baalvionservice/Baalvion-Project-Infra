<?php

defined('BASEPATH') OR exit('No direct script access allowed'); 

class Career_model extends CI_Model{  
	public function __construct(){  
		parent::__construct();  
	}

    // add new user 
	public function add_new_job_seeker($data){   
        $this->db->insert('career',$data);
        return true;
     }
  


}