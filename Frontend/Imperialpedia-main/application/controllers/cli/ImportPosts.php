<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Bulk article importer. CLI only — run from the container, e.g.:
 *
 *   docker exec imperial_web php index.php cli/importposts /path/to/posts.csv
 *   docker exec imperial_web php index.php cli/importposts /path/to/posts.json
 *   docker exec imperial_web php index.php cli/importposts /path/to/articles/   (folder of .html/.txt, one per article)
 *   docker exec imperial_web php index.php cli/importposts /path/to/one.html
 *
 * Run with no arguments for the full field reference.
 */
class ImportPosts extends CI_Controller {

	private $imported = 0;
	private $updated = 0;
	private $skipped = 0;

	public function __construct(){
		parent::__construct();
		if ( ! is_cli()){
			show_404();
		}
		$this->load->database();
		$this->load->model('Admin_model');
	}

	public function index(){
		// Read the real arguments from argv directly rather than CI's URI
		// segments — a filesystem path contains slashes, which CI's router
		// would otherwise fragment into extra (wrong) segments/method args.
		$args = $_SERVER['argv'];
		array_shift($args); // index.php
		array_shift($args); // cli/importposts
		$path = isset($args[0]) ? $args[0] : null;
		$format = isset($args[1]) ? $args[1] : null;

		if (empty($path)){
			$this->_usage();
			return;
		}
		if ( ! file_exists($path)){
			echo "Not found: {$path}" . PHP_EOL;
			return;
		}

		$format = $format ?: $this->_detect_format($path);
		switch ($format){
			case 'csv':
				$records = $this->_parse_csv($path);
				break;
			case 'json':
				$records = $this->_parse_json($path);
				break;
			case 'html':
				$records = $this->_parse_html($path);
				break;
			default:
				echo "Could not tell the format from that path. Pass it explicitly:" . PHP_EOL;
				echo "  php index.php cli/importposts {$path} csv" . PHP_EOL;
				return;
		}

		if (empty($records)){
			echo "No records found to import." . PHP_EOL;
			return;
		}

		echo "Found " . count($records) . " record(s). Importing..." . PHP_EOL . PHP_EOL;
		foreach ($records as $i => $record){
			$this->_import_record($record, $i + 1);
		}

		echo PHP_EOL . "Done. Imported: {$this->imported}, Updated: {$this->updated}, Skipped: {$this->skipped}." . PHP_EOL;
	}

	private function _usage(){
		$existing_cats = array();
		foreach ($this->Admin_model->cat_list() as $c){
			$existing_cats[] = $c['cat_name'];
		}
		echo <<<TXT
Usage:
  php index.php cli/importposts <path> [csv|json|html]

  The format is guessed from the path (.csv, .json, a directory, or a
  .html/.htm/.txt file) if you don't pass it explicitly.

Required fields per article: title, category, sub_category, content
Optional fields: url, image, image_alt, status (draft|published, default draft)

--- CSV ---
Header row with these column names (case-insensitive, spaces or
underscores both fine): title, url, category, sub_category, content,
image, image_alt, status. One article per row.

--- JSON ---
Either a single object, or an array of objects, using the same field
names as the CSV columns above.

--- HTML / TXT ---
Point at a single file or a directory of files (one article per file).
Each file may start with a simple front-matter block:

  ---
  title: My Article Title
  category: SEO
  sub_category: Web SEO
  image: my-image.jpg
  image_alt: some alt text
  status: draft
  ---
  <p>article body goes here...</p>

If a file has no front matter, its whole content becomes the article
body and the filename (without extension) becomes the title — category
and sub_category will still need to come from somewhere, so files without
front matter will be skipped unless title/category/sub_category are
otherwise supplied.

--- Notes ---
- category / sub_category must match an EXISTING name (case-insensitive).
  Unmapped categories are skipped, never guessed or auto-created.
- Existing categories: {$this->_list($existing_cats)}
- New posts default to "draft" unless status is explicitly "published".
- Re-running against a URL that already exists UPDATES that post instead
  of creating a duplicate — safe to re-run.
- If "image" is a path to a file that exists on this machine, it's copied
  into uploads/post/ automatically. Otherwise it's treated as a filename
  that must already exist there.

TXT;
	}

	private function _list($items){
		return empty($items) ? '(none yet)' : implode(', ', $items);
	}

	private function _detect_format($path){
		if (is_dir($path)){
			return 'html';
		}
		$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
		if ($ext === 'csv') return 'csv';
		if ($ext === 'json') return 'json';
		if (in_array($ext, array('html', 'htm', 'txt'))) return 'html';
		return null;
	}

	private function _parse_csv($path){
		$records = array();
		$handle = fopen($path, 'r');
		if ( ! $handle) return $records;

		$header = fgetcsv($handle);
		if ( ! $header){
			fclose($handle);
			return $records;
		}
		$header = array_map(function($h){
			return strtolower(trim(str_replace(' ', '_', $h)));
		}, $header);

		while (($row = fgetcsv($handle)) !== false){
			if (count($row) === 1 && trim((string) $row[0]) === ''){
				continue;
			}
			$record = array();
			foreach ($header as $i => $key){
				$record[$key] = isset($row[$i]) ? $row[$i] : '';
			}
			$records[] = $record;
		}
		fclose($handle);
		return $records;
	}

