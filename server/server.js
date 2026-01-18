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

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

bootstrap();
