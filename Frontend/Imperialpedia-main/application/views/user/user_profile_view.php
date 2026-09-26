 <?php foreach($res as $reg_res){
       if(!empty($reg_res['user_profile_pic'])){$user_img=$reg_res['user_profile_pic'];}else{$user_img="user.png";} 
?>
 <style>.btn-bg-teal{background: #05e5b59c;}@-webkit-keyframes fadeInUp{0%{opacity:0;margin-top:.75rem}100%{opacity:1;margin-top:0}}@keyframes fadeInUp{0%{opacity:0;margin-top:.75rem}100%{opacity:1;margin-top:0}}.animated--fade-in-up{-webkit-animation-name:fadeInUp;animation-name:fadeInUp;-webkit-animation-duration:300ms;animation-duration:300ms;-webkit-animation-timing-function:margin cubic-bezier(0.18,1.25,0.4,1),opacity cubic-bezier(0,1,0.4,1);animation-timing-function:margin cubic-bezier(0.18,1.25,0.4,1),opacity cubic-bezier(0,1,0.4,1)}.animated--fade-in-up.dropdown-menu{margin-top:0;top:.125rem!important}.no-caret .dropdown-toggle::after{display:none}.text-gray-500{color:#a7aeb8!important}.text-gray-700{color:#4a515b!important}.card{box-shadow:0 .15rem 1.75rem 0 rgba(33,40,50,0.15)}.card .card-header{font-weight:500}.card:not([class*=bg-]) .card-header{color:#0061f2}.card-header-actions .card-header{height:3.5625rem;display:flex;align-items:center;justify-content:space-between;padding-top:.5625rem;padding-bottom:.5625rem}.card-header-actions .card-header .dropdown-menu{margin-top:0;top:.5625rem!important}.dropdown-menu{font-size:.9rem;border:0;box-shadow:0 .15rem 1.75rem 0 rgba(33,40,50,0.15)}.dropdown-menu .dropdown-header{font-size:.75rem;font-weight:700;display:flex;align-items:center}.dropdown-menu .dropdown-item{display:flex;align-items:center}.dropdown-menu .dropdown-item .dropdown-item-icon{margin-right:.5rem;line-height:1}.dropdown-menu .dropdown-item .dropdown-item-icon svg{height:.9em;width:.9em}.dropdown-menu .dropdown-item:active .dropdown-item-icon{color:#fff}.dropdown .dropdown-toggle{display:inline-flex;align-items:center}.feather{height:1rem;width:1rem;vertical-align:top}.timeline .timeline-item{display:flex;align-items:flex-start}.timeline .timeline-item .timeline-item-marker{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:2rem}.timeline .timeline-item .timeline-item-marker .timeline-item-marker-text{font-size:.875rem;width:6rem;color:#a7aeb8;text-align:center;margin-bottom:.5rem;display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.timeline .timeline-item .timeline-item-marker .timeline-item-marker-indicator{display:inline-flex;align-items:center;justify-content:center;height:3rem;width:3rem;background-color:#06917b;border-radius:100%}.timeline .timeline-item .timeline-item-content{padding-top:0;padding-bottom:2rem;padding-left:1rem;width:100%}.timeline .timeline-item:last-child .timeline-item-content{padding-bottom:0!important}@media(min-width:576px){.timeline .timeline-item .timeline-item-marker{flex-direction:row;transform:translateX(1.625rem);margin-bottom:0}.timeline .timeline-item .timeline-item-marker .timeline-item-marker-text{margin-right:.5rem;margin-bottom:0}.timeline .timeline-item .timeline-item-content{padding-top:.75rem;padding-bottom:3rem;padding-left:3rem;border-left:solid .25rem #f2f6fc}.timeline .timeline-item:last-child .timeline-item-content{border-left-color:transparent}}.timeline.timeline-xs .timeline-item .timeline-item-marker{transform:translateX(0.5625rem)}.timeline.timeline-xs .timeline-item .timeline-item-marker .timeline-item-marker-text{width:3rem;font-size:.7rem}.timeline.timeline-xs .timeline-item .timeline-item-marker .timeline-item-marker-indicator{height:.875rem;width:.875rem;font-size:.875rem;border:.125rem solid #fff;margin-top:-0.125rem}.timeline.timeline-xs .timeline-item .timeline-item-content{font-size:.875rem;padding-top:0;padding-bottom:1rem;padding-left:1.5rem}.user-img{height:150px;width:150px;border-radius:50%;}.form-control:focus{background-color: none;border-color:#ced4da !important;box-shadow: none;}</style>
<div class="container-xl px-4 mt-4">
   <div class="row">
      <div class="col-xxl-4 col-xl-12 mb-4">
         <div class="card h-100">
            <div class="card-body h-100 p-5">
               <div class="row align-items-center">
                  <div class="col-xl-8 col-xxl-12">
                     <div class="text-center text-xl-start text-xxl-center mb-4 mb-xl-0 mb-xxl-4">
                        <h1 class="text-primary">Hello, <?php echo ucfirst($reg_res['user_name']); ?></h1>
                        <p class="text-gray-700 mb-0">Welcome to Imperialpedia, your Personal Details  is safe with imperialpedia , we collect thes information for give better experience to user.</p>
                     </div>
                  </div>
                  <div class="col-xl-4 col-xxl-12 text-center">
                  <img class="img-fluid user-img" src="<?php echo base_url().'uploads/user/'.$user_img;?>">      
                </div>
               </div>
            </div>
         </div>
      </div>
      <div class="col-xxl-4 col-xl-6 mb-4">
         <div class="card card-header-actions h-100">
            <div class="card-header">
               Now You Allow For 
            </div>
            <div class="card-body">
               <div class="timeline timeline-xs">
                  <!-- Timeline Item 1-->
                  <div class="timeline-item">
                     <div class="timeline-item-marker">
                        <div class="timeline-item-marker-text"><i class="fa-solid fa-comment-dots"></i></div>
                        <div class="timeline-item-marker-indicator bg-green"></div>
                     </div>
                     <div class="timeline-item-content">
                        Now You are allow for
                        <a class="fw-bold text-dark" href="#!">Comments</a>
                        has been successfully placed.
                     </div>
                  </div>
                  <!-- Timeline Item 2-->
                  <div class="timeline-item">
                     <div class="timeline-item-marker">
                        <div class="timeline-item-marker-text"><i class="fa-solid fa-thumbs-up"></i></div>
                        <div class="timeline-item-marker-indicator bg-blue"></div>
                     </div>
                     <div class="timeline-item-content">
                        Your
                        <a class="fw-bold text-dark" href="#!">Likes</a>
                        has been generated and is ready to view.
                     </div>
                  </div>
                  <!-- Timeline Item 3-->
                  <div class="timeline-item">
                     <div class="timeline-item-marker">
                        <div class="timeline-item-marker-text"><i class="fa-solid fa-bookmark"></i></div>
                        <div class="timeline-item-marker-indicator bg-purple"></div>
                     </div>
                     <div class="timeline-item-content">
                        New user
                        <a class="fw-bold text-dark" href="#!">Subscribe</a>
                        has registered
                     </div>
                  </div> 
                  <!-- Timeline Item 5-->
                  <div class="timeline-item">
                     <div class="timeline-item-marker">
                        <div class="timeline-item-marker-text"><i class="fa-solid fa-address-card"></i></div>
                        <div class="timeline-item-marker-indicator bg-green"></div>
                     </div>
                     <div class="timeline-item-content">
                        New order placed!
                        <a class="fw-bold text-dark" href="#!"> Direct Contact</a>
                        has been successfully placed.
                     </div>
                  </div>
                  <!-- Timeline Item 6-->
                  <div class="timeline-item">
                     <div class="timeline-item-marker">
                        <div class="timeline-item-marker-text"><i class="fa-solid fa-comments"></i></div>
                        <div class="timeline-item-marker-indicator bg-purple"></div>
                     </div>
                     <div class="timeline-item-content">
                        Details for
                        <a class="fw-bold text-dark" href="#!">feedback</a>
                        have been updated.
                     </div>
                  </div>
                  <!-- Timeline Item 7-->
                  <div class="timeline-item">
                     <div class="timeline-item-marker">
                        <div class="timeline-item-marker-text"><i class="fa-solid fa-toggle-off"></i></div>
                        <div class="timeline-item-marker-indicator bg-green"></div>
                     </div>
                     <div class="timeline-item-content">
                        New order placed!
                        <a class="fw-bold text-dark" href="#!">Off Services</a>
                        has been successfully placed.
                     </div>
                  </div>
                  <!-- Timeline Item 7-->
                  <div class="timeline-item">
                     <div class="timeline-item-marker">
                        <div class="timeline-item-marker-text"><i class="fa-solid fa-user-check"></i></div>
                        <div class="timeline-item-marker-indicator bg-green"></div>
                     </div>
                     <div class="timeline-item-content">
                        New order placed!
                        <a class="fw-bold text-dark" href="#!">Update Your Account</a>
                        has been successfully placed.
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
      <div class="col-xxl-4 col-xl-6 mb-4">
         <div class="card card-header-actions h-100">
            <div class="card-header">
               Your Profile Details 
            </div>
            <div class="card-body"> 
                <form>     
                <div class="error"><?php if($this->session->msg){ echo $this->session->msg; $this->session->unset_userdata('msg'); }?></div>
                    <div class="mb-3">
                        <label class="small mb-1" for="inputUsername">Full Name </label>
                        <input class="form-control" id="inputUsername" type="text" value="<?php echo ucfirst($reg_res['user_name']); ?>" readonly>
                    </div>  
                    <div class="row gx-3 mb-3"> 
                        <div class="col-md-6">
                            <label class="small mb-1" for="inputFirstName">Favorate topic</label>
                            <input class="form-control" id="inputFirstName" type="text"  value="<?php echo ucfirst($reg_res['user_fav_topic']); ?>" readonly>
                        </div> 
                        <div class="col-md-6">
                            <label class="small mb-1" for="inputLastName">Location</label>
                            <input class="form-control" id="inputLastName" type="text" placeholder="india" value="<?php echo ucfirst($reg_res['user_location']); ?>" readonly>
                        </div>
                    </div>   
                    <div class="mb-3">
                        <label class="small mb-1" for="inputEmailAddress">Email address</label>
                        <input class="form-control" id="inputEmailAddress" type="email" value="<?php echo ucfirst($reg_res['user_id']); ?>" readonly>
                    </div> 
                    <div class="mb-3">
                        <label class="small mb-1" for="inputText">About profile</label>
                        <textarea class="form-control" id="inputText" type="text" readonly><?php echo ucfirst($reg_res['user_about']); ?></textarea>
                    </div>  
                    <div class="text-center mt-2 mb-3">
                        <a href="edit-profile" class="btn btn-bg-teal" type="button">Edit Profile</a>
                        <a href="upload-profile-image" class="btn btn-bg-teal mx-3" type="button">Upload profile pic</a>
                        <a href="reset-password" class="btn btn-bg-teal" type="button">Reset Password</a>
                    </div>
                </form>         
            </div>
         </div>
      </div>
   </div>
</div>

<?php } ?> 