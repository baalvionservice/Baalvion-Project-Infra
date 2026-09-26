<style>.log-header{padding: 1rem 1rem;
    border-bottom: 1px solid #dee2e6;
    border-top-left-radius: calc(0.3rem - 1px);
    border-top-right-radius: calc(0.3rem - 1px);text-align: center;}</style>


<!-- login model start  -->
<div class="modal-dialog">
<div class="modal-content">
      <div class="log-header">
         <h1 class="modal-title h5">Register With Imperial</h1>  
      </div>
    <div class="modal-body"> 
            <?php echo form_open('signup'); ?>
            <div class="error"><?php  if($this->session->msg){ echo $this->session->msg; $this->session->unset_userdata('msg'); }?></div>
            <div class="form-group">
                <label for="recipient-name" class="col-form-label">Full Name:</label>
                <input type="text" class="form-control" id="recipient-name" placeholder="Enter Your Full Name" name="uname" required>
            </div>
            <div class="form-group">
                <label for="recipient-name" class="col-form-label">User Id:</label>
                <input type="email" class="form-control" id="recipient-name" placeholder="Enter Your Email" name="uid" required>
            </div>
            <div class="form-group">
                <label for="message-text" class="col-form-label">Password:</label>
                <input type="password" class="form-control" id="recipient-name" placeholder="********" name="pass" required>
            </div>
            <div class="form-group">
                <label for="message-text" class="col-form-label">Conform-Password:</label>
                <input type="password" class="form-control" id="recipient-name" placeholder="********" name="cpass" required>
            </div><br>
            <button type="submit" name="submit"  value="submit" class="btn btn-info">Register</button>  
        </form>
    </div>
    <div class="modal-footer">
    Already registered ?<a href="login" id="toggle-form">Login</a>
    </div>

</div>
</div>
<!-- login model end  -->