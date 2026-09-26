<?php
defined('BASEPATH') OR exit('No direct script access allowed');
 
class Term_model extends CI_Model{ 
	
	public function __construct(){ 
		parent::__construct(); 
	}

    // all terms of given char 'a'
	public function term_list($letter){ 
        $this->db->from('terms');  
        $this->db->like('term_name', $letter , 'after');
        $query = $this->db->get(); 
        return $query->result_array();
    }
  
    // details iformation about search  term  
    public function term_info($word){
        $this->db->from('terms');  
        $this->db->where('term_name', $word);
        $query = $this->db->get(); 
        return $query->result_array();
    }

    // relatad terms limit=5
    public function related_term($word){
        $myObject = $this->term_info($word);
         foreach($myObject as $tc){$term_category= $tc['term_category'];};
        $this->db->from('terms');  
        $this->db->where('term_category', $term_category);
        $this->db->limit(6);
        $query = $this->db->get(); 
        return $query->result_array();
    }


}