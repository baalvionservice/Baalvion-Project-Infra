<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * SEO & Schema.org JSON-LD Helper for Imperialpedia / ControlTheMarket
 */

if (!function_exists('render_website_schema')) {
    function render_website_schema($site_name = 'Imperialpedia', $site_url = 'https://imperialpedia.com') {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $site_name,
            'url' => rtrim($site_url, '/'),
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => rtrim($site_url, '/') . '/search?q={search_term_string}',
                'query-input' => 'required name=search_term_string'
            ]
        ];
        return '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>';
    }
}

if (!function_exists('render_organization_schema')) {
    function render_organization_schema($org_name = 'Imperialpedia', $site_url = 'https://imperialpedia.com', $logo_url = '') {
        $logo = !empty($logo_url) ? $logo_url : rtrim($site_url, '/') . '/assets/img/logo.png';
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $org_name,
            'url' => rtrim($site_url, '/'),
            'logo' => $logo,
            'sameAs' => [
                'https://twitter.com/imperialpedia',
                'https://linkedin.com/company/imperialpedia',
                'https://facebook.com/imperialpedia'
            ]
        ];
        return '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>';
    }
}

if (!function_exists('render_breadcrumb_schema')) {
    function render_breadcrumb_schema($items = []) {
        if (empty($items)) return '';

        $list = [];
        $position = 1;
        foreach ($items as $name => $url) {
            $list[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $name,
                'item' => $url
            ];
        }

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $list
        ];
        return '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>';
    }
}

if (!function_exists('render_article_schema')) {
    function render_article_schema($article_data = []) {
        if (empty($article_data)) return '';

        $title = !empty($article_data['title']) ? $article_data['title'] : 'Article';
        $description = !empty($article_data['description']) ? strip_tags($article_data['description']) : '';
        $url = !empty($article_data['url']) ? $article_data['url'] : current_url();
        $image = !empty($article_data['image']) ? $article_data['image'] : base_url('assets/img/default-article.jpg');
        $author_name = !empty($article_data['author_name']) ? $article_data['author_name'] : 'Imperialpedia Editorial Team';
        $author_url = !empty($article_data['author_url']) ? $article_data['author_url'] : base_url('author/' . url_title($author_name, 'dash', true));
        $date_published = !empty($article_data['created_at']) ? date('c', strtotime($article_data['created_at'])) : date('c');
        $date_modified = !empty($article_data['updated_at']) ? date('c', strtotime($article_data['updated_at'])) : $date_published;

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            'headline' => mb_substr($title, 0, 110),
            'description' => mb_substr($description, 0, 250),
            'image' => [$image],
            'datePublished' => $date_published,
            'dateModified' => $date_modified,
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id' => $url
            ],
            'author' => [
                '@type' => 'Person',
                'name' => $author_name,
                'url' => $author_url
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => 'Imperialpedia',
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => base_url('assets/img/logo.png')
                ]
            ]
        ];

        return '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>';
    }
}
