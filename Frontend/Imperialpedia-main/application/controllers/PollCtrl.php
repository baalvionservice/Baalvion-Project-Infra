<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * PollCtrl — Live Community Poll Engine
 * Routes:
 *   GET  /poll/results/{slug}  — returns live vote counts as JSON (public)
 *   POST /poll/vote            — submits a vote, returns updated counts as JSON
 */
class PollCtrl extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');
        header('X-Content-Type-Options: nosniff');
    }

    // -----------------------------------------------------------------------
    // GET /poll/results/{slug}
    // Returns live vote counts + percentages for any poll widget
    // -----------------------------------------------------------------------
    public function results($slug = '') {
        header('Content-Type: application/json; charset=utf-8');
        if (empty($slug)) {
            echo json_encode(['status' => 'error', 'message' => 'No poll slug provided']);
            return;
        }

        $poll = $this->db->get_where('poll', ['poll_slug' => $slug, 'poll_status' => 'active'])->row_array();
        if (empty($poll)) {
            echo json_encode(['status' => 'error', 'message' => 'Poll not found']);
            return;
        }

        echo json_encode($this->_get_poll_data($poll, $this->_voter_ip()));
    }

    // -----------------------------------------------------------------------
    // POST /poll/vote
    // Body: { slug, option_id }
    // Returns updated vote data after recording the vote (one vote per IP per poll)
    // -----------------------------------------------------------------------
    public function vote() {
        header('Content-Type: application/json; charset=utf-8');

        if ($this->input->server('REQUEST_METHOD') !== 'POST') {
            echo json_encode(['status' => 'error', 'message' => 'POST required']);
            return;
        }

        $slug      = $this->input->post('slug', TRUE);
        $option_id = (int) $this->input->post('option_id', TRUE);
        $voter_ip  = $this->_voter_ip();

        if (empty($slug) || $option_id <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
            return;
        }

        $poll = $this->db->get_where('poll', ['poll_slug' => $slug, 'poll_status' => 'active'])->row_array();
        if (empty($poll)) {
            echo json_encode(['status' => 'error', 'message' => 'Poll not found or closed']);
            return;
        }

        // Verify option belongs to this poll
        $option = $this->db->get_where('poll_option', [
            'option_id' => $option_id,
            'poll_id'   => $poll['poll_id']
        ])->row_array();

        if (empty($option)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid option']);
            return;
        }

        // Check if already voted (unique constraint: poll_id + voter_ip)
        $existing = $this->db->get_where('poll_vote', [
            'poll_id'  => $poll['poll_id'],
            'voter_ip' => $voter_ip
        ])->row_array();

        if (!empty($existing)) {
            $data = $this->_get_poll_data($poll, $voter_ip);
            $data['status']  = 'already_voted';
            $data['message'] = 'You have already voted in this poll.';
            echo json_encode($data);
            return;
        }

        // Record vote
        $this->db->insert('poll_vote', [
            'option_id' => $option_id,
            'poll_id'   => $poll['poll_id'],
            'voter_ip'  => $voter_ip,
            'voted_at'  => date('Y-m-d H:i:s')
        ]);

        $data = $this->_get_poll_data($poll, $voter_ip);
        $data['status']        = 'voted';
        $data['voted_option']  = $option_id;
        $data['message']       = 'Thank you! Your vote has been counted.';
        echo json_encode($data);
    }

    // -----------------------------------------------------------------------
    // Private: build the full poll result payload
    // -----------------------------------------------------------------------
    private function _get_poll_data($poll, $voter_ip) {
        $options = $this->db
            ->select('o.option_id, o.option_text, o.option_emoji, o.display_order, COUNT(v.vote_id) AS votes')
            ->from('poll_option o')
            ->join('poll_vote v', 'v.option_id = o.option_id', 'left')
            ->where('o.poll_id', $poll['poll_id'])
            ->group_by('o.option_id')
            ->order_by('o.display_order', 'ASC')
            ->get()->result_array();

        $total = array_sum(array_column($options, 'votes'));

        foreach ($options as &$opt) {
            $opt['votes']   = (int) $opt['votes'];
            $opt['percent'] = $total > 0 ? round(($opt['votes'] / $total) * 100) : 0;
        }

        // Has this IP already voted?
        $voted = $this->db->get_where('poll_vote', [
            'poll_id'  => $poll['poll_id'],
            'voter_ip' => $voter_ip
        ])->row_array();

        $voted_option = !empty($voted) ? (int)$voted['option_id'] : null;

        return [
            'status'       => 'ok',
            'poll_id'      => $poll['poll_id'],
            'poll_slug'    => $poll['poll_slug'],
            'question'     => $poll['poll_question'],
            'total_votes'  => $total,
            'has_voted'    => !empty($voted),
            'voted_option' => $voted_option,
            'options'      => $options
        ];
    }

    // -----------------------------------------------------------------------
    // Private: get anonymised voter fingerprint (IP + UA hash)
    // -----------------------------------------------------------------------
    private function _voter_ip() {
        $ip = '';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        $ip = trim($ip) ?: '0.0.0.0';
        $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 80);
        return md5($ip . '|' . $ua);
    }

    // -----------------------------------------------------------------------
    // GET /tools/dp_proxy?phone=919876543210
    // Server-side proxy helper for downloading WhatsApp DP on live production server
    // -----------------------------------------------------------------------
    public function dp_proxy() {
        $phone = preg_replace('/[^0-9]/', '', $this->input->get('phone', TRUE));
        if (empty($phone)) {
            show_404();
            return;
        }

        $url = "https://unavatar.io/whatsapp/{$phone}?fallback=false";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);

        if ($httpCode == 200 && !empty($data) && strpos($contentType, 'image') !== false) {
            header("Content-Type: {$contentType}");
            header("Content-Disposition: attachment; filename=\"whatsapp-dp-{$phone}.jpg\"");
            header("Content-Length: " . strlen($data));
            echo $data;
            exit;
        } else {
            // Fallback avatar stream
            $fallbackUrl = "https://ui-avatars.com/api/?name={$phone}&background=075e54&color=ffffff&size=1080&bold=true";
            header("Location: {$fallbackUrl}");
            exit;
        }
    }
}
