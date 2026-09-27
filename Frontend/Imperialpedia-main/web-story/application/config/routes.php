<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['default_controller'] = 'HomeCtrl'; 
$route['seo'] = 'SeoCtrl';
$route['privacy-policy'] = 'PrivacyCtrl';
$route['terms/(:any)'] = 'TermsCtrl/load/$1';
$route['term/(:any)/(:any)'] = 'TermCtrl/term/$1/$2';

// footer 
$route['about'] = 'AboutCtrl';
$route['contact'] = 'ContactCtrl';
$route['advertise'] = 'AdvertiseCtrl';
$route['disclaimer'] = 'DisclaimerCtrl';
$route['author'] = 'AuthorCtrl';
$route['editorial-policy'] = 'EditorialCtrl';
$route['terms-use'] = 'TermsofuseCtrl';
$route['careers'] = 'CareersCtrl';

// user 
$route['subscribe'] = 'UserCtrl/new_subscriber';
$route['comment'] = 'UserCtrl/new_comment';
$route['login'] = 'UserCtrl/login_view';
$route['register'] = 'UserCtrl/register_view';
$route['signup'] = 'UserCtrl/signup';
$route['signin'] = 'UserCtrl/signin';
$route['logout'] = 'UserCtrl/signout';
$route['user/edit-profile'] = 'UserCtrl/edit_prof';
$route['user/upload-profile-image'] = 'UserCtrl/upload_prof_img';
$route['user/reset-password'] = 'UserCtrl/reset_pass';
$route['user/update-profile'] = 'UserCtrl/update_prof';
$route['user/update-password'] = 'UserCtrl/update_pass';
$route['user/update-profile-image'] = 'UserCtrl/update_prof_img';
$route['user/(:any)'] = 'UserCtrl/$1';
$route['mail/verify-link/(:any)'] = 'UserCtrl/verify_email_link/$1';
$route['resend-active-mail'] = 'UserCtrl/resend_active_code';
$route['forgot-password'] = 'UserCtrl/forgot_password';
// googlelogin 
$route['google-login'] = 'Google_loginCtrl/login';


//Admin use
$route['imp-admin'] = 'AdminCtrl';
$route['imp-admin/(:any)'] = 'AdminCtrl/$1';
$route['imp-admin/sub-cat/(:any)'] = 'AdminCtrl/catss/$1'; 
$route['imp-admin/(:any)/(:any)'] = 'AdminCtrl/$1/$2'; 
// echo $this->uri->segment(1);exit;
// if($this->uri->segment(1) != 'web-story'){
$route['(:any)/(:any)/(:any)'] = 'PostsCtrl/post';
$route['(:any)/(:any)'] = 'PostsCtrl/posts';
// }

$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;
