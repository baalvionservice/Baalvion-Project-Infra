<?php

defined('BASEPATH') OR exit('No direct script access allowed');

 

class Post_model extends CI_Model{ 

	

	public function __construct(){ 

		parent::__construct(); 

	}


  // get post by url 
  public function get_post_by_url($url){
    $this->db->where('uri',$url);
    $query= $this->db->get('post');
    return $query->result_array();
  }



    // get post categery sub-category details

	public function post_cat_subcat($title){ 

        $this->db->select('*');

        $this->db->from('post p'); 

        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');

        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');

        $this->db->where('s.sub_cat_name',$title);

        $query = $this->db->get(); 

        return $query->result_array();

     }





    // one latest post 

    public function latest_post(){

        $this->db->select('*');

        $this->db->from('post p');

        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');

        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');

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

        $this->db->order_by('posted_date','DESC');

        $this->db->limit(6);

        $query=$this->db->get();

        return $query->result_array();

    }

  

    // other category ki one one latest post

    public function unique_latest_posts(){ 
      $query = $this->db->query('SELECT * FROM post WHERE posted_date IN (SELECT MAX(posted_date) FROM post GROUP BY sub_cat_id)');
      return $query->result_array();
    //  foreach($query->result() as $res){
    //   $this->db->from('post p'); 
    //   $this->db->join('category c', 'c.cat_id=p.cat_id', 'left'); 
    //   $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left'); 
    //   $this->db->where(array('p.sub_cat_id'=>$res->sub_cat_id,'p.cat_id'=>$res->cat_id)); 
    //   $query=$this->db->get(); 
    //   $queryy[]=$query->result_array();  
      //  $this->db->where('cat_id',$res->cat_id); 
      //  $re =$this->db->get('category')->row('cat_name');
      // return $re;
    //  }
    //  print_r($queryy);die;
      // return $query->result_array(); 
      // return $queryy;
    }







    // related post of given 'term '

    public function related_post($term_cate){ 
        $this->db->from('post p');

        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');

        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');

        $this->db->like('p.post_title',$term_cate); 

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



// one latest post filter by id
public function get_recent_post($cat_id,$limit){
  $this->db->select('*');
  $this->db->from('post p');
  $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');
  $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');
  $this->db->where('p.cat_id',$cat_id);
  $this->db->order_by('posted_date','DESC');
  if(!empty($limit)){
    $this->db->limit($limit);
  }
  $query=$this->db->get();
  return $query->result_array();
}


}