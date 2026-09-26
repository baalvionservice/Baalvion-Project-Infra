<?php
defined('BASEPATH') or exit('No direct script access allowed');

$route['default_controller'] = 'HomeCtrl';
$route['search'] = 'SearchCtrl';
$route['sitemap.xml'] = 'SitemapCtrl';
$route['privacy-policy'] = 'PrivacyCtrl';
$route['terms/(:any)'] = 'TermsCtrl/load/$1';
$route['term/(:any)/(:any)'] = 'TermCtrl/term/$1/$2';

// footer 
$route['about'] = 'AboutCtrl';
$route['contact'] = 'ContactCtrl';
$route['advertise'] = 'AdvertiseCtrl';
$route['disclaimer'] = 'DisclaimerCtrl';
$route['author'] = 'AuthorCtrl';
$route['author/(:any)'] = 'AuthorCtrl/profile/$1';
$route['editorial-policy'] = 'EditorialCtrl';
$route['terms-use'] = 'TermsofuseCtrl';
$route['careers'] = 'CareersCtrl';
$route['submit-job-application'] = 'CareersCtrl/add_application';

// user 
$route['subscribe'] = 'UserCtrl/new_subscriber';
$route['comment'] = 'UserCtrl/new_comment';
$route['robots\.txt'] = 'SitemapCtrl/robots';
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
// CLI-only tools (e.g. cli/importposts) — must be routed explicitly and
// excluded from the PostsCtrl wildcard below, or a 2-segment CLI URI like
// "cli importposts" would otherwise be swallowed by PostsCtrl/posts.
// Matched as a raw regex so a filesystem path argument (which contains
// slashes CI would otherwise split into extra URI segments/method args)
// can't break routing — the target always calls index(), which reads the
// real arguments straight from $_SERVER['argv'] instead of CI's segments.
$route['cli/importposts(.*)'] = 'cli/ImportPosts';
$route['SearchCtrl/(:any)'] = 'SearchCtrl/$1';
$route['comment'] = 'UserCtrl/new_comment';

// Live Poll API routes & Tool helpers
$route['poll/vote'] = 'PollCtrl/vote';
$route['poll/results/(:any)'] = 'PollCtrl/results/$1';
$route['tools/dp_proxy'] = 'PollCtrl/dp_proxy';

// echo $this->uri->segment(1);exit;
if($this->uri->segment(1) != 'imp-admin' && $this->uri->segment(1) != 'web-story' && $this->uri->segment(1) != 'cli' && $this->uri->segment(1) != 'search' && $this->uri->segment(1) != 'SearchCtrl' && $this->uri->segment(1) != 'comment' && $this->uri->segment(1) != 'poll' && $this->uri->segment(1) != 'tools'){
$route['(:any)/(:any)/(:any)'] = 'PostsCtrl/post';
$route['(:any)/(:any)'] = 'PostsCtrl/posts';
}


$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;
