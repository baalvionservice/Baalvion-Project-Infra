<?php

defined('BASEPATH') or exit('No direct script access allowed');



class CareersCtrl extends CI_Controller{ 

	public function __construct(){ 
		parent::__construct(); 
		$this->load->model('Career_model'); 
		$this->load->model('Category_model'); 
		$this->load->model('SubCategory_model'); 
		$this->load->model('Meta_model');  
		$this->load->model('Quots_model'); 
		$this->load->library('session');
	}

	public function index(){ 
		$data['meta'] = $this->Meta_model->meta_details(uri_string());
        $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
		$data['cat_list'] = $this->Category_model->cat_list(); 
        $data['subcat_list'] = $this->SubCategory_model->subcat_list();
		$this->load->view('includes/header' , $data); 
		$this->load->view('careers_view'); 
		$this->load->view('includes/footer'); 
	}


	public function add_application(){ 
		if (empty($this->input->post('submit'))){
			$data['fname'] = $this->input->post('fname');
			$data['lname'] = $this->input->post('lname');
			$data['email'] = $this->input->post('email');
			$data['job_role'] = $this->input->post('job_role');
			$data['Address'] = $this->input->post('address');
			$data['city'] = $this->input->post('city');
			$data['pincode'] = $this->input->post('pincode');
			$data['phone'] = $this->input->post('phone');
			
			// file upload 
			$cv_name="";
			if(!empty($_FILES['cv_upload']['name'])){ 
				$config['upload_path']   = 'uploads/resume';
				$config['allowed_types'] = 'pdf';
				$config['max_size'] = 2000;
				$config['max_width'] = 1500;
				$config['max_height'] = 1500;
				$new_name=time().'.pdf';
				$config['file_name']=$new_name; 
	
				$this->upload->initialize($config);
				if (!$this->upload->do_upload('cv_upload')){
					// print_r($this->upload->display_errors());die;
					$this->session->set_flashdata('err_msg', '<div class="alert alert-danger text-center" role="alert">'.$this->upload->display_errors().'</div>');
				    redirect(base_url('careers')); 
				}else{$cv_name = $new_name;}
			}
			$data['resume'] = $cv_name;

			 
			$res = $this->Career_model->add_new_job_seeker($data); 
			if ($res){
				// send mail
				$this->load->library('email');
           $to = 'advimperialpedia@gmail.com';
           $subject = 'New JOB Seeker - Applied';
           $from = 'support@imperialpedia.com';   
           $message = "<p>".ucfirst($data['fname'])." is applied for job. Please check the cv - </p><br/>
		   <p>Name: ".$data['fname']." ".$data['lname']."</p>
		   <p>Email: ".$data['email']."</p>
		   <p>Job Role: ".$data['job_role']."</p>
		   <p>Phone: ".$data['phone']."</p>
		   <p>Address: ".$data['Address']."</p>
		   <p>City, PinCode: ".$data['city'].", ".$data['pincode']."</p>";
           
            $config['protocol'] = 'SMTP';
            $config['smtp_host'] = 'ssl://smtp.gmail.com';
            $config['smtp_port'] = '465';
            $config['smtp_timeout'] = '60';
            $config['smtp_user'] = 'support@imperialpedia.com';
            $config['smtp_pass'] = 'PaPrDe@2022';
            $config['charset'] = 'utf-8';
            $config['newline'] = "\r\n";
            $config['mailtype'] = 'html';
            $config['validation'] = TRUE;

            $this->email->initialize($config);
            $this->email->set_mailtype("html");
            $this->email->from($from,'Imperialpedia');
            $this->email->to($to);
			$list = array('papunmahakul1999@gmail.com');
            $this->email->cc($list);
            $this->email->subject($subject);
            $this->email->message($message);
			$this->email->attach(base_url('uploads/resume/').$cv_name);
            $this->email->send();

				// send response
				$this->session->set_flashdata('err_msg', '<div class="alert alert-success text-center" role="alert">Application Submit Successfully.</div>');
				redirect(base_url().'careers'); 
			} else {
				$this->session->set_flashdata('err_msg', '<div class="alert alert-danger text-center" role="alert">Something wrong !! please try after sometime</div>');
				redirect(base_url('careers')); 
			}
		}else{redirect(base_url('careers')); }
    }

}