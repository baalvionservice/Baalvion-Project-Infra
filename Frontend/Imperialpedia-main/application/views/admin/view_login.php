<!DOCTYPE html>
<html>
   <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="robots" content="noindex,nofollow">
      <title>Imperialpedia Admin Login</title>
      <!-- Tell the browser to be responsive to screen width -->
      <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
      <!-- Bootstrap 3.3.7 -->
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
      <!-- Theme style -->
      <link rel="stylesheet" href="<?php echo base_url()?>assets/css/admin/AdminLTE.min.css">
      <!-- Google Font -->
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
      <style type="text/css">.center{display:flex;justify-content:center}#err_msgs{color:red}</style>
   </head>
   <body class="hold-transition login-page">
      <div class="login-box">
         <div class="login-logo">
            <a href="#"><b>Admin Login</b></a>
         </div>
         <!-- /.login-logo -->
         <div class="login-box-body">
            <p id="err_msgs"><?php echo $this->session->flashdata('err_msg'); ?></p>
            <?php echo form_open('imp-admin/login_admin'); ?>
               <div class="form-group has-feedback">
                  <input type="text" class="form-control" placeholder="Username" name="uname">
               </div>
               <div class="form-group has-feedback">
                  <input type="password" class="form-control" placeholder="Password" name="pwd">
               </div>
               <div class="row center">
                  <div class="col-xs-4">
                     <button type="submit" class="btn btn-primary btn-block btn-flat" name="submit" value="sign_in">Sign In</button>
                  </div>
               </div>
            </form>
         </div>
      </div>
      <!-- jQuery 3 -->
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
      <!-- Bootstrap 3.3.7 -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.min.js" crossorigin="anonymous"></script>
      <script>
         setTimeout(function(){ $('#err_msgs').fadeOut();},8000);
      </script>
   </body>
</html>