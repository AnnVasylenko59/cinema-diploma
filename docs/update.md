# Інструкція з оновлення проєкту (Update & Rollback)

Цей документ містить чіткі покрокові рекомендації для Release Engineer / DevOps щодо безпечного оновлення проєкту `cinema-diploma` у виробничому середовищі.

---

## 1. Підготовка до оновлення

### Планування часу простою
Оновлення вимагає тимчасової зупинки бекенд-сервісів.
- **Рекомендований час:** Години мінімальної активності користувачів (наприклад, 03:00 - 05:00).
- **Орієнтовний час простою (Downtime):** 5–10 хвилин.

### Створення резервних копій
Перед будь-якими змінами обов'язково створіть резервні копії бази даних та конфігурацій:
```bash
# Резервна копія конфігурацій
cp /var/www/cinema/backend/.env /var/www/cinema/backend/.env.backup

# Дамп бази даних PostgreSQL
pg_dump -U cinema_user -h localhost -d cinema_prod -F c -f /var/backups/cinema_db_pre_update_$(date +%Y%m%d_%H%M).dump
```

### Перевірка сумісності
- Перевірте файл `package.json` у новій гілці на наявність змін у вимогах до версії Node.js.
- Перевірте файл `schema.prisma` та `.env.example` на наявність нових обов'язкових змінних середовища.

---

## 2. Процес оновлення

### Зупинка потрібних служб
Щоб уникнути конфліктів під час міграції бази даних та оновлення файлів, зупиніть сервер застосунку:
```bash
pm2 stop cinema-api
```

### Розгортання нового коду
Перейдіть у директорію проєкту, скиньте можливі локальні зміни та завантажте новий код з гілки `main`:
```bash
cd /var/www/cinema
git fetch origin
git reset --hard origin/main
```

### Оновлення конфігурацій
Якщо у новій версії додалися змінні середовища, перенесіть їх з `.env.example` до робочого `.env`:
```bash
# Порівняння файлів (за потреби додайте нові ключі вручну)
diff backend/.env.example backend/.env
```

### Встановлення залежностей та міграція даних (Backend)
Оновіть пакети та застосуйте зміни до структури бази даних (Prisma):
```bash
cd backend
npm install --production

# Безпечне застосування нових міграцій до існуючої БД
npx prisma migrate deploy
```

### Збірка нового Frontend
Оновіть клієнтську частину та перезберіть статику для Nginx:
```bash
cd ../frontend
npm install
npm run build
```

---

## 3. Перевірка після оновлення

Запустіть потрібні служби:
```bash
pm2 start cinema-api
pm2 save
```

Базова перевірка статусу:
1. Виконайте команду `pm2 status` і переконайтеся, що процес `cinema-api` має статус **online**.
2. Виконайте швидкий Health Check: `curl http://localhost:5000/api/health` (має повернути статус 200).

*(Примітка: Детальні тести правильності роботи, моніторинг продуктивності та регламенти вирішення проблем винесені в окремі лабораторні роботи).*

---

## 4. Процедура відкату (Rollback)
Якщо після оновлення система не працює (помилки 500, сервіс не стартує), негайно виконайте відкат до попередньої стабільної версії:

1. **Зупинка служб:**
   ```bash
   pm2 stop cinema-api
   ```
2. **Відновлення коду:**
   Поверніться до хешу попереднього успішного коміту (або попереднього тегу):
   ```bash
   cd /var/www/cinema
   git reset --hard <PREVIOUS_COMMIT_HASH>
   ```
3. **Відновлення бази даних (якщо міграція пошкодила дані):**
   ```bash
   sudo -u postgres psql -c "DROP DATABASE cinema_prod;"
   sudo -u postgres psql -c "CREATE DATABASE cinema_prod WITH OWNER cinema_user;"
   pg_restore -U cinema_user -d cinema_prod -1 /var/backups/cinema_db_pre_update_<DATE>.dump
   ```
4. **Відновлення конфігурацій та перезбірка:**
   ```bash
   mv /var/www/cinema/backend/.env.backup /var/www/cinema/backend/.env
   cd /var/www/cinema/frontend && npm run build
   cd ../backend && npm install --production
   ```
5. **Запуск та перевірка:**
   ```bash
   pm2 start cinema-api
   ```