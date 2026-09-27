<?php defined('BASEPATH') OR exit('No direct script access allowed'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 Page Not Found — Imperialpedia</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --accent-red: #e11d48;
            --accent-hover: #be123c;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border-color: #334155;
            --font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: var(--font-family);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .error-card {
            max-width: 640px;
            width: 100%;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 48px 40px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .badge-404 {
            display: inline-block;
            background: rgba(225, 29, 72, 0.15);
            color: var(--accent-red);
            font-size: 1.1rem;
            font-weight: 800;
            padding: 6px 18px;
            border-radius: 9999px;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
            border: 1px solid rgba(225, 29, 72, 0.3);
        }

        .glitch-title {
            font-size: 4rem;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 16px;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .sub-text {
            color: var(--text-muted);
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 32px;
        }

        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 36px;
        }

        .search-box input {
            flex: 1;
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 14px 18px;
            color: #fff;
            font-family: inherit;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s;
        }

        .search-box input:focus {
            border-color: var(--accent-red);
        }

        .search-box button {
            background: var(--accent-red);
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 14px 24px;
            font-family: inherit;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            transition: background 0.2s;
        }

        .search-box button:hover {
            background: var(--accent-hover);
        }

        .quick-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            border-top: 1px solid var(--border-color);
            padding-top: 28px;
        }

        .quick-links a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            transition: all 0.2s;
        }

        .quick-links a:hover {
            color: #fff;
            background: var(--accent-red);
        }

        .brand-footer {
            margin-top: 24px;
            font-size: 0.8rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="error-card">
        <div class="badge-404">ERROR 404</div>
        <h1 class="glitch-title">Page Not Found</h1>
        <p class="sub-text">The page or resource you are looking for might have been moved, renamed, or is temporarily unavailable on Imperialpedia.</p>

        <form action="/search" method="GET" class="search-box">
            <input type="text" name="q" placeholder="Search articles, guides, topics..." required />
            <button type="submit">Search</button>
        </form>

        <div class="quick-links">
            <a href="/">← Return Home</a>
            <a href="/news">News</a>
            <a href="/marketing">Marketing</a>
            <a href="/seo">SEO & Tech</a>
            <a href="/tools">Free Tools</a>
        </div>

        <div class="brand-footer">
            &copy; <?php echo date('Y'); ?> Imperialpedia Inc. All rights reserved.
        </div>
    </div>
</body>
</html>