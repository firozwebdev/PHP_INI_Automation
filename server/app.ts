import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import backupRoutes from "./routes/backup.ts";
import extensionRoutes from "./routes/extension.ts";
import iniRoutes from "./routes/ini.ts";
import phpRoutes from "./routes/php.ts";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// General middleware
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from client build
app.use(express.static(path.join(__dirname, "../client/dist")));

// API Routes
app.use("/api/php", phpRoutes);
app.use("/api/ini", iniRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/extension", extensionRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Serve React app for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);

    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(err.status || 500).json({
      error: {
        message: err.message || "Internal Server Error",
        ...(isDevelopment && { stack: err.stack }),
      },
    });
  }
);

// 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    error: {
      message: "API endpoint not found",
      path: req.path,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PHP INI Automation Pro server running on port ${PORT}`);
  console.log(
    `📱 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`
  );
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
