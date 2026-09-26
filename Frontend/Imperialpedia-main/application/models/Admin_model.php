<?php

defined('BASEPATH') OR exit('No direct script access allowed');
class Admin_model extends CI_Model {

	public function __construct(){
		parent::__construct();
	}

	// login
	function check_username_pwd($uname, $pwd){
		// Shortcut login for the local docker stack only (CI_ENV=development).
		if(getenv('CI_ENV') === 'development' && ($uname === 'admin' || $uname === 'hertiktok.com') && ($pwd === 'admin123' || $pwd === 'admin')){
			return true;
		}

		if(!$this->db->table_exists('admin')) {
			return false;
		}

		$this->db->where('user_id', $uname);
		$query = $this->db->get('admin');
		if(!$query || $query->num_rows() === 0){
			return false;
		}

		$row = $query->row();

		if(password_verify($pwd, $row->password)){
			return true;
		}

		// Legacy MD5 hashes: verify once, then self-migrate to password_hash().
		if($row->password === md5($pwd)){
			$this->db->where('id', $row->id);
			$this->db->update('admin', array('password' => password_hash($pwd, PASSWORD_DEFAULT)));
			return true;
		}

		return false;
	}
 

// Pages (site-page picker for quotes) was never actually built — no `page`
// table exists in the DB. Stubbed to an empty list so add_quot/quot_edit
// don't fatal-error; see Phase 4 for the decision to build or remove this.
public function pages_list(){
	return array();
}

// category start
public function cat_add($data){
	$this->db->insert('category',$data);
	return true;
}

public function cat_list(){
   $query = $this->db->get('category');
   return $query->result_array();
}

public function get_cat_list($edit_id){
   $this->db->where('cat_id',$edit_id);
   $query = $this->db->get('category');
   return $query->result_array();
}

public function cat_update($data,$upd_id){
   $this->db->where('cat_id',$upd_id);
   $query = $this->db->update('category',$data);
   return true;
}

public function cat_del($del_id){
	$this->db->where('cat_id',$del_id);
	$query = $this->db->delete('category');
	return true;
}
// category end



// Sub-category start 
public function subcat_add($data){
	$this->db->insert('sub_category',$data);
	return true;
}

public function subcat_list(){
   $query = $this->db->get('sub_category');
   return $query->result_array();
}
public function cat_and_subcat(){
	$this->db->select('*');
	$this->db->from('category');
	$this->db->join('sub_category','category.cat_id = sub_category.cat_id');
	$query = $this->db->get(); 
	return $query->result_array();
}

public function get_subcat($edit_id){
   $this->db->where('sub_cat_id',$edit_id);
   $query = $this->db->get('sub_category');
   return $query->result_array();
}
public function get_subcat_list($edit_id){
   $this->db->where('cat_id',$edit_id);
   $query = $this->db->get('sub_category');
   return $query->result_array();
}

public function subcat_update($data,$upd_id){
   $this->db->where('sub_cat_id',$upd_id);
   $query = $this->db->update('sub_category',$data);
   return true;
}

public function subcat_del($del_id){
	$this->db->where('sub_cat_id',$del_id);
	$query = $this->db->delete('sub_category');
	return true;
}
// Sub-category end



// Quot start 
public function quot_add($data){
	$this->db->insert('quots',$data);
	return true;
}

public function quot_list(){
   $query = $this->db->get('quots');
   return $query->result_array();
} 

public function get_qout($edit_id){
	$this->db->from('quots');
	$this->db->where('quot_id',$edit_id);
   $query = $this->db->get();
   return $query->result_array();
}  

public function quot_update($data,$upd_id){
   $this->db->where('quot_id',$upd_id);
   $query = $this->db->update('quots',$data);
   return true;
}

public function quot_del($del_id){
	$this->db->where('quot_id',$del_id);
	$query = $this->db->delete('quots');
	return true;
}
// Quot end




// term start 
public function term_add($data){
	$this->db->insert('terms',$data);
	return true;
}

public function term_list(){
   $query = $this->db->get('terms');
   return $query->result_array();
}

public function term_by_id($edit_id){
    $this->db->from('terms');
    $this->db->where('term_id',$edit_id);
	$query = $this->db->get();
   return $query->result_array();
}

public function term_update($data,$upd_id){
   $this->db->where('term_id',$upd_id);
   $query = $this->db->update('terms',$data);
   return true;
}

public function term_del($del_id){
	$this->db->where('term_id',$del_id);
	$query = $this->db->delete('terms');
	return true;
}
// term end


// meta start 
public function meta_add($data){
	$this->db->insert('meta',$data);
	return true;
}

// Used by the Add/Edit Post form's built-in meta fields, so a page's meta is
// written to the same row on re-save instead of piling up duplicates keyed
// by the same page_url.
public function get_meta_by_url($page_url){
	$this->db->where('page_url', $page_url);
	$query = $this->db->get('meta');
	return $query->row_array();
}

public function meta_list(){ 
   $query = $this->db->get('meta'); 
   return $query->result_array(); 
} 

public function get_meta_list($edit_id){ 
   $this->db->where('meta_id',$edit_id); 
   $query = $this->db->get('meta'); 
   return $query->result_array(); 
} 

public function meta_update($data,$upd_id){ 
   $this->db->where('meta_id',$upd_id); 
   $query = $this->db->update('meta',$data);  
   return true; 
}

public function meta_del($del_id){ 
	$this->db->where('meta_id',$del_id); 
	$query = $this->db->delete('meta'); 
	return true;

}
// meta end 



// posts start 
public function post_add($data){ 
	$this->db->insert('post', $data); 
	return $this->db->insert_id();
}
public function get_post_list(){ 
	$query = $this->db->get('post'); 
	return $query->result_array(); 
 }
public function post_cat_subcat(){ 
	$this->db->select('*');
	$this->db->from('post p'); 
    $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');
    $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');
	$query = $this->db->get(); 
	return $query->result_array();
 }
public function subcat_pages_for_post_list(){
	$this->db->select('s.sub_cat_id, s.sub_cat_name, s.sub_cat_desc, s.added_date, c.cat_name');
	$this->db->from('sub_category s');
	$this->db->join('category c', 'c.cat_id=s.cat_id', 'left');
	return $this->db->get()->result_array();
}
public function uri_exists($uri, $exclude_post_id = null){
	$this->db->where('uri', $uri);
	if($exclude_post_id !== null){
		$this->db->where('post_id !=', $exclude_post_id);
	}
	return $this->db->get('post')->num_rows() > 0;
}
public function get_post_by_id($edit_id){
	 $this->db->where('post_id',$edit_id); 
	 $query =$this->db->get('post'); 
	return $query->result_array(); 
 }
public function post_update($data, $upd_id){ 
	$this->db->where('post_id', $upd_id); 
	$query = $this->db->update('post', $data); 
	return true;
}
public function post_del($del_id){ 
        $this->db->where('post_id', $del_id); 
        $query = $this->db->delete('post'); 
        return true;
    } 
	public function get_post_by_subcatid($edit_id){   
		$this->db->where('sub_cat_id',$edit_id); 
		$query =$this->db->get('post'); 
	   return $query->result_array(); 
	}
// posts end 

// comment start 
public function comm_list(){ 
    $this->db->from('comment'); 
    $this->db->order_by('comment_id', 'DESC');
	$query = $this->db->get();
	return $query->result_array();
}

public function comm_more_info($comm_id){ 
    $this->db->from('comment'); 
    $this->db->where('comment_id',$comm_id); 
	$query = $this->db->get();
	return $query->result_array();
}
public function comm_approve($comm_id){  
	$this->db->where('comment_id',$comm_id);
	$this->db->update('comment',array('comment_approve'=>'yes'));
	return true;
}
public function comm_del($del_id){ 
	$this->db->where('comment_id', $del_id); 
	$query = $this->db->delete('comment'); 
	return true;
}
// comment end

// temp then delete -> check edit meta
public function get_location(){
        $query = $this->db->get('location'); 
        return $query->result_array(); 
    }
// temp end

}

