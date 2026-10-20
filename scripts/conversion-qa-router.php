<?php
$root = dirname(__DIR__);
chdir($root);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/analytics-config.js') { header('Content-Type: text/javascript'); echo 'window.VELQ_ANALYTICS={ga4:"G-F93RK1P0H5",meta:null,tiktok:null};'; return; }
if ($path === '/api/waitlist') { http_response_code(503); header('Content-Type: application/json'); echo '{"ok":false,"error":"Local test only"}'; return; }
$real = realpath($root . $path);
if ($real && str_starts_with($real, $root . '/') && is_file($real) && !str_ends_with($path,'.php') && !str_ends_with($path,'.html')) { $ext=pathinfo($real, PATHINFO_EXTENSION); $mime=['css'=>'text/css','js'=>'text/javascript','webp'=>'image/webp','jpeg'=>'image/jpeg','jpg'=>'image/jpeg','png'=>'image/png','ico'=>'image/x-icon','svg'=>'image/svg+xml']; header('Content-Type: '.($mime[$ext]??'application/octet-stream')); readfile($real); return; }
require $root . '/image-patch.php';
if (str_starts_with($path,'/products/strawberry-protein-fiber-gummies')) { require $root . '/conversion-content.php'; return; }
if ($path === '/blog/protein-gummies-with-fiber-comparison' || $path === '/media' || str_starts_with($path,'/research')) { require $root . '/research-content.php'; return; }
if (str_starts_with($path,'/blog') || $path === '/sitemap.xml') { require $root . '/nutrition-content.php'; return; }
require $root . '/velq-site.php';
