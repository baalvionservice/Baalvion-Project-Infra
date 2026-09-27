<link rel="stylesheet" type="text/css" href="<?php echo base_url()?>assets/css/blog-det.css" />



<style>
    .sub-text {
    color: #fff;
    padding-top: 8vw;
    font-family: "Oswald",Sans-serif;
    font-weight: 400;
}

/* form  */
.apply_box{
    max-width: 600px;
    padding: 20px;
    background-color: white;
    margin: 0 auto;
    margin-top: 50px;
    box-shadow: 2px 3px 15px 1px black;
}
 .small{
    font-size: 17px;
}
.form_container{
    margin-top: 35px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
    gap: 15px;
}
.form_control{
    display: flex;
    flex-direction: column;

}
label{
    font-size: 18px;
    margin-bottom: 5px;
}
input,select,textarea{
    padding: 8px 10px;
    border: 1px solid grey;
    border-radius: 5px;
    font-size: 13px;
}
input:focus{
    outline-color: rgb(210, 21, 147);
}
.button_container{
    display: flex;
    justify-content: end;
    margin-top: 20px;
    padding: 5px;
}
button{
        background-color:rgb(211, 33, 33) ;
        border-radius: 7px;
        border: transparent solid 2px;
        padding: 5px 10px;
        color: whitesmoke;
        padding: 10px;
}
button:hover{
    background-color: rgb(15, 117, 225);
    color: rgb(15, 14, 14);
    cursor: pointer;
}
.textarea_control {
    grid-column: 1 / span 2 ;
    
}
.textarea_control textarea{
    width: 100%;
}


@media only screen and (max-width: 600px) {
   .form_container {
      display: block;
   }
}

</style>



<!-- heading section  -->
<section style="background-color: #000;height: 20vw;">
   <h1 class="text-center sub-text">Careers</h1>
</section>
<!-- body text sections  -->
<div class="container my-4 pivacy">
   <p>We're a small, growing team building Imperialpedia into a genuinely useful resource for finance, marketing, and SEO. If you're interested in writing, editing, or otherwise contributing, tell us a bit about yourself below and we'll get in touch if there's a fit.</p>
<div class="container">
        <div class="apply_box">
            <h2>Job application</h2>
            <?php echo form_open('submit-job-application', array('enctype' => 'multipart/form-data')); ?>
            <div class="error"><?php if($this->session->err_msg){ echo $this->session->err_msg; $this->session->unset_userdata('err_msg'); }?></div>  
                <div class="form_container">
                    <div class="form_control">
                        <label for="first name">First name*</label>
                        <input id="first name" name="fname" min="3" max="10" placeholder="Enter name" required>
                    </div>
                    <div class="form_control">
                        <label for="Last name">Last name*</label>
                        <input id="Last name" name="lname" min="3" max="10" placeholder="Last name" required>
                    </div>
                    <div class="form_control">
                        <label for="email  ">Email*</label>
                        <input type="email" name="email" id="email" min="3" max="20" placeholder="Enter email" required>
                    </div>
                    <div class="form_control">
                        <label for="job">Job Role*</label>
                        <select id="job" name="job_role">
                            <option value="">Select Job Role</option>
                            <option value="PHOTO EDITOR">PHOTO EDITOR</option>
                            <option value="VIDEO EDITOR">VIDEO EDITOR</option>
                            <option value="GRAPHICS DESIGNER">GRAPHICS DESIGNER</option>
                            <option value="WEBSITE CONTENT WRITER">WEBSITE CONTENT WRITER</option>
                            <option value="SEO EMPLOYEE">SEO EMPLOYEE</option>
                            <option value="SEO MARKETER">SEO MARKETER</option>
                            <option value="SOCIAL MEDIA MANAGER">SOCIAL MEDIA MANAGER</option>
                            <option value="MEMES CREATOR">MEMES CREATOR</option>
                            <option value="DIGITAL MARKETING EMPLOYEE">DIGITAL MARKETING EMPLOYEE </option>
                            <option value="PR & MARKETING">PR & MARKETING</option>
                        </select>
                    </div>
                    <div class="textarea_control">
                        <label for="address">Address</label>
                        <textarea id="address" name="address" row="4" cols="50" placeholder="Enter address"></textarea>
                    </div>
                    <div class="form_control">
                        <label for="city">City*</label>
                        <input name="city"  id="city" name="city" min="3" max="20" placeholder="Enter city name" required>
                    </div>
                    <div class="form_control">
                        <label for="pincode">Pincode*</label>
                        <input type="number" id=" pincode" name="pincode"  placeholder="Enter Pincode Number" required>
                    </div>
                    <div class="form_control">
                        <label for="date">Phone No*</label>
                        <input value="" type="number" name="phone" placeholder="Enter mobile no" required>
                    </div>
                    <div class="form_control">
                        <label for="Upload">Upload Your CV*</label>
                        <input type="file" id="upload" name="cv_upload" required>
                    </div>
                </div>
                <div class="button_container">
                    <button name="submit" type="submit">Apply now</button>
                </div>
            </form>
        </div>
    </div>
</div>