<?php
defined('BASEPATH') or exit('No direct script access allowed');

class SearchCtrl extends CI_Controller {

    public function __construct(){
        parent::__construct();
        $this->load->model('Category_model');
        $this->load->model('SubCategory_model');
        $this->load->model('Meta_model');
        $this->load->model('Post_model');
        $this->load->model('Quots_model');
        $this->load->library('session');
    }

    public function index(){
        $q = trim($this->input->get('q', TRUE));
        if (empty($q)) {
            $q = trim($this->input->post('q', TRUE));
        }

        $data['query'] = $q;
        $data['meta'] = array(
            'meta_title' => !empty($q) ? 'Search results for "' . htmlspecialchars($q) . '" | Imperialpedia' : 'Search Articles & Archives | Imperialpedia',
            'meta_desc'  => 'Search Imperialpedia\'s complete database of SEO, insurance, marketing, editor, and tech guides.'
        );
        $data['quots'] = $this->Quots_model->page_wise_quots(uri_string());
        $data['cat_list'] = $this->Category_model->cat_list();
        $data['subcat_list'] = $this->SubCategory_model->subcat_list();

        if (!empty($q)) {
            $this->db->select('p.*, c.cat_name, s.sub_cat_name');
            $this->db->from('post p');
            $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');
            $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');
            $this->db->where('p.status', 'published');
            $this->db->group_start();
            $this->db->like('p.post_title', $q);
            $this->db->or_like('p.post_desc', $q);
            $this->db->or_like('s.sub_cat_name', $q);
            $this->db->or_like('c.cat_name', $q);
            $this->db->group_end();
            $this->db->order_by('p.posted_date', 'DESC');
            $this->db->limit(30);
            $query = $this->db->get();
            $data['results'] = $query->result_array();
        } else {
            $data['results'] = array();
        }

        $this->load->view('includes/header', $data);
        $this->load->view('search_view', $data);
        $this->load->view('includes/footer');
    }

    public function api(){
        $q = trim($this->input->get('q', TRUE));
        if (empty($q) || strlen($q) < 2) {
            echo json_encode(array('status' => 'ok', 'results' => array()));
            return;
        }

        $this->db->select('p.post_id, p.post_title, p.uri, p.post_img, c.cat_name, s.sub_cat_name');
        $this->db->from('post p');
        $this->db->join('category c', 'c.cat_id=p.cat_id', 'left');
        $this->db->join('sub_category s', 's.sub_cat_id=p.sub_cat_id', 'left');
        $this->db->where('p.status', 'published');
        $this->db->group_start();
        $this->db->like('p.post_title', $q);
        $this->db->or_like('s.sub_cat_name', $q);
        $this->db->group_end();
        $this->db->order_by('p.posted_date', 'DESC');
        $this->db->limit(8);
        $query = $this->db->get();
        $items = $query->result_array();

        $output = array();
        foreach ($items as $item) {
            $cat = !empty($item['cat_name']) ? str_replace(' ', '-', $item['cat_name']) : 'seo';
            $subcat = !empty($item['sub_cat_name']) ? str_replace(' ', '-', $item['sub_cat_name']) : 'web-seo';
            $url = base_url() . strtolower($cat) . '/' . strtolower($subcat) . '/' . str_replace(' ', '-', $item['uri']);
            
            $img = !empty($item['post_img']) ? $item['post_img'] : 'post.png';
            $img_url = (strpos($img, 'http') === 0) ? $img : base_url() . 'uploads/post/' . $img;

            $output[] = array(
                'title'   => $item['post_title'],
                'subcat'  => strtoupper($item['sub_cat_name']),
                'url'     => $url,
                'img'     => $img_url
            );
        }

        header('Content-Type: application/json');
        echo json_encode(array('status' => 'ok', 'results' => $output));
    }
}
