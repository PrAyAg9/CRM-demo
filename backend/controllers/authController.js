const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { generateToken, generateRefreshToken } = require("../config/passport");

class AuthController {
  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id).select("-__v");

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            preferences: user.preferences,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        error: "Failed to fetch user profile",
        message: error.message,
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { name, preferences } = req.body;
      const userId = req.user._id;

      const updateData = {};
      if (name) updateData.name = name;
      if (preferences)
        updateData.preferences = { ...req.user.preferences, ...preferences };

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-__v");

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        error: "Failed to update profile",
        message: error.message,
      });
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: "Refresh token is required",
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      if (decoded.type !== "refresh") {
        return res.status(400).json({
          error: "Invalid refresh token",
        });
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: "User not found or inactive",
        });
      }

      // Generate new tokens
      const newAccessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
          },
        },
      });
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return res.status(401).json({
          error: "Invalid or expired refresh token",
        });
      }

      console.error("Refresh token error:", error);
      res.status(500).json({
        error: "Failed to refresh token",
        message: error.message,
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      // In a more sophisticated setup, you would blacklist the token
      // For now, we'll just return success
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        error: "Failed to logout",
        message: error.message,
      });
    }
  }

  /**
   * Google OAuth success callback
   */
  googleCallback(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=authentication_failed`
        );
      }

      // Generate tokens
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set secure cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      };

      res.cookie("accessToken", accessToken, cookieOptions);
      res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with success
      res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth=success`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed`);
    }
  }

  /**
   * Google OAuth failure callback
   */
  googleFailure(req, res) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }

  /**
   * Check authentication status
   */
  async checkAuth(req, res) {
    try {
      if (req.user) {
        res.json({
          success: true,
          authenticated: true,
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
            role: req.user.role,
          },
        });
      } else {
        res.json({
          success: true,
          authenticated: false,
        });
      }
    } catch (error) {
      console.error("Check auth error:", error);
      res.status(500).json({
        error: "Failed to check authentication status",
        message: error.message,
      });
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user._id;

      // Soft delete - deactivate account
      await User.findByIdAndUpdate(userId, { isActive: false });

      res.json({
        success: true,
        message: "Account deactivated successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({
        error: "Failed to delete account",
        message: error.message,
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 50, search, role, isActive } = req.query;

      // Build query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (role) {
        query.role = role;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Execute query
      const [users, total] = await Promise.all([
        User.find(query)
          .select("-__v")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        User.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        error: "Failed to fetch users",
        message: error.message,
      });
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be either "admin" or "user"',
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User role updated successfully",
        data: { user },
      });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({
        error: "Failed to update user role",
        message: error.message,
      });
    }
  }
}

module.exports = new AuthController();
