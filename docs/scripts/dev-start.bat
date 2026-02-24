@echo off
echo =======================================================
echo 🚀 Starting Cinema Diploma - Development Environment
echo =======================================================

echo [1/3] Starting Backend Server...
start cmd /k "cd ../../backend && npm run dev"

echo [2/3] Starting Frontend Client...
start cmd /k "cd ../../frontend && npm run dev"

echo [3/3] Starting Prisma Studio (Database GUI)...
start cmd /k "cd ../../backend && npx prisma studio"

echo ✅ All development services are starting in separate windows!
echo 🌐 Frontend: http://localhost:5173
echo ⚙️  Backend API: http://localhost:5000/api-docs
echo 🗄️  Prisma Studio: http://localhost:5555
pause