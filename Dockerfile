FROM php:8.4

RUN apt-get update && apt-get install -y \
    git curl unzip libpq-dev libzip-dev zip nodejs npm

RUN docker-php-ext-install pdo pdo_pgsql zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader

ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME

ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME


RUN npm install && npm run build

RUN chmod -R 775 storage bootstrap/cache


EXPOSE 10000

CMD php artisan optimize:clear && \
    php artisan config:cache && \
    php artisan serve --host=0.0.0.0 --port=10000