<!DOCTYPE html> 
<html> 
   <head> 
      <meta charset="utf-8"> 
      <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
      <meta name="robots" content="noindex,nofollow">
      <title>Admin dashboard</title> 
      <!-- Tell the browser to be responsive to screen width --> 
      <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport"> 
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.2/css/bootstrap.min.css"  type="text/css">
      <link rel="stylesheet" href="https://cdn.datatables.net/1.13.11/css/dataTables.bootstrap4.min.css" >
      <link rel="stylesheet" href="<?php echo base_url()?>assets/css/admin/AdminLTE.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/admin-lte/2.4.18/css/skins/_all-skins.min.css"/>
      <!-- Google Font -->
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
      <!-- 4.25.2-lts requires a paid commercial license and refuses to initialize
           without one (silently leaves a plain textarea, no toolbar). 4.22.1 is the
           last free, open-source CKEditor 4 release before the LTS paywall. -->
      <script src="https://cdn.ckeditor.com/4.22.1/standard/ckeditor.js"></script>
      <script>CKEDITOR.config.versionCheck = false; /* hides the "upgrade to 4.25.2-lts" banner; the upgrade itself needs a paid licence */
      CKEDITOR.config.filebrowserUploadUrl = '<?php echo base_url(); ?>imp-admin/editor_upload?<?php echo $this->security->get_csrf_token_name(); ?>=<?php echo $this->security->get_csrf_hash(); ?>';
      CKEDITOR.config.filebrowserUploadMethod = 'form';
      CKEDITOR.config.allowedContent = true;
      </script>
      <link rel="stylesheet" href="<?php echo base_url()?>assets/css/admin/refresh.css">
      <style type="text/css">
         #example_length{
         padding-left:1%;
         }#example_info{padding-left:1%;}
      </style>
   </head>
   <body class="hold-transition skin-blue sidebar-mini"> 
      <div class="wrapper"> 
      <header class="main-header"> 
         <!-- Logo --> 
         <a href="<?php echo base_url();?>imp-admin/dashboard" class="logo"> 
            <!-- mini logo for sidebar mini 50x50 pixels --> 
            <span class="logo-mini"><b>VIP</b></span> 
            <!-- logo for regular state and mobile devices --> 
            <span class="logo-lg"><b>Imperialpedia</b></span> 
         </a> 
         <!-- Header Navbar: style can be found in header.less --> 
         <nav class="navbar navbar-static-top"> 
            <!-- Sidebar toggle button--> 
            <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button"> 
               <span class="sr-only">Toggle navigation</span> 
            </a> 
            <!-- Navbar Right Menu --> 
            <div class="navbar-custom-menu"> 
               <ul class="nav navbar-nav"> 
                  <li class="dropdown user user-menu"> 
                     <a href="#" class="dropdown-toggle" data-toggle="dropdown"> 
                     <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d2d6de'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8'/%3E%3C/svg%3E" class="user-image" alt="User Image">
                     <span class="hidden-xs">Welcome Admin</span> 
                     <a href="<?php echo base_url(); ?>imp-admin/signout" class="btn btn-primary">Sign out</a> 
                     </a> 
                  </li> 
               </ul> 
            </div> 
         </nav> 
      </header>