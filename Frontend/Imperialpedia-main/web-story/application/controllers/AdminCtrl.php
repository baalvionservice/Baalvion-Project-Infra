<?php
class AdminCtrl extends CI_Controller{

    public function __construct(){
        parent::__construct();
        $this->load->model('Admin_model');
        $this->load->model('SubCategory_model');
        $this->load->model('Meta_model');
        $this->load->model('Category_model'); 
        $this->load->model('Post_model');
        $this->load->library('session');
    }

    public function index(){
        $this->load->view('admin/view_login');
    }


    public function dashboard(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');    
        $this->load->view('admin/view_dashboard');
        $this->load->view('admin/includes/footer');
    }


    //login
    public function login_admin(){
        if (!empty($this->input->post('submit'))){
            $name = $this->input->post('uname');
            $pwd = $this->input->post('pwd');
              $var = $this->Admin_model->check_username_pwd($name, $pwd);
            if ($var == true) {
                $this->session->set_userdata('username', $name);
                redirect(base_url() . 'imp-admin/dashboard');
            } else {
                $this->session->set_flashdata('err_msg', 'Invalid Username or Password');
                redirect(base_url() . 'imp-admin');
            }
        }
    }


    //logout
    public function signout(){
        $this->session->unset_userdata('username');
        redirect(base_url() . "imp-admin");
    }

    //check-login
    public function check_login(){
        if (empty($this->session->userdata('username'))) {
            redirect(base_url() . 'imp-admin');
        }
    }



    //meta start
    public function meta(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $metadata['res'] = $this->Admin_model->meta_list();
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_meta_list', $metadata);
        $this->load->view('admin/includes/footer');
    }

    public function add_meta(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list(); 
        if (!empty($this->input->post('submit'))){ 
            extract($this->input->post());
            $data = array( 
                'page_url' => trim($page_url),
                'meta_title' => $meta_title,
                'meta_desc' => $meta_des,
                'added_date' => date('Y-m-d H:i:s')
            );
            $res = $this->Admin_model->meta_add($data);
            if ($res == true) {
                $this->session->set_flashdata('msg', 'Meta Added Successfully');
                redirect(base_url() . 'imp-admin/meta');
            }
        }
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_add_meta');
        $this->load->view('admin/includes/footer');
    }

    public function edit_meta($edit_id){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['res'] = $this->Admin_model->get_meta_list($edit_id); 
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_meta_edit');
        $this->load->view('admin/includes/footer');
    }

    public function meta_update(){
        $this->check_login();
        if (!empty($_POST['submit'])) {
            extract($this->input->post());
            $data = array( 
                'page_url' => trim($page_url),
                'meta_title' => $meta_title,
                'meta_desc' => $meta_des,
                'updated_date' => date('Y-m-d H:i:s')
            );
            $res = $this->Admin_model->meta_update($data, $upd_id);
            if ($res == true) {
                $this->session->set_flashdata('msg', 'Meta Updated Succesfully');
                redirect(base_url() . 'imp-admin/meta');
            }
        }
    }


    public function del_meta($delid){
        $this->check_login();
        $res = $this->Admin_model->meta_del($delid);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Meta Deleted Successfully');
            redirect(base_url() . 'imp-admin/meta');
        }
    }
  //meta end


  //post start
    public function post(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $post['res'] = $this->Admin_model->post_cat_subcat();
        // print_r($post['res']);die;
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_post_list', $post);
        $this->load->view('admin/includes/footer');
    }

    public function add_post(){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['get_category'] = $this->Admin_model->cat_list();
        $data['get_sub_cat'] = $this->Admin_model->subcat_list();
        if (!empty($this->input->post('submit'))) { 
            if(!empty($_FILES['pimg']['name'])) {
                $config['upload_path']   = 'uploads/post';
                $config['allowed_types'] = 'jpg|gif|png|jpeg';
    
                $this->upload->initialize($config);
                if (!$this->upload->do_upload('pimg')) {
                } else {
                    $pimg = $this->upload->data('file_name');
                }
            }else{$pimg='post.png';} 
                extract($this->input->post());
                $data = array(
                    'cat_id' => $cate,
                    'sub_cat_id' => $scat,
                    'post_title' => strtolower(trim(str_replace('?',' ',$post_title))),
                    'uri' => strtolower(trim(str_replace('-',' ',str_replace('?',' ',$post_url)))),
                    'post_img' => $pimg,
                    'post_alt_title' => $post_alt_title,
                    'post_desc' => $desc, 
                    'posted_date' => date('Y-m-d H:i:s')
                );
                $res_id = $this->Admin_model->post_add($data);
                if (!empty($res_id)) {
                    $this->session->set_flashdata('msg', 'Post Added Successfully');
                    redirect(base_url() . "imp-admin/post");
                }
        }
        $this->load->view('admin/includes/header',$data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_add_post');
        $this->load->view('admin/includes/footer');
    }

    public function edit_post($edit_id){
        $this->check_login();
        $data['catss'] = $this->Admin_model->cat_list();
        $data['get_category'] = $this->Admin_model->cat_list();
        $data['get_sub_cat'] = $this->Admin_model->subcat_list();
        $data['res'] = $this->Admin_model->get_post_by_id($edit_id);
        $this->load->view('admin/includes/header', $data);
        $this->load->view('admin/includes/sidebar');
        $this->load->view('admin/view_post_edit');
        $this->load->view('admin/includes/footer');
    }

    public function update_post(){
        $this->check_login();
        if (!empty($this->input->post('update'))) { 
            if (!empty($_FILES['pimg']['name'])) {
                $config['upload_path']   = 'uploads/post';
                $config['allowed_types'] = 'jpg|gif|png|jpeg';
    
                $this->upload->initialize($config);
                if (!$this->upload->do_upload('pimg')) {
                } else {
                    $pimg = $this->upload->data('file_name');
                }
            }  
                extract($this->input->post());
                if(!empty($pimg) ){
                    $data = array(
                        'cat_id' => $cate,
                        'sub_cat_id' => $scat,
                        'post_title' => strtolower(trim(str_replace('?',' ',$post_title))),
                        'uri' => strtolower(trim(str_replace('-',' ',str_replace('?',' ',$post_url)))), 
                        'post_img' => $pimg,
                        'post_alt_title' => $post_alt_title,
                        'post_desc' => $desc, 
                        'posted_date' => date('Y-m-d H:i:s')
                        ); 
                }else{
                $data = array(
                    'cat_id' => $cate,
                    'sub_cat_id' => $scat,
                    'post_title' => strtolower(trim(str_replace('?',' ',$post_title))),
                    'uri' => strtolower(trim(str_replace('-',' ',str_replace('?',' ',$post_url)))),  
                    'post_desc' => $desc, 
                    'post_alt_title' => $post_alt_title,
                    'posted_date' => date('Y-m-d H:i:s')
                    );
                }
              
                $res_id = $this->Admin_model->post_update($data,$upd_id);
                if (!empty($res_id)){
                    $this->session->set_flashdata('msg', 'Post Update Successfully');
                    redirect(base_url() . "imp-admin/post");
                }
        }
    }

    public function del_post($del_id){
        $this->check_login();
        $res = $this->Admin_model->post_del($del_id);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Profile Deleted Successfully');
            redirect(base_url() . 'imp-admin/post');
        }
    }

//post end
   

   //category start
   public function category(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $catdata['res'] = $this->Admin_model->cat_list();
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_cat_list', $catdata);
    $this->load->view('admin/includes/footer');
}

public function add_cat(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    if (!empty($this->input->post('submit'))){
        extract($this->input->post());
        $data = array(
            'cat_name' => strtolower(trim($cat)),
            'added_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->cat_add($data);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Category added Successfully');
            redirect(base_url() . 'imp-admin/category');
        }
    }
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_cat');
    $this->load->view('admin/includes/footer');
}


public function cat_edit($edit_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->get_cat_list($edit_id);
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_cat_edit');
    $this->load->view('admin/includes/footer');
}


public function update_cat(){
    $this->check_login();
    if (!empty($_POST['submit'])) {
        extract($this->input->post());
        $data = array(
            'cat_name' => strtolower(trim($title)),
            'updated_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->cat_update($data, $upd_id);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Category Updated Succesfully');
            redirect(base_url() . 'imp-admin/category');
        }
    }
}

public function del_cat($delid){
    $this->check_login();
    $res = $this->Admin_model->cat_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Category Deleted Successfully');
        redirect(base_url() . 'imp-admin/category');
    }
}
   //category end


//Sub category start
public function sub_cat(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $catdata['res'] = $this->Admin_model->cat_and_subcat();
    // print_r($catdata['res']);die;
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_subcat_list', $catdata);
    $this->load->view('admin/includes/footer');
}

public function add_subcat(){ 
    $this->check_login(); 
    $data['get_cats'] = $this->Admin_model->cat_list();
    $data['catss'] = $this->Admin_model->cat_list();
    if (!empty($this->input->post('submit'))) { 
        if(!empty($_FILES['aimg']['name'])) {
            $config['upload_path']   = 'uploads/author';
            $config['allowed_types'] = 'jpg|gif|png|jpeg';

            $this->upload->initialize($config);
            if (!$this->upload->do_upload('aimg')) {
            } else {
                $author_img = $this->upload->data('file_name');
            }
        }else{$author_img='user.png';} 
            extract($this->input->post());
            $data = array(
                'cat_id' => $subcat_id,
                'sub_cat_name' => strtolower(trim($subcat_name)),
                'sub_cat_desc' => $desc,
                'author_name' => strtolower(trim($author)),
                'author_img' => $author_img,
                'tags' => strtolower(trim($tags)),
                'cookie' => $cookie,
                'added_date' => date('Y-m-d H:i:s')
            );
            $res = $this->Admin_model->subcat_add($data);
            if ($res == true) {
                $this->session->set_flashdata('msg', 'Sub-category added Successfully');
                redirect(base_url() . 'imp-admin/sub_cat');
            }
    } 
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_subCat');
    $this->load->view('admin/includes/footer');
}


public function subcat_edit($edit_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->get_subcat($edit_id);
    $data['get_cats'] = $this->Admin_model->cat_list();
    // print_r($data['res']);
    // print_r($data['get_cats']);die;
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_subCat_edit');
    $this->load->view('admin/includes/footer');
}


public function update_subcat(){
    $this->check_login();

    if (!empty($this->input->post('submit'))) { 
        if(!empty($_FILES['aimg']['name'])) {
            $config['upload_path']   = 'uploads/author';
            $config['allowed_types'] = 'jpg|gif|png|jpeg';

            $this->upload->initialize($config);
            if (!$this->upload->do_upload('aimg')) {
            } else {
                $author_img = $this->upload->data('file_name');
            }
            extract($this->input->post());
            $data = array(
                'cat_id' => $subcat_id,
                'sub_cat_name' => strtolower(trim($subcat_name)),
                'sub_cat_desc' => $desc,
                'author_name' => strtolower(trim($author)),
                'author_img' => $author_img,
                'tags' => strtolower(trim($tags)),
                'cookie' => $cookie,
                'added_date' => date('Y-m-d H:i:s')
            );
        }else{
            extract($this->input->post());
            $data = array(
                'cat_id' => $subcat_id,
                'sub_cat_name' => strtolower(trim($subcat_name)),
                'sub_cat_desc' => $desc,
                'author_name' => strtolower(trim($author)), 
                'tags' => strtolower(trim($tags)),
                'cookie' => $cookie,
                'added_date' => date('Y-m-d H:i:s')
            );
         }
            $res = $this->Admin_model->subcat_update($data, $upd_id);
            if ($res == true) {
                $this->session->set_flashdata('msg', 'Sub-category added Successfully');
                redirect(base_url() . 'imp-admin/sub_cat');
            }
    } 
}

public function del_subcat($delid){
    $this->check_login();
    $res = $this->Admin_model->subcat_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Sub-category Deleted Successfully');
        redirect(base_url() . 'imp-admin/sub_cat');
    }
}
   //Sub category end



//Quot start
public function quots(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->quot_list();
    // print_r($data['res']);die;
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_quot_list');
    $this->load->view('admin/includes/footer');
}

public function add_quot(){
    $data['catss'] = $this->Admin_model->cat_list();
    $data['get_pages'] = $this->Admin_model->pages_list();
    // print_r($data['get_pages']);
    $this->check_login();
    if (!empty($this->input->post('submit'))){
        extract($this->input->post());
        $data = array(
            'quot_title' => strtolower(trim($quot_name)),
            'page_url' => $page_url,
            'quot_txt' => $desc,
            'quot_by' => $quot_by,
            'added_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->quot_add($data);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Quot added Successfully');
            redirect(base_url() . 'imp-admin/quots');
        }
    }
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_quot');
    $this->load->view('admin/includes/footer');
}


public function quot_edit($edit_id){
    $this->check_login(); //print_r($edit_id);die;
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->get_qout($edit_id);
    $data['get_pages'] = $this->Admin_model->pages_list(); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_quot_edit');
    $this->load->view('admin/includes/footer');
}


public function update_quot(){
    $this->check_login();
    if (!empty($_POST['submit'])) {
        extract($this->input->post());
        $data = array( 
            'quot_title' => strtolower(trim($quot_name)),
            'page_url' => $page_url,
            'quot_txt' => $desc,
            'quot_by' => $quot_by,
            'update_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->quot_update($data, $upd_id);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Quot Updated Succesfully');
            redirect(base_url() . 'imp-admin/quots');
        }
    }
}

public function del_quot($delid){
    $this->check_login();
    $res = $this->Admin_model->quot_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Quot Deleted Successfully');
        redirect(base_url() . 'imp-admin/quots');
    }
}
   //Quot end



   //term start
   public function terms(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->term_list();
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_term_list');
    $this->load->view('admin/includes/footer');
}

public function add_term(){ 
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    if (!empty($this->input->post('submit'))){
        extract($this->input->post());
        $data = array( 
            'term_name' => strtolower(trim($name)),
            'term_category' => $cat,
            'posted_by' => $by,
            'reviewed_by' => $review,
            'term_desc' => $desc,
            'added_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->term_add($data);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Term added Successfully');
            redirect(base_url() . 'imp-admin/terms');
        }
    }
    $this->load->view('admin/includes/header',$data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_add_term');
    $this->load->view('admin/includes/footer');
}


public function term_edit($edit_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->term_by_id($edit_id); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_term_edit');
    $this->load->view('admin/includes/footer');
}


public function update_term(){
    $this->check_login();
    if (!empty($_POST['submit'])) {
        extract($this->input->post());
        $data = array( 
            'term_name' => strtolower(trim($name)),
            'term_category' => $cat,
            'posted_by' => $by,
            'reviewed_by' => $review,
            'term_desc' => $desc,
            'updated_date' => date('Y-m-d H:i:s')
        );
        $res = $this->Admin_model->term_update($data, $upd_id);
        if ($res == true) {
            $this->session->set_flashdata('msg', 'Term Updated Succesfully');
            redirect(base_url() . 'imp-admin/terms');
        }
    }
}

public function del_term($delid){
    $this->check_login();
    $res = $this->Admin_model->term_del($delid);
    if ($res == true) {
        $this->session->set_flashdata('msg', 'Term Deleted Successfully');
        redirect(base_url() . 'imp-admin/terms');
    }
}
   //term end


// comment start 
public function comment(){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->comm_list(); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_comm_list');
    $this->load->view('admin/includes/footer');
}
public function comm_more_info($comm_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    $data['res'] = $this->Admin_model->comm_more_info($comm_id); 
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_comm_info');
    $this->load->view('admin/includes/footer');
}
public function comm_approve($comm_id){
    $this->check_login();
    $res = $this->Admin_model->comm_approve($comm_id); 
    if($res == true){
        $this->session->set_flashdata('msg', 'Succesfully Comment Aproved.');
        redirect(base_url() . 'imp-admin/comment');
    }
}
public function comm_delete($comm_id){
    $this->check_login();
    $res = $this->Admin_model->comm_del($comm_id); 
    if($res == true){
        $this->session->set_flashdata('msg', 'Comment Delete Successfully.');
        redirect(base_url() . 'imp-admin/comment');
    }
}
// comment end



// admin/catss/$1 start
public function catss($cat_name){ 
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list();
    foreach($data['catss'] as $cat){if($cat['cat_name']==str_replace('-',' ',$cat_name)){$cat_id= $cat['cat_id'];}}
    $data['res'] = $this->Admin_model->get_subcat_list($cat_id);
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_particular_subcats');
    $this->load->view('admin/includes/footer');
}
// admin/catss/$1 end
// /admin/posts/$1 start
public function posts($subcat_id){
    $this->check_login();
    $data['catss'] = $this->Admin_model->cat_list(); 
    $data['subcat'] = $this->Admin_model->get_subcat($subcat_id); 
    $data['res'] = $this->Admin_model->get_post_by_subcatid($subcat_id);  
    // print_r($data['res']);die;s
    $this->load->view('admin/includes/header', $data);
    $this->load->view('admin/includes/sidebar');
    $this->load->view('admin/view_particular_posts');
    $this->load->view('admin/includes/footer');
}
// /admin/posts/$1 end


// ajax calling terms start
public function ajax_terms(){ 
    $this->check_login();
        $msg = "<label for='last name' id='label_title'><b>Choose Sub-Page:</b></label>
    <select name='title_id' id='title_id' class='form-control'>
      <option value=''>--Select Title--</option>"; 
       for($i = 'a'; $i != 'aa'; $i++){
            $msg .= "<option value=" . $i . ">" . ucfirst($i) . "</option>";
        }
        $msg .= "</select>
    <br/>";
        echo $msg;
    }

    // get sub-cat list loop 
    public function ajax_cat(){   
        $pg_id =  $this->input->post('id'); 
        $pg_url = $this->Page_model->get_page_url($pg_id); 
        $cat_id = $this->Category_model->get_cat($pg_url); 
        $res = $this->SubCategory_model->get_subcat($cat_id);   
        $msg = "<label for='last name' id='label_title'><b>Choose Subcat:</b></label> 
    <select name='title_id' id='title_id' class='form-control'> 
      <option value=''>--Select Title--</option>"; 
        foreach ($res as $val){  $subcats=str_replace(' ','-',$val['sub_cat_name']);
            $cnt_meta_rows = $this->Meta_model->check_meta_description($cat_id, $val['sub_cat_id']); 
            if ($cnt_meta_rows > 0) { 
                $msg .= "<option value='" .$subcats. "' disabled>" . $val['sub_cat_name'] . "</option>"; 
            } else { 
                $msg .= "<option value='" .$subcats. "'>" . $val['sub_cat_name'] . "</option>"; 
            } 
        } 
        $msg .= "</select> 
    <br/>"; 
        echo $msg; 
    }


    // get posts title loop 
    public function ajax_subcat(){   
        $pg_id =  $this->input->post('id'); 
        $pg_url = $this->Page_model->get_page_url($pg_id); 
        $subcat_id = $this->SubCategory_model->get_subcat_id($pg_url); 
        $res = $this->Post_model->get_posts($subcat_id);   
        $msg = "<label for='last name' id='label_title'><b>Choose post:</b></label> 
    <select name='title_id' id='title_id' class='form-control'> 
      <option value=''>--Select Title--</option>"; 
        foreach ($res as $val) {  $posts=str_replace(' ','-',$val['uri']);
            $cnt_meta_rows = $this->Meta_model->check_meta_description($subcat_id, $val['sub_cat_id']); 
            if ($cnt_meta_rows > 0) { 
                $msg .= "<option value='" .$posts. "' disabled>" . $val['uri'] . "</option>"; 
            } else { 
                $msg .= "<option value='" .$posts. "'>" . $val['uri'] . "</option>"; 
            } 
        } 
        $msg .= "</select> 
    <br/>"; 
        echo $msg; 
    }
// ajax calling terms end

}
