const express = require("express");

const {
  createNewOrder,
  getOrderById,
  getAllOrdersController,
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", createNewOrder);

router.get("/", getAllOrdersController);

router.get("/:orderId", getOrderById);

module.exports = router;