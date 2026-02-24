# Розгортання у виробничому середовищі (Production Deployment)

Ця інструкція призначена для **Release Engineers** та **DevOps-фахівців** і описує процес розгортання проєкту `cinema-diploma`
(**Node.js + React + PostgreSQL**) на Linux-сервері.

---

## 1. Вимоги до апаратного забезпечення
Для стабільної роботи системи (фронтенд-статика, бекенд-сервер та база даних на одній машині) мінімальні вимоги наступні:
- **Архітектура:** x86_64 або ARM64
- **CPU:** 2 vCPU
- **Памʼять (RAM):** 4 GB
- **Диск:** 20 GB SSD

---

## 2. Необхідне програмне забезпечення
На сервері (рекомендовано Ubuntu 22.04 LTS або 24.04 LTS) має бути встановлено:
* **Node.js** (версія 18.x або вище) та **npm**.
* **PostgreSQL** (версія 14 або вище).
* **Nginx** (для роздачі статики та Reverse Proxy).
* **PM2** (Process Manager для керування процесами Node.js).
* **Git** (для отримання вихідного коду).

---

## 3. Налаштування мережі
Необхідно налаштувати брандмауер (наприклад, UFW в Ubuntu), щоб дозволити лише необхідний трафік:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> Порт 5432 повинен бути доступний лише з localhost.

---

## 4. Налаштування PostgreSQL
Створіть production-базу даних та ізольованого користувача. Увійдіть у консоль PostgreSQL 
```bash
sudo -u postgres psql
```
і виконайте:

```sql
CREATE DATABASE cinema_prod;
CREATE USER cinema_user WITH ENCRYPTED PASSWORD 'StrongProductionPassword123!';
GRANT ALL PRIVILEGES ON DATABASE cinema_prod TO cinema_user;
```

---

## 5. Розгортання коду

### Клонування репозиторію

```bash
cd /var/www
sudo git clone https://github.com/AnnVasylenko59/cinema-diploma.git cinema
sudo chown -R $USER:$USER /var/www/cinema
cd cinema
```

### Налаштування та збірка Backend

```bash
cd backend
npm install --production
```
Створення файлу змінних середовища
```bash
echo 'DATABASE_URL="postgresql://cinema_user:StrongProductionPassword123!@localhost:5432/cinema_prod?schema=public"' > .env
echo 'PORT=5000' >> .env
echo 'JWT_SECRET="your_production_secret_key"' >> .env
```
Генерація клієнта Prisma та міграція БД
```bash
npx prisma generate
npx prisma migrate deploy
```

### Налаштування та збірка Frontend

```bash
cd ../frontend
npm install
npm run build
# Оптимізована статика буде згенерована у папці /frontend/dist
```

---

## 6. Конфігурація серверів (PM2 та Nginx)

### Запуск Application Server (PM2)
Щоб бекенд працював у фоновому режимі та автоматично перезапускався при збоях:
```bash
cd /var/www/cinema/backend
pm2 start server.js --name "cinema-api"
pm2 save
pm2 startup
```

### Налаштування Web Server (Nginx) Nginx
Створіть конфігураційний файл /etc/nginx/sites-available/cinema:
```
server {
    listen 80;
    server_name your_domain.com; # Замініть на ваш домен або IP

    # Роздача статики React-фронтенду
    location / {
        root /var/www/cinema/frontend/dist;
        try_files $uri /index.html;
    }
    
    # Проксіювання запитів до Node.js бекенду
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Активуйте конфігурацію та перезапустіть Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cinema /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. Перевірка працездатності
Щоб переконатися, що все розгорнуто правильно, виконайте наступні кроки:

1. Перевірка Backend: У терміналі сервера виконайте команду `curl http://localhost:5000/api/health`. Має повернутися JSON зі статусом OK.

2. Перевірка процесів: Виконайте `pm2 status`. Процес `cinema-api` повинен мати статус online.

3. Перевірка Frontend: Відкрийте ваш домен (або IP сервера) у браузері. Головна сторінка кінотеатру має завантажитися без помилок у консолі браузера (F12).


