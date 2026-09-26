<?php

defined('BASEPATH') OR exit('No direct script access allowed');

 

class Post_model extends CI_Model{ 

	

	public function __construct(){ 

		parent::__construct(); 

	}


  // get post by url
  public function get_post_by_url($url){
    $this->db->group_start();
    $this->db->where('uri', $url);
    $this->db->or_where('uri', str_replace(' ', '-', $url));
    $this->db->group_end();
    $this->db->where('status', 'published');
    $query = $this->db->get('post');
    return $query->result_array();
  }



    // get post categery sub-category details

	public function post_cat_subcat($title){ 

        $this->db->select('*');

        $this->db->from('post p'); 

        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');

        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');

        $this->db->where('s.sub_cat_name',$title);

        $this->db->where('p.status','published');

        $query = $this->db->get();

        return $query->result_array();

     }





    // one latest post 

    public function latest_post(){

        $this->db->select('*');

        $this->db->from('post p');

        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');

        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');

        $this->db->where('p.status','published');

        $this->db->order_by('posted_date','DESC');

        $this->db->limit(1);

        $query=$this->db->get();

        return $query->result_array();

    }



    

    // six simmillar post of latest post 

    public function six_simillar_post(){

        $myObject = $this->latest_post();

         foreach($myObject as $mo){$latest_post= $mo['sub_cat_id'];};

        $this->db->select('*');

        $this->db->from('post p');

        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');

        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');

        $this->db->where('p.sub_cat_id', $latest_post);

        $this->db->where('p.status','published');

        $this->db->order_by('posted_date','DESC');

        $this->db->limit(6);

        $query=$this->db->get();

        return $query->result_array();

    }

  

    // other category ki one one latest post

    public function unique_latest_posts(){
      $query = $this->db->query("SELECT * FROM post WHERE status='published' AND posted_date IN (SELECT MAX(posted_date) FROM post WHERE status='published' GROUP BY sub_cat_id)");
      return $query->result_array();
    }







    // related post of given 'term '

    public function related_post($term_cate){ 
        $this->db->from('post p');

        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');

        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');

        $this->db->like('p.post_title',$term_cate);

        $this->db->where('p.status','published');

        $query=$this->db->get();

        return $query->result_array();

    }






      // Comment list 
    public function comm_list($page){

        $this->db->from('comment');

        $this->db->where('comment_page',$page);

        $this->db->where('comment_approve','yes'); 

        $query=$this->db->get();

        return $query->result_array();

    }

// get posts by sub-cat id 
public function get_posts($subcat_id){ 
  $this->db->select('*');
      $this->db->from('post');
  $this->db->where('sub_cat_id',$subcat_id);
  $query=$this->db->get();
   return $query->result_array();
}

}