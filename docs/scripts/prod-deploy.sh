#!/bin/bash
# Скрипт автоматичного розгортання та запуску у Production

echo "======================================================="
echo " 🚀 Deploying Cinema Diploma - Production Environment"
echo "======================================================="

# Перехід у директорію проєкту
PROJECT_DIR="/var/www/cinema"
cd $PROJECT_DIR || exit

echo "📦 [1/3] Setting up Backend..."
cd backend
npm install --production
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

echo "🎨 [2/3] Building Frontend..."
cd ../frontend
npm install
npm run build

echo "🔄 [3/3] Restarting PM2 Application Server..."
cd ../backend
# Запускаємо процес, якщо він ще не існує, або перезапускаємо, якщо існує
pm2 describe cinema-api > /dev/null
if [ $? -eq 0 ]; then
    pm2 restart cinema-api
else
    pm2 start server.js --name "cinema-api"
fi
pm2 save

echo "✅ Production deployment completed successfully!"
pm2 status cinema-api