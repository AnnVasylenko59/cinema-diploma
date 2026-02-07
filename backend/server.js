const { app, prisma } = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, 'localhost', () => {
    console.log(`🎬 Cinema backend running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL || 'Not configured'}`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using fallback'}`);
    console.log(`🔓 PASSWORDS: Stored as plain text (NO HASHING)`);
    console.log(`🔒 PASSWORD VALIDATION: Enabled (8+ chars, upper/lowercase, numbers)`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🐛 Debug users: http://localhost:${PORT}/api/users/debug`);
    console.log(`🔑 Login: POST http://localhost:${PORT}/api/users/login`);
    console.log(`👤 Profile: GET http://localhost:${PORT}/api/users/profile`);
    console.log(`📝 Register: POST http://localhost:${PORT}/api/users/register`);
    console.log(`🔐 Validate password: POST http://localhost:${PORT}/api/users/validate-password`);
    console.log(`🔄 Update password: POST http://localhost:${PORT}/api/users/update-password`);
    console.log(`🎯 Movies: http://localhost:${PORT}/api/movies`);
    console.log(`🔧 Test: http://localhost:${PORT}/api/test`);
    console.log(`🚀 Frontend: http://localhost:5173`);
});

process.on('SIGINT', async () => {
    console.log('🔄 Disconnecting from database...');
    await prisma.$disconnect();
    process.exit(0);
});