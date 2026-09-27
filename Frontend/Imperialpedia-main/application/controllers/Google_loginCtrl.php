<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Google_loginCtrl extends CI_Controller{

 public function __construct()
 {
  parent::__construct();
  $this->load->model('Google_login_model');
 }

 function login(){
  include_once APPPATH . "libraries/vendor/autoload.php";

  $google_client = new Google_Client();
  $google_client->setClientId(getenv('GOOGLE_CLIENT_ID'));
  $google_client->setClientSecret(getenv('GOOGLE_CLIENT_SECRET'));
  $google_client->setRedirectUri(getenv('GOOGLE_REDIRECT_URI') ? getenv('GOOGLE_REDIRECT_URI') : base_url('google-login'));
  $google_client->addScope('email');
  $google_client->addScope('profile');

  if(isset($_GET["code"])){
   $token = $google_client->fetchAccessTokenWithAuthCode($_GET["code"]);
   if(isset($token["error"])){
    $this->session->set_flashdata('err_msg', '<div class="alert alert-danger text-center" role="alert">Google sign-in failed. Please try again.</div>');
    redirect(base_url().'login');
   }
   if(!isset($token["error"])){
    $google_client->setAccessToken($token['access_token']);
    $this->session->set_userdata('access_token', $token['access_token']);
    $google_service = new Google_Service_Oauth2($google_client);
    $data = $google_service->userinfo->get();
    $current_datetime = date('Y-m-d H:i:s');


    if($this->Google_login_model->Is_already_register($data['email'])){
     $user_data = array(
        'user_name' => $data['given_name'].' '.$data['family_name'],
        'user_id' =>$data['email'],
        'user_profile_pic' => $data['picture'],
        'updated_date' => $current_datetime
    );
     $this->Google_login_model->Update_user_data($user_data, $data['email']);
    }else{
     $user_data = array(
        'user_name' => $data['given_name'].' '.$data['family_name'],
        'user_id' =>$data['email'],
        'user_pass' => 'google login',
        'user_fav_topic' => '',
        'user_location' => '',
        'user_about' => '',
        'user_profile_pic' => $data['picture'],
        'added_date' => date('Y-m-d H:i:s')
    );

     $this->Google_login_model->Insert_user_data($user_data);
    }
    $this->session->set_userdata('user_data', $user_data);
    $this->session->set_userdata('userid', $user_data['user_id']);
    redirect(base_url().'user/profile');
   }
  } else {
   redirect($google_client->createAuthUrl());
  }
 }

//  function logout()
//  {
//   $this->session->unset_userdata('access_token');

//   $this->session->unset_userdata('user_data');

//   redirect('google_login/login');
//  }
 
}
?>