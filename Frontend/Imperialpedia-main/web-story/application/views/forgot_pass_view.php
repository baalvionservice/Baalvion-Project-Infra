<style>.log-header{padding: 1rem 1rem;
    border-bottom: 1px solid #dee2e6;
    border-top-left-radius: calc(0.3rem - 1px);
    border-top-right-radius: calc(0.3rem - 1px);text-align: center;}</style>


<!-- login model start  -->
<div class="modal-dialog">
   <div class="modal-content">
      <div class="log-header">
         <h1 class="modal-title h5">Forgot Password</h1>  
      </div>
      <div class="modal-body">
         <form action="forgot-password" method="post">
            <div id="login">
               <div class="error"><?php if($this->session->err_msg){ echo $this->session->err_msg; $this->session->unset_userdata('err_msg'); }?></div>
               <div class="form-group">
                  <label for="recipient-name" class="col-form-label">Enter User Id:</label>
                  <input type="text" class="form-control" id="recipient-name" placeholder="Enter Your Email" name="uid"> <br>
               </div> 
               <button type="submit" name="submit"  value="submit" class="btn btn-info">Submit</button>
            </div>
         </form>
      </div> 
   </div>
</div> 