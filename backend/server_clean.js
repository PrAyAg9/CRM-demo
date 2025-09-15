const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("dotenv").config();

// Import services
const redisService = require("./services/redisService");

// Import middleware
const { authMiddleware } = require("./middleware/auth");

// Import routes
const authRoutes = require("./routes/auth");
const customerRoutes = require("./routes/customers");
const orderRoutes = require("./routes/orders");
const campaignRoutes = require("./routes/campaigns");
const segmentationRoutes = require("./routes/segmentation");
const vendorRoutes = require("./routes/vendor");
const deliveryRoutes = require("./routes/deliveryReceipt");
const aiRoutes = require("./routes/ai");
const analyticsRoutes = require("./routes/analytics");

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure passport
require("./config/passport")(passport);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", authMiddleware, customerRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/campaigns", authMiddleware, campaignRoutes);
app.use("/api/segmentation", authMiddleware, segmentationRoutes);
app.use("/api/analytics", authMiddleware, analyticsRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/delivery-receipt", deliveryRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mini-crm")
  .then(() => {
    console.log("Connected to MongoDB");
    // Initialize Redis connection (optional for development)
    if (process.env.REDIS_URL) {
      return redisService.connect();
    } else {
      console.log("Redis not configured, skipping connection");
      return Promise.resolve();
    }
  })
  .then(() => {
    if (process.env.REDIS_URL) {
      console.log("Connected to Redis");
    }
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `API Documentation available at http://localhost:${PORT}/api-docs`
      );
      console.log(
        `Health check available at http://localhost:${PORT}/api/health`
      );
    });
  })
  .catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });
