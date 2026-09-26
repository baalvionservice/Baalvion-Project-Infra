FROM php:8.2-apache

# Install required system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libzip-dev \
    libonig-dev \
    libicu-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) gd mysqli pdo_mysql zip mbstring intl \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Configure Apache DocumentRoot
ENV APACHE_DOCUMENT_ROOT /var/www/html
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Uploads (post/author/user/resume images) get written by the Apache worker
# (www-data), not root. Default upload_max_filesize (2M) also rejects most
# real phone/camera photos before they ever reach the app's own checks.
RUN { \
      echo 'upload_max_filesize = 20M'; \
      echo 'post_max_size = 25M'; \
      echo 'memory_limit = 256M'; \
    } > /usr/local/etc/php/conf.d/uploads.ini

# Set default working directory
WORKDIR /var/www/html

# Local dev (docker-compose.yml) bind-mounts the app over this; production images need the
# code baked in since there's no bind mount there.
COPY . /var/www/html/

# uploads/ is also mounted as a volume in production (see docker-compose) so
# new uploads survive image rebuilds — this just makes sure whatever lands in
# the container, freshly built or already-mounted, is writable by www-data.
RUN mkdir -p uploads application/cache application/logs \
 && chown -R www-data:www-data /var/www/html/uploads application/cache application/logs

EXPOSE 80
