/**
 * View Refresh Service - Listens for PostgreSQL notifications to refresh materialized views
 * This service runs independently to handle asynchronous view refreshes
 */

const { Pool } = require("pg");
const { db } = require("../config/db");
const logger = require("../utils/logger");
const { logger } = require("../utils/logger");


class ViewRefreshService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Dedicated connection pool for view refreshes with appropriate settings
      max: 2, // Limit connections to avoid overwhelming the database
      idleTimeoutMillis: 30000,
    });

    this.isListening = false;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  /**
   * Start the listener for materialized view refresh notifications
   */
  async startListener() {
    logger.info("iscall");
    try {
      logger.info("Starting view refresh notification listener");

      // Create a dedicated client for listening
      this.client = await this.pool.connect();

      // Listen for notifications
      await this.client.query("LISTEN refresh_mv_channel");

      this.client.on("notification", async (msg) => {
        logger.info(`Received view refresh notification: ${msg.payload}`);

        if (msg.payload === "transaction_updated") {
          await this.refreshSelectiveViews();
        }
      });

      this.client.on("error", (err) => {
        logger.error("Error in view refresh listener client:", err);
        this.reconnect();
      });

      this.isListening = true;
      this.retryCount = 0;
      logger.info("View refresh listener started successfully");
    } catch (error) {
      logger.error("Error starting view refresh listener:", error);
      this.reconnect();
    }
  }

  /**
   * Reconnect the listener if connection is lost
   */
  async reconnect() {
    if (this.client) {
      try {
        this.client.release();
      } catch (e) {
        logger.warn("Error releasing client connection:", e);
      }
    }

    this.isListening = false;
    this.retryCount++;

    if (this.retryCount <= this.maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
      logger.info(
        `Reconnecting view refresh listener in ${delay}ms (attempt ${this.retryCount})`
      );

      setTimeout(() => {
        this.startListener();
      }, delay);
    } else {
      logger.error(
        `Failed to reconnect view refresh listener after ${this.maxRetries} attempts`
      );
    }
  }

  /**
   * Refresh selective (critical) views
   */
  async refreshSelectiveViews() {
    try {
      logger.info("Starting selective view refresh");

      const client = await this.pool.connect();
      try {
        await client.query("SELECT perform_selective_view_refresh()");
        logger.info("Selective view refresh completed successfully");
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Error performing selective view refresh:", error);
    }
  }

  /**
   * Refresh all materialized views (for scheduled jobs or manual refresh)
   */
  async refreshAllViews() {
    try {
      logger.info("Starting full materialized view refresh");

      const client = await this.pool.connect();
      try {
        await client.query("SELECT perform_full_materialized_view_refresh()");
        logger.info("Full view refresh completed successfully");
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error("Error performing full view refresh:", error);
    }
  }

  /**
   * Stop the listener service
   */
  async stop() {
    if (this.client) {
      try {
        logger.info("Stopping view refresh listener");
        await this.client.query("UNLISTEN refresh_mv_channel");
        this.client.release();
        this.isListening = false;
        logger.info("View refresh listener stopped");
      } catch (error) {
        logger.error("Error stopping view refresh listener:", error);
      }
    }

    // Close the pool
    try {
      await this.pool.end();
    } catch (error) {
      logger.error("Error closing view refresh pool:", error);
    }
  }
}

// Create singleton instance
const viewRefreshService = new ViewRefreshService();

module.exports = viewRefreshService;
