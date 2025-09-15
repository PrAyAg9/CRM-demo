const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    // First check for Bearer token in header (for API clients)
    let token = req.header("Authorization")?.replace("Bearer ", "");

    // If no Authorization header, check for access token in cookies
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Invalid token or user not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: "Server error during authentication.",
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    // First check for Bearer token in header (for API clients)
    let token = req.header("Authorization")?.replace("Bearer ", "");

    // If no Authorization header, check for access token in cookies
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Access denied. Admin role required.",
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireAdmin,
};
