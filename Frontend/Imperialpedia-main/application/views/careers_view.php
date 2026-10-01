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
   <p>Imperialpedia is a small publication, and the people who work on it write, edit, design and promote the guides you read. We are always interested in hearing from people who are good at one of those things.</p>
   <p>The roles in the form below are the kinds of work we do on the site. They are not a promise that a position is open today. We read every application, keep the ones that fit what we are building, and get in touch when there is a match. We cannot reply to everyone.</p>
   <p>A strong application is short and specific: tell us what you have made, link to examples if you have them, and attach your CV as a PDF. If you would rather write to us first, email <a href="mailto:advimperialpedia@gmail.com">advimperialpedia@gmail.com</a>. Details you send are used only to consider your application, as explained in our <a href="<?php echo base_url()?>privacy-policy">Privacy Policy</a>.</p>
<div class="container">
        <div class="apply_box">
            <h2>Job application</h2>
            <?php echo form_open('submit-job-application', array('enctype' => 'multipart/form-data')); ?>
            <div class="error"><?php if($this->session->err_msg){ echo $this->session->err_msg; $this->session->unset_userdata('err_msg'); }?></div>  
                <div class="form_container">
                    <div class="form_control">
                        <label for="fname">First name*</label>
                        <input id="fname" name="fname" min="3" max="10" placeholder="Enter name" required>
                    </div>
                    <div class="form_control">
                        <label for="lname">Last name*</label>
                        <input id="lname" name="lname" min="3" max="10" placeholder="Last name" required>
                    </div>
                    <div class="form_control">
                        <label for="email">Email*</label>
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
                        <input name="city" id="city" min="3" max="20" placeholder="Enter city name" required>
                    </div>
                    <div class="form_control">
                        <label for="pincode">Pincode*</label>
                        <input type="number" id="pincode" name="pincode"  placeholder="Enter Pincode Number" required>
                    </div>
                    <div class="form_control">
                        <label for="phone">Phone No*</label>
                        <input value="" type="number" id="phone" name="phone" placeholder="Enter mobile no" required>
                    </div>
                    <div class="form_control">
                        <label for="upload">Upload your CV (PDF, up to 2 MB)*</label>
                        <input type="file" id="upload" name="cv_upload" accept="application/pdf" required>
                    </div>
                </div>
                <div class="button_container">
                    <button name="submit" type="submit">Apply now</button>
                </div>
            </form>
        </div>
    </div>
</div>