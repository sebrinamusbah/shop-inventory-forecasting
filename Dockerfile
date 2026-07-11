FROM php:8.4

RUN apt-get update && apt-get install -y \
    git curl unzip libpq-dev libzip-dev zip nodejs npm

RUN docker-php-ext-install pdo pdo_pgsql zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN npm install
RUN npm run build

RUN chmod -R 775 storage bootstrap/cache

RUN php artisan optimize:clear

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000