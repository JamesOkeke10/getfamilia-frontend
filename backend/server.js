require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const app = express();

/**
 * Trust proxy REQUIRED on Render so req.ip + rate limiting works correctly.
 */
app.set("trust proxy", 1);

/**
 * Security headers
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/**
 * Rate limiting (applies to all /api routes)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api", apiLimiter);

/**
 * CORS
 */
const allowedOrigins = new Set([
  "https://getfamilia.ca",
  "https://www.getfamilia.ca",
  "https://getfamilia.netlify.app",
]);

function corsOriginCallback(origin, callback) {
  // Allow no-origin requests (Postman, curl, Render health checks)
  if (!origin) return callback(null, true);

  if (allowedOrigins.has(origin)) return callback(null, true);

  // Allow any Netlify preview domain if needed
  if (origin.endsWith(".netlify.app")) return callback(null, true);

  return callback(new Error("CORS blocked"), false);
}

app.use(
  cors({
    origin: corsOriginCallback,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// IMPORTANT: Preflight handler (do NOT use "*")
app.options(/.*/, cors({ origin: corsOriginCallback }));

/**
 * Body parsing
 */
app.use(express.json({ limit: "10kb" }));

/**
 * Connect DB
 */
connectDB();

/**
 * Routes
 */
app.use("/api/submissions", require("./routes/submissions"));

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.status(200).send("Get Familia API running");
});

/**
 * 404 handler (API)
 */
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (String(err?.message || "").toLowerCase().includes("cors blocked")) {
    return res.status(403).json({ error: "CORS error: origin not allowed" });
  }

  res.status(500).json({ error: "Server error. Please try again." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
