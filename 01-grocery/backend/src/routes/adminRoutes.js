const express = require("express");

const {
  adminLogin,
  getDashboardStatsController,
  getReportSummaryController,
  getDailySalesController,
  getTopSellingProductsController,
} = require("../controllers/adminController");

const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Public — admin login
router.post("/login", adminLogin);

// Protected admin routes
router.use(adminAuth);

router.get("/dashboard", getDashboardStatsController);

router.get("/reports", getReportSummaryController);
router.get("/reports/daily-sales", getDailySalesController);
router.get("/reports/top-products", getTopSellingProductsController);

module.exports = router;