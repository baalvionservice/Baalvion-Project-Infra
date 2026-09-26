<?php
class Google_login_model extends CI_Model
{
 // Google-authenticated users share the same `register` table as regular
 // sign-up, keyed on `user_id` (the account email) — matching User_model's
 // convention (see User_model::check_register()).
 function Is_already_register($user_id)
 {
  $this->db->where('user_id', $user_id);
  $query = $this->db->get('register');
  return $query->num_rows() > 0;
 }

 function Update_user_data($data, $user_id)
 {
  $this->db->where('user_id', $user_id);
  $this->db->update('register', $data);
 }

 function Insert_user_data($data)
 {
  $this->db->insert('register', $data);
 }
}
?>