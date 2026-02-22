const http = require('http');
const { Server } = require("socket.io");
const app = require("./src/app");
const prisma = require("./src/config/db");
// const superAdmin = require("./src/utils/createSuperAdmin");
const { initialize } = require("./src/config/initializer");

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connection established");

    // await superAdmin.createSuperAdmin();

    initialize().catch((err) => {
      console.error("Failed to initialize services:", err);
      process.exit(1);
    });

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          if (/^https:\/\/localhost:\d+$/.test(origin) || 
              /^https:\/\/127\.0\.0\.1:\d+$/.test(origin) || 
              /^https:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) {
            return callback(null, true);
          }
          callback(new Error('Not allowed by CORS'));
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Attach io to app so it can be used in controllers
    app.set('io', io);

    io.on('connection', (socket) => {
      console.log('Client connected to socket');
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from socket');
      });
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

bootstrap();
