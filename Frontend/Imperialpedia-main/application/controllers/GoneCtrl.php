<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Answers for URLs that no longer exist (the retired Next.js site's pages and similar).
// 410 tells search engines the page is gone for good, which clears it from the index
// faster than a 404, and avoids the 500 a missing template used to produce.
class GoneCtrl extends CI_Controller{

    public function index(){
        $this->output->set_status_header(410);
        $this->output->set_header('X-Robots-Tag: noindex');
        $this->output->set_content_type('text/html', 'utf-8');
        $this->output->set_output('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page removed - Imperialpedia</title></head><body style="font-family:sans-serif;max-width:560px;margin:15vh auto;padding:0 20px"><h1>This page has been removed</h1><p>The page you are looking for no longer exists. <a href="' . htmlspecialchars(base_url()) . '">Go to the Imperialpedia homepage</a>.</p></body></html>');
    }
}