	private function _parse_json($path){
		$data = json_decode(file_get_contents($path), true);
		if (json_last_error() !== JSON_ERROR_NONE){
			echo "Invalid JSON: " . json_last_error_msg() . PHP_EOL;
			return array();
		}
		if ( ! is_array($data)){
			return array();
		}
		return array_is_list($data) ? $data : array($data);
	}

	private function _parse_html($path){
		$files = array();
		if (is_dir($path)){
			foreach (array('html', 'htm', 'txt') as $ext){
				foreach (glob(rtrim($path, '/') . '/*.' . $ext) as $file){
					$files[] = $file;
				}
			}
		} else {
			$files[] = $path;
		}

		$records = array();
		foreach ($files as $file){
			$records[] = $this->_parse_front_matter($file);
		}
		return $records;
	}

	private function _parse_front_matter($file){
		$raw = file_get_contents($file);
		$record = array();

		if (preg_match('/^---\s*\n(.*?)\n---\s*\n(.*)$/s', $raw, $m)){
			foreach (explode("\n", trim($m[1])) as $line){
				if (strpos($line, ':') === false) continue;
				list($key, $value) = explode(':', $line, 2);
				$record[strtolower(trim($key))] = trim($value);
			}
			$record['content'] = trim($m[2]);
		} else {
			$record['content'] = trim($raw);
		}

		if (empty($record['title'])){
			$record['title'] = pathinfo($file, PATHINFO_FILENAME);
		}

		return $record;
	}

	private function _import_record($record, $index){
		$title        = trim((string) ($record['title'] ?? ''));
		$category     = trim((string) ($record['category'] ?? ''));
		$sub_category = trim((string) ($record['sub_category'] ?? ''));
		$content      = trim((string) ($record['content'] ?? ''));

		if ($title === '' || $category === '' || $sub_category === '' || $content === ''){
			echo "[{$index}] SKIPPED - missing title/category/sub_category/content" . PHP_EOL;
			$this->skipped++;
			return;
		}

		$cat_id = $this->_resolve_category($category);
		if ( ! $cat_id){
			echo "[{$index}] SKIPPED - unknown category \"{$category}\"" . PHP_EOL;
			$this->skipped++;
			return;
		}

		$sub_cat_id = $this->_resolve_subcategory($sub_category, $cat_id);
		if ( ! $sub_cat_id){
			echo "[{$index}] SKIPPED - unknown sub_category \"{$sub_category}\" under \"{$category}\"" . PHP_EOL;
			$this->skipped++;
			return;
		}

		$uri = $this->_slugify( ! empty($record['url']) ? $record['url'] : $title);
		if ($uri === ''){
			echo "[{$index}] SKIPPED - could not derive a URL for \"{$title}\"" . PHP_EOL;
			$this->skipped++;
			return;
		}

		$status = (isset($record['status']) && strtolower(trim($record['status'])) === 'published')
			? 'published' : 'draft';

		$post_img = $this->_resolve_image(trim((string) ($record['image'] ?? '')));

		$data = array(
			'cat_id'         => $cat_id,
			'sub_cat_id'     => $sub_cat_id,
			'post_title'     => strtolower(trim(str_replace('?', ' ', $title))),
			'uri'            => $uri,
			'post_img'       => $post_img,
			'post_alt_title' => trim((string) ($record['image_alt'] ?? '')),
			'post_desc'      => $content,
			'status'         => $status,
		);

		$existing_id = $this->_find_post_id_by_uri($uri);
		if ($existing_id){
			$data['post_updated'] = date('Y-m-d H:i:s');
			$this->Admin_model->post_update($data, $existing_id);
			echo "[{$index}] UPDATED  - \"{$title}\" ({$uri})" . PHP_EOL;
			$this->updated++;
		} else {
			$data['posted_date'] = date('Y-m-d H:i:s');
			$this->Admin_model->post_add($data);
			echo "[{$index}] IMPORTED - \"{$title}\" ({$uri}) [{$status}]" . PHP_EOL;
			$this->imported++;
		}
	}

	private function _resolve_category($name){
		$this->db->where("LOWER(cat_name) = " . $this->db->escape(strtolower(trim($name))), null, false);
		$row = $this->db->get('category')->row();
		return $row ? $row->cat_id : null;
	}

	private function _resolve_subcategory($name, $cat_id){
		$this->db->where('cat_id', $cat_id);
		$this->db->where("LOWER(sub_cat_name) = " . $this->db->escape(strtolower(trim($name))), null, false);
		$row = $this->db->get('sub_category')->row();
		return $row ? $row->sub_cat_id : null;
	}

	private function _find_post_id_by_uri($uri){
		$this->db->where('uri', $uri);
		$row = $this->db->get('post')->row();
		return $row ? $row->post_id : null;
	}

	private function _slugify($text){
		$text = strtolower(trim((string) $text));
		$text = preg_replace('/[^a-z0-9]+/', ' ', $text);
		return trim($text);
	}

	private function _resolve_image($image){
		if ($image === ''){
			return 'post.png';
		}
		if (is_file($image)){
			$filename = time() . '_' . basename($image);
			$dest = FCPATH . 'uploads/post/' . $filename;
			if (copy($image, $dest)){
				return $filename;
			}
			echo "  (warning: could not copy image {$image}, using its filename only)" . PHP_EOL;
		}
		return basename($image);
	}

}
