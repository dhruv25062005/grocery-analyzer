const {
  getDashboardStats,
} = require("../db/queries/dashboardQueries");

const {
  getReportSummary,
} = require("../db/queries/reportQueries");

const {
  getDailySales,
} = require("../db/queries/reportSalesQueries");

const {
  getTopSellingProducts,
} = require("../db/queries/topProductQueries");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/connection");

async function getDashboardStatsController(req, res) {
  try {
    const stats = await getDashboardStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
}

async function getReportSummaryController(req, res) {
  try {
    const summary = await getReportSummary();

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Get report summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load report summary",
    });
  }
}

async function getDailySalesController(req, res) {
  try {
    const sales = await getDailySales();

    res.json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error("Get daily sales error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load daily sales",
    });
  }
}

async function getTopSellingProductsController(req, res) {
  try {
    const products = await getTopSellingProducts();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get top selling products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load top selling products",
    });
  }
}

async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, email, password_hash
      FROM admins
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const admin = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Admin login failed",
    });
  }
}

module.exports = {
  adminLogin,
  getDashboardStatsController,
  getReportSummaryController,
  getDailySalesController,
  getTopSellingProductsController,
};