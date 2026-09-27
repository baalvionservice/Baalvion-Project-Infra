<style>.log-header{padding: 1rem 1rem;
    border-bottom: 1px solid #dee2e6;
    border-top-left-radius: calc(0.3rem - 1px);
    border-top-right-radius: calc(0.3rem - 1px);text-align: center;}
    
    .btn-google {
        color: #545454;
        background-color: #ffffff;
        box-shadow: 0 1px 2px 1px #ddd;
        font-size:16px
   }


.or-container {
    align-items: center;
    color: #ccc;
    display: flex;
    margin: 25px 0;
}

.line-separator {
    background-color: #ccc;
    flex-grow: 5;
    height: 1px;
}

.or-label {
    flex-grow: 1;
    margin: 0 15px;
    text-align: center;
}</style>

<!-- login model start  -->
<div class="modal-dialog">
   <div class="modal-content">
      <div class="log-header">
         <h1 class="modal-title h5">Login with imperialpedia</h1>  
      </div>
      <div class="modal-body">
         <?php echo form_open('signin'); ?>
            <div id="login">
               <div class="error"><?php if($this->session->err_msg){ echo $this->session->err_msg; $this->session->unset_userdata('err_msg'); }?></div>  
               <div class="form-group text-center my-3">
                     <a class="btn btn-lg btn-google btn-block text-uppercase btn-outline" href="<?php echo base_url('google-login')?>"><img src="https://img.icons8.com/color/20/000000/google-logo.png"> Google </a>  
                     <a class="btn btn-lg btn-google btn-block text-uppercase btn-outline" href="#"><img src="https://img.icons8.com/fluency/20/undefined/facebook-new.png"> Facebook </a>
                     <a class="btn btn-lg btn-google btn-block text-uppercase btn-outline" href="#"><img src="https://img.icons8.com/color/20/undefined/twitter--v1.png"> Twitter </a>
               </div>
               <div class="or-container"><div class="line-separator"></div> <div class="or-label">or</div><div class="line-separator"></div></div>
               <div class="form-group">
                  <!-- <label for="recipient-name" class="col-form-label">User Id:</label> -->
                  <input type="text" class="form-control mb-2" id="recipient-name" placeholder=" Enter your email" name="uid">
               </div>
               <div class="form-group">
                  <!-- <label for="message-text" class="col-form-label">Password:</label> -->
                  <input type="password" class="form-control mb-1" id="recipient-name" placeholder=" Password" name="pass">
                    <span class="d-block" style="text-align:right;"><a href="forgot-password" class="float-right forgot-pass" style="padding:8px;font-size: 14px;">Forgot password?</a></span>
               </div>
               <button type="submit" name="submit"  value="submit" class="btn btn-info">Login</button>
               <div class="d-inline text-success" style="float:right;"><?php if($this->session->resend_activ){ echo $this->session->resend_activ; $this->session->unset_userdata('resend_activ'); }?></div>
            </div>
         </form>
      </div>
      <div class="modal-footer">
         Don’t have an account ?<a href="<?php echo base_url().'register'?>" id="toggle-form">register</a>
      </div>
   </div>
</div> 