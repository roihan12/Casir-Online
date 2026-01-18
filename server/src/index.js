// Start the PostgreSQL view refresh listener
const viewRefreshService = require("./services/viewRefreshService");
viewRefreshService.startListener().catch((err) => {
  console.error("Failed to start view refresh listener:", err);
});
