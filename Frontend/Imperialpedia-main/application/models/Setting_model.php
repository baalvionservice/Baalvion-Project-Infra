<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Small key/value store for switches the admin panel controls.
class Setting_model extends CI_Model{

	public function __construct(){
		parent::__construct();
		$this->load->database();
		$this->db->query('CREATE TABLE IF NOT EXISTS `site_setting` (
			`setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
			`setting_value` VARCHAR(255) NOT NULL DEFAULT "",
			`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
	}

	public function get($key, $default = ''){
		$row = $this->db->get_where('site_setting', array('setting_key' => $key))->row_array();
		return $row ? $row['setting_value'] : $default;
	}

	public function set($key, $value){
		$this->db->query(
			'INSERT INTO site_setting (setting_key, setting_value) VALUES (?, ?)
			 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
			array($key, (string) $value)
		);
	}

	// The /cookies section stays hidden from visitors and search engines until an admin switches it on.
	public function cookies_section_enabled(){
		return $this->get('cookies_section_enabled', '0') === '1';
	}
}
