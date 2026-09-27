<?php

defined('BASEPATH') or exit('No direct script access allowed');  

class UserCtrl extends CI_Controller{ 

	public function __construct(){ 
		parent::__construct(); 
		$this->load->model('Category_model'); 
		$this->load->model('SubCategory_model'); 
		$this->load->model('Meta_model');  
		$this->load->model('Quots_model'); 
		$this->load->model('User_model'); 
        // $this->load->library('javascript');
        $this->load->library('form_validation');
        // $this->load->library('email');
        $this->load->library('session');
	}

    public function login_view(){
		$data['meta'] = $this->Meta_model->meta_details(uri_string());
        $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$this->load->view('includes/header',$data); 
		$this->load->view('login_view'); 
		$this->load->view('includes/footer'); 
	}

	public function register_view(){ 
		$data['meta'] = $this->Meta_model->meta_details(uri_string());
        $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$this->load->view('includes/header' , $data); 
		$this->load->view('register_view'); 
		$this->load->view('includes/footer'); 
	} 

    //check login
    public function check_login(){
        if (empty($this->session->userdata('userid'))) {
            redirect(base_url() . 'login');
        }
    }


    // register 
    public function signup(){ 
        if (!empty($_POST['submit'])){
            extract($this->input->post());
          if((!empty($uid) ) && (!empty($pass)) && (!empty($cpass))){
            //check register
            $res =$this->User_model->check_register($uid); 
            if($res == true){
                    //check user activation status 
                     $sts = $this->User_model->check_status($uid); 
                    if($sts == false){
                        $this->session->set_flashdata('msg', '<div class="alert alert-warning" role="alert">Please Check Email & Active Your Account by <a href="https://mail.google.com/"> Email Verification</a></div>');
                        redirect(base_url() . 'register');
                    }
                $this->session->set_flashdata('msg', '<div class="alert alert-warning" role="alert">You are already registred.  please<a href="login">  login </a></div>');
                redirect(base_url() . 'register');
            }
             
            if($pass===$cpass){
                $this->form_validation->set_rules('uname', 'Username', 'trim|required|min_length[5]|max_length[12]');
                $this->form_validation->set_rules('pass', 'Password', 'trim|required|min_length[8]'); 
                $this->form_validation->set_rules('uid', 'Email', 'trim|required|valid_email');
                if ($this->form_validation->run() == FALSE){ 
                    $this->session->set_flashdata('msg', '<div class="alert alert-danger" role="alert">'.validation_errors().'</div>');
                    redirect(base_url() . 'register');
                }else{ 
                        $data = array(
                            'user_name' => $uname,
                            'user_id' => $uid,
                            'user_pass' => md5($pass), 
                            'added_date' => date('Y-m-d H:i:s')
                        );
                        $res = $this->User_model->add_user($data);
                        if ($res == true){
                            if($this->verification_mail($uid)==true){
                            $this->session->set_flashdata('err_msg', '<div class="alert alert-success" role="alert">Please Verify Your Mail:  '. $uid.'</div>');
                            $this->session->set_flashdata('resend_activ', '<a href="'.base_url().'resend-active-mail?mail='.$uid.'">Resend Activation Email!</a>');
                            redirect(base_url() . 'login');
                        }
                        } 
                    }
         }else{
            $this->session->set_flashdata('msg', '<div class="alert alert-danger" role="alert">Passwords do not match</div>');
            redirect(base_url() . 'register');}
      }else{
        $this->session->set_flashdata('msg', '<div class="alert alert-danger" role="alert">Please Enter Your Details.</div>');
        redirect(base_url() . 'register');}
    }
   }




// login 
   public function signin(){ 
    if (!empty($this->input->post('submit'))){
        $uid = $this->input->post('uid');
        $pwd = $this->input->post('pass');
        $var = $this->User_model->check_username_pwd($uid, $pwd);
        if ($var == true){
            $this->session->set_userdata('userid', $uid);
            redirect(base_url().'user/profile'); 
        } else {
            $this->session->set_flashdata('err_msg', '<div class="alert alert-danger text-center" role="alert">Invalid UserId or Password</div>');
            redirect(base_url().'login'); 
        }
    }
}


//logout
public function signout(){
    $this->session->unset_userdata('userid'); 
    redirect(base_url());
}




//user profile
public function profile(){
    $this->check_login();
    $data['meta'] = $this->Meta_model->meta_details(uri_string()); 
    $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
    $data['cat_list'] = $this->Category_model->cat_list(); 
    $data['subcat_list'] = $this->SubCategory_model->subcat_list();
    $data['res'] = $this->User_model->get_userdata($this->session->userid);
    // print_r($data['res']);die;
    $this->load->view('includes/header', $data); 
    $this->load->view('user/user_profile_view');
    $this->load->view('includes/footer');
}


//user edit-profile
public function edit_prof(){
    $this->check_login();
    $data['meta'] = $this->Meta_model->meta_details(uri_string());  
    $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
    $data['cat_list'] = $this->Category_model->cat_list(); 
    $data['subcat_list'] = $this->SubCategory_model->subcat_list();
    $data['res'] = $this->User_model->get_userdata($this->session->userid); 
    $this->load->view('includes/header', $data); 
    $this->load->view('user/user_edit_profile_view');
    $this->load->view('includes/footer');
}

//user update profile
public function update_prof(){
    $this->check_login();
    if (!empty($_POST['submit'])){ 
        extract($this->input->post());
        $data = array(
            'user_name' => $username,
            'user_fav_topic' => $favtopic, 
            'user_location' => $userlocation, 
            'user_about' => $aboutuser, 
            'updated_date' => date('Y-m-d H:i:s')
        );
        $res = $this->User_model->update_prof($data, $this->session->userid);
        if ($res == true) {
            $this->session->set_flashdata('msg', '<div class="alert alert-success text-center" role="alert">Successfully Update Your Profile.</div>');
            redirect(base_url() . 'user/profile');
        }
    }
}


//user update Profile passowrd
public function update_pass(){
    $this->check_login();
    if (!empty($_POST['submit'])){ 
        extract($this->input->post());
        if((!empty($opass) ) && (!empty($pass)) && (!empty($cpass))){
            $var =$this->User_model->check_username_pwd($this->session->userid,$opass);
            if ($var == true){
                if($pass===$cpass){
                    $data = array(
                        'user_pass' => md5($pass), 
                        'updated_date' => date('Y-m-d H:i:s')
                    );
                    $res = $this->User_model->update_prof($data, $this->session->userid);
                    if ($res == true) {
                        $this->session->set_flashdata('msg', '<div class="alert alert-success text-center" role="alert">Successfully Update Your Password.</div>');
                        redirect(base_url() . 'user/profile');
                    }
                }else {
                    $this->session->set_flashdata('msg', '<div class="alert alert-danger text-center" role="alert">Password Do not match.</div>');
                    redirect(base_url().'user/reset-password'); 
                }
            }else {
                $this->session->set_flashdata('msg', '<div class="alert alert-danger text-center" role="alert">Please Enter Correct Password.</div>');
                redirect(base_url().'user/reset-password'); 
            }
        }
    }
}



//user update profile image 
public function update_prof_img(){
    $this->check_login();
    if (!empty($_POST['submit'])){
        if(!empty($_FILES['prof-pic']['name'])){ 
            $config['upload_path']   = 'uploads/user';
            $config['allowed_types'] = 'jpg|png|jpeg';
            $config['max_size'] = 2000;
            $config['max_width'] = 1500;
            $config['max_height'] = 1500;
            $new_name=time().'.jpg';
			$config['file_name']=$new_name; 

            $this->upload->initialize($config);
            if (!$this->upload->do_upload('prof-pic')){
            }else{$prof_pic = $new_name;}
        }else{$prof_pic='post.png';} 
        
        $data = array(
            'user_profile_pic' => $prof_pic,
            'updated_date' => date('Y-m-d H:i:s')
        );
        $res = $this->User_model->update_prof($data,$this->session->userid);
        if (!empty($res)) {
            $this->session->set_flashdata('msg', '<div class="alert alert-success text-center" role="alert">Successfully Update Your Profile Picture.</div>');
            redirect(base_url() . 'user/profile');
        }
    }
}


//user upload-profile
public function upload_prof_img(){
    $this->check_login();
    $data['meta'] = $this->Meta_model->meta_details(uri_string());  
    $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
    $data['cat_list'] = $this->Category_model->cat_list(); 
    $data['subcat_list'] = $this->SubCategory_model->subcat_list();
    $data['res'] = $this->User_model->get_userdata($this->session->userid); 
    $this->load->view('includes/header', $data); 
    $this->load->view('user/user_upload_prof_pic_view');
    $this->load->view('includes/footer');
}

//user reset password
public function reset_pass(){
    $this->check_login();
    $data['meta'] = $this->Meta_model->meta_details(uri_string());  
    $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
    $data['cat_list'] = $this->Category_model->cat_list(); 
    $data['subcat_list'] = $this->SubCategory_model->subcat_list();
    $data['res'] = $this->User_model->get_userdata($this->session->userid); 
    $this->load->view('includes/header', $data); 
    $this->load->view('user/user_reset_password_view');
    $this->load->view('includes/footer');
}



// New Subscriber 
public function new_subscriber(){
    if (!empty($_POST['submit'])){ 
        extract($this->input->post()); 
        if(empty($page)){$url='index';}else{$url=$page;}
        if(!isset($newsletter)){$status='false';}else{$status='true';}  
        $data = array(
            'subscriber_email' => $email,
            'subscribe_page' => $url,
            'status' => $status,
            'subscribe_date' => date('Y-m-d H:i:s')
        );
        $res = $this->User_model->new_subscriber($data);
        if ($res == true) {
            $this->session->set_flashdata('msg', '<div class="alert alert-success text-center" role="alert">Thank You For Subscribing Our Page.</div>');
            redirect(base_url().$page);
        }

    }else{
        redirect(base_url());
    }
}



// New Comment 
public function new_comment(){
       $this->check_login();
    if (!empty($_POST['submit'])){ 
        extract($this->input->post()); 
        $data = array(
            'commenter_name' => $name,
            'comment_userid' => $this->session->userid,
            'comment_page' => $page, 
            'comment_txt' => $message, 
            'added_date' => date('Y-m-d H:i:s')
        );
        $res = $this->User_model->new_comment($data);
        if ($res == true){
            $this->session->set_flashdata('comm_msg', '<div class="alert alert-success text-center" role="alert">Thank You For Adding Comment. Your Comment Will Aproved soon.</div>');
            redirect(base_url().$page);
        }

    }else{
        redirect(base_url());
    }
}


// verify email link 
public function verify_email_link($code){ 
           $user=$this->User_model->get_user_info(substr($code, 0, -10));
           if(!empty($user)){
            $data = array(
                'verify' =>'active', 
                'updated_date' => date('Y-m-d H:i:s')
            );
        $res = $this->User_model->update_prof($data,$user);
        if ($res == true){
            $this->session->set_flashdata('err_msg', '<div class="alert alert-success" role="alert">Verified Successfull Now You Can Login</div>');
            redirect(base_url() . 'login');
        }
    }else{
        $this->session->set_flashdata('err_msg', '<div class="alert alert-danger" role="alert">Please Click on Right Link</div>');
            redirect(base_url() . 'login');
    }
} 



// resend activation email
public function resend_active_code(){
    $uid = $this->input->get('mail');
    if (!empty($uid)){
        if($this->verification_mail($uid)==true){
        $this->session->set_flashdata('err_msg', '<div class="alert alert-success" role="alert">Please Verify Your Mail:  '. $uid.'</div>');
        $this->session->set_flashdata('resend_activ', '<span>Sent Activation Mail</span>');
        redirect(base_url() . 'login');
       }
    }
} 
    

// forget password 
public function forgot_password(){ 
    $uid = $this->input->post('uid');
    if(!empty($uid)){
        $res = $this->User_model->get_userdata($uid);
        $pwd = ucfirst(substr($uid, 0, 5)).'@'.rand('1000','9999');
        if($res==true){
            $data = array(
                'user_pass' =>md5($pwd), 
                'updated_date' => date('Y-m-d H:i:s')
            );
        $res = $this->User_model->update_prof($data,$uid);
        if (!empty($res)){
            if($this->forgot_password_mail($uid,$pwd)==true){
            $this->session->set_flashdata('err_msg', '<div class="alert alert-success" role="alert">Your Temporary Password Sent to:'. $uid.'</div>');
            $this->session->set_flashdata('resend_activ', '<span>Please Signin with Your Password</span>');
            redirect(base_url() . 'login');
           }
        }
        }
    }else{
        $data['meta'] = $this->Meta_model->meta_details(uri_string());
        $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
        $data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list();

        $this->load->view('includes/header', $data); 
        $this->load->view('forgot_pass_view');
        $this->load->view('includes/footer');
    }
}



 
      // send verification mail 
      public function verification_mail($uid){  
           $this->load->library('email');
           $to = $uid;
           $subject = 'Account validation(imperialpedia.com)';
           $from = 'support@imperialpedia.com';  
           $code=md5($uid).time();
           $this->User_model->verify_code(md5($uid),$uid);
           $message = '<p>Thank you for Signing up and subscribing with us. You are just one more step to Confirm your email. Please Confirm your email and use all the features of imperialpedia without any disturbance.
             <a href="'.base_url().'mail/verify-link/'.$code.'"> Click Here </a></p>';
           
            $config['protocol'] = 'SMTP';
            $config['smtp_host'] = 'ssl://smtp.gmail.com';
            $config['smtp_port'] = '465';
            $config['smtp_timeout'] = '60';
            $config['smtp_user'] = 'support@imperialpedia.com';
            $config['smtp_pass'] = 'PaPrDe@2022';
            $config['charset'] = 'utf-8';
            $config['newline'] = "\r\n";
            $config['mailtype'] = 'html';
            $config['validation'] = TRUE;

            $this->email->initialize($config);
            $this->email->set_mailtype("html");
            $this->email->from($from,'Imperialpedia');
            $this->email->to($to);
            $this->email->subject($subject);
            $this->email->message($message);
            if($this->email->send()){
               return true;
            }else{
              return false;
            }
        }



      // forgot password mail
      public function forgot_password_mail($uid,$pwd){  
           $this->load->library('email');
           $to = $uid;
           $subject = 'Forgot Password(imperialpedia.com)';
           $from = 'support@imperialpedia.com';   
           $message = '<p>Your Temporary password is <strong> '.$pwd.' </strong> </p>';
           
            $config['protocol'] = 'SMTP';
            $config['smtp_host'] = 'ssl://smtp.gmail.com';
            $config['smtp_port'] = '465';
            $config['smtp_timeout'] = '60';
            $config['smtp_user'] = 'support@imperialpedia.com';
            $config['smtp_pass'] = 'AIP@2022';
            $config['charset'] = 'utf-8';
            $config['newline'] = "\r\n";
            $config['mailtype'] = 'html';
            $config['validation'] = TRUE;

            $this->email->initialize($config);
            $this->email->set_mailtype("html");
            $this->email->from($from,'Imperialpedia');
            $this->email->to($to);
            $this->email->subject($subject);
            $this->email->message($message);
            if($this->email->send()){
               return true;
            }else{
              return false;
            }
        }


}