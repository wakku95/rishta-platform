# DEPLOYMENT & PRODUCTION SPECIFICATION

## 1. System Requirements

- **Server**: Linux (Ubuntu 22.04 LTS / 24.04 LTS recommended) or Managed VPS.
- **Web Server**: Nginx with SSL (Let's Encrypt / Cloudflare).
- **PHP**: PHP 8.2 or 8.3 with extensions (`bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `json`, `mbstring`, `openssl`, `pcre`, `pdo_mysql`, `tokenizer`, `xml`).
- **Database**: MySQL 8.0+ / MariaDB 10.6+.
- **Node.js**: Node 20 LTS / 22+ for Vite frontend builds.
- **Process Manager**: Supervisor for Laravel Queue Worker (`queue:work`).
- **Cron**: Standard Linux cron for `php artisan schedule:run`.

---

## 2. Production Deployment Sequence

```bash
# 1. Clone/Pull latest main branch
git pull origin main

# 2. Install PHP dependencies without dev packages
composer install --no-dev --optimize-autoloader

# 3. Cache configuration, events, routes, and views
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

# 4. Run database migrations safely
php artisan migrate --force

# 5. Build optimized frontend assets
npm ci
npm run build

# 6. Restart queue workers
php artisan queue:restart
```

---

## 3. Nginx Configuration Guidelines

Ensure single-page routing is properly routed to `index.html` for frontend routes, and `/api` is routed to Laravel's `index.php`:
```nginx
location /api {
    try_files $uri $uri/ /index.php?$query_string;
}

location / {
    try_files $uri $uri/ /index.html;
}
```
