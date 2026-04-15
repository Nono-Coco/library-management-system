// server.js
const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║     📚 Library Management System API Server          ║
╠═══════════════════════════════════════════════════════╣
║  🚀 Server running on: http://localhost:${PORT}         ║
║  📖 API Documentation: http://localhost:${PORT}/health  ║
║  🔑 Auth endpoints: /api/auth/*                       ║
║  📕 Books endpoints: /api/books/*                     ║
║  📋 Loans endpoints: /api/loans/*                     ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();