<!DOCTYPE html> 
<html> 
   <head> 
      <meta charset="utf-8"> 
      <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
      <meta name="robots" content="noindex,nofollow">
      <title>Admin dashboard</title> 
      <!-- Tell the browser to be responsive to screen width --> 
      <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport"> 
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/css/bootstrap.css"  type="text/css"> 
      <link rel="stylesheet" href="https://cdn.datatables.net/1.10.19/css/dataTables.bootstrap4.min.css" >  
      <link rel="stylesheet" href="<?php echo base_url()?>assets/css/admin/AdminLTE.min.css"> 
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/admin-lte/2.2.0/css/skins/_all-skins.min.css"/> 
      <!-- Google Font --> 
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic"> 
      <script src="https://cdn.ckeditor.com/4.16.1/standard/ckeditor.js"></script>    
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
                     <img src="https://i.pinimg.com/originals/72/cd/96/72cd969f8e21be3476277d12d44c791c.png" class="user-image" alt="User Image"> 
                     <span class="hidden-xs">Welcome Admin</span> 
                     <a href="<?php echo base_url(); ?>imp-admin/signout" class="btn btn-primary">Sign out</a> 
                     </a> 
                  </li> 
               </ul> 
            </div> 
         </nav> 
      </header>