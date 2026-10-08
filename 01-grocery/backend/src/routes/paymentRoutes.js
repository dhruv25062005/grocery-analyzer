const express = require("express");

const {
  createPayment,
  verifyPayment,
  getAllPaymentsController,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/", createPayment);
router.get("/", getAllPaymentsController);
router.post("/verify", verifyPayment);

module.exports = router;