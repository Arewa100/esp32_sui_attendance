import express from "express";
import cors from "cors";
import { config } from "./config/env";
import { log } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import attendanceRouter from "./routes/attendance";
import organisationsRouter from "./routes/organisations";
import { suiService } from "./services/suiClient";
import { clearStudentCache, getCacheStats } from "./services/attendanceService";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  log.http(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", async (_req, res) => {
  try {
    const balance = await suiService.checkBalance();
    const balanceInSui = Number(balance) / 1_000_000_000;
    const cacheStats = getCacheStats();

    res.json({
      ok: true,
      service: "attendance-system-server",
      version: "1.0.0",
      network: config.network,
      serverAddress: suiService.address,
      balance: `${balanceInSui.toFixed(4)} SUI`,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: "attendance-system-server",
      error: "Service unavailable",
    });
  }
});

// API Routes
app.use("/api/attendance", attendanceRouter);
app.use("/api/organisations", organisationsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    log.info("Starting Attendance System Server...");

    // Check server balance
    const balance = await suiService.checkBalance();
    const balanceInSui = Number(balance) / 1_000_000_000;
    log.info(`Server balance: ${balanceInSui.toFixed(4)} SUI`);

    if (balanceInSui < 0.1) {
      log.warn(
        "Low balance! Server may not have enough SUI for gas fees."
      );
    }

    // Verify system object exists
    try {
      const systemObj = await suiService.getObject(config.systemObjectId);
      log.info(`System object verified: ${config.systemObjectId}`);
      log.info(`System type: ${systemObj?.type}`);
    } catch (error) {
      log.error(`Cannot access system object: ${config.systemObjectId}`);
      log.error("Please verify SYSTEM_OBJECT_ID in your .env file");
      throw error;
    }

    // Start Express server
    app.listen(config.port, () => {
      log.info(`Server running on port ${config.port}`);
      log.info(`Health check: http://localhost:${config.port}/health`);
      log.info(`Attendance API: http://localhost:${config.port}/api/attendance`);
      log.info(`Organisations API: http://localhost:${config.port}/api/organisations`);
      log.info(`Environment: ${config.nodeEnv}`);
      log.info(`Network: ${config.network}`);
      log.info(`Package ID: ${config.packageId}`);
      log.info(`System Object ID: ${config.systemObjectId}`);
    });
  } catch (error) {
    log.error("Failed to start server", error);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown(signal: string) {
  log.info(`${signal} received, shutting down gracefully...`);
  clearStudentCache();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  log.error("Unhandled Promise Rejection", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  log.error("Uncaught Exception", error);
  process.exit(1);
});

// Start the server
startServer();

