<?php

defined('BASEPATH') OR exit('No direct script access allowed'); 

class User_model extends CI_Model{  
	public function __construct(){  
		parent::__construct();  
	}
  

    // add new user 
	public function add_user($data){   
        $this->db->insert('register',$data);
        return true;
     }
  



    // check register  
	public function check_register($uid){   
        $this->db->from('register');
        $this->db->where('user_id',$uid);
        $query = $this->db->get();
        // print_r($query->num_rows());die;
        if ($query->num_rows() >= 1) {
            return true;
            } else {
            return false;
            }
     }


   //check user activation status
	public function check_status($uid){ 
        $this->db->from('register');
        $this->db->where('user_id',$uid);
        $query = $this->db->get();
        $res = $query->row(); 
        if($res->verify == 'active'){
           return true;
        }else{
            return false;
        }
     }


     // login 
	 function check_username_pwd($uid, $pwd){
		$pword = md5($pwd); 
		$this->db->where('user_id',$uid);
		$this->db->where('user_pass',$pword);
		$this->db->where('verify','active');
		$query = $this->db->get('register'); 
		if($query->num_rows()>0){
			return true;
		}else{
			return false;
		}
	}



     // register table data 
	 function get_userdata($uid){ 
		$this->db->from('register');
		$this->db->where('user_id',$uid);
		$query = $this->db->get();  
        return $query->result_array();
	}


    // update profile details 
    public function update_prof($data,$upd_id){ 
        $this->db->where('user_id',$upd_id);
        $this->db->update('register',$data);
        return true;
     } 
 

      // add new subscriber 
	public function new_subscriber($data){   
        $this->db->insert('subscribe',$data);
        return true;
     }
 

      // add new Comment 
	public function new_comment($data){   
        $this->db->insert('comment',$data);
        return true;
     }



      // update verification code 
	public function verify_code($code,$uid){   
        $this->db->where('user_id',$uid);
        $this->db->update('register',array('verify'=>$code));
        return true; 
     }

    //  get user info by code 
    public function get_user_info($code){
        $this->db->select('*');
        $this->db->where('verify',$code);
        $query = $this->db->get('register');
        $res = $query->row();
        return $res->user_id;
        
    }

      // Verify user email
	// public function verify_user_email($user,$data){   
    //     $this->db->where('user_id',$user);
    //     $this->db->update('register',$data);
    //     return true; 
    //  }




}