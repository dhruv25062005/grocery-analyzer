const pool = require("../db/connection");

const {
  getAllPayments,
} = require("../db/queries/paymentQueries");

/*
  Create a payment session for an order.
*/
async function createPayment(req, res) {
  const { orderId, method } = req.body;

  if (!orderId || !method) {
    return res.status(400).json({
      success: false,
      message: "Order ID and payment method are required",
    });
  }

  const parsedOrderId = Number(orderId);

  if (
    !Number.isInteger(parsedOrderId) ||
    parsedOrderId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  try {
    /*
      Get the order from the database.

      The payment amount is taken from the database,
      never from the frontend.
    */
    const orderResult = await pool.query(
      `
      SELECT
        id,
        total,
        status
      FROM orders
      WHERE id = $1
      `,
      [parsedOrderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    /*
      Only pending orders can receive a payment.
    */
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for payment",
      });
    }

    /*
      Prevent multiple pending payments for the same order.

      This protects against a user clicking the payment
      button multiple times.
    */
    const existingPaymentResult = await pool.query(
      `
      SELECT
        id,
        order_id,
        payment_reference,
        amount,
        method,
        status,
        paid_at,
        created_at
      FROM payments
      WHERE order_id = $1
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [order.id]
    );

    if (existingPaymentResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Existing pending payment returned",
        payment: existingPaymentResult.rows[0],
      });
    }

    /*
      Generate a unique payment reference.
    */
    const paymentReference = `PAY-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    /*
      Create pending payment.

      The amount comes directly from orders.total.
    */
    const paymentResult = await pool.query(
      `
      INSERT INTO payments (
        order_id,
        payment_reference,
        amount,
        method,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        order.id,
        paymentReference,
        order.total,
        method,
        "pending",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Payment created",
      payment: paymentResult.rows[0],
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create payment",
    });
  }
}


/*
  TEMPORARY PROTOTYPE VERIFICATION

  This currently simulates a successful payment.

  Before production:
  - Razorpay/UPI provider should confirm the payment.
  - The backend should verify the provider signature/payment ID.
  - Only then should stock be deducted.
*/
async function verifyPayment(req, res) {
  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: "Payment ID is required",
    });
  }

  const parsedPaymentId = Number(paymentId);

  if (
    !Number.isInteger(parsedPaymentId) ||
    parsedPaymentId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment ID",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
      Lock the payment row.

      If two requests try to verify the same payment,
      PostgreSQL will serialize access to this row.
    */
    const paymentResult = await client.query(
      `
      SELECT
        id,
        order_id,
        amount,
        status,
        method
      FROM payments
      WHERE id = $1
      FOR UPDATE
      `,
      [parsedPaymentId]
    );

    if (paymentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = paymentResult.rows[0];

    /*
      Prevent double verification.
    */
    if (payment.status === "paid") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Payment is already completed",
      });
    }

    /*
      Only pending payments can be verified.
    */
    if (payment.status !== "pending") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Payment is not pending",
      });
    }

    /*
      Lock the associated order.

      This prevents multiple payment operations from
      modifying the same order simultaneously.
    */
    const orderResult = await client.query(
      `
      SELECT
        id,
        total,
        status
      FROM orders
      WHERE id = $1
      FOR UPDATE
      `,
      [payment.order_id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    /*
      The order must still be pending.
    */
    if (order.status !== "pending") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Order is not pending",
      });
    }

    /*
      IMPORTANT:
      Payment amount must exactly match the order total.

      This prevents an incorrect payment amount from
      being marked as successful.
    */
    const paymentAmount = Number(payment.amount);
    const orderTotal = Number(order.total);

    if (
      !Number.isFinite(paymentAmount) ||
      !Number.isFinite(orderTotal) ||
      paymentAmount !== orderTotal
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Payment amount does not match order total",
      });
    }

    /*
      Get all products belonging to this order.

      FOR UPDATE OF p locks the product rows.

      This is the important concurrency protection:
      if stock is 1, two simultaneous payments cannot
      both deduct that same final unit.
    */
    const itemsResult = await client.query(
      `
      SELECT
        oi.product_id,
        oi.quantity,
        p.name,
        p.stock
      FROM order_items oi
      INNER JOIN products p
        ON p.id = oi.product_id
      WHERE oi.order_id = $1
      FOR UPDATE OF p
      `,
      [order.id]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Order contains no products",
      });
    }

    /*
      Check stock for every product before changing
      anything.
    */
    for (const item of itemsResult.rows) {
      const availableStock = Number(item.stock);
      const requestedQuantity = Number(item.quantity);

      if (
        !Number.isInteger(availableStock) ||
        availableStock < requestedQuantity
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `${item.name} does not have enough stock`,
        });
      }
    }

    /*
      Deduct stock only after ALL products have passed
      the stock check.
    */
    for (const item of itemsResult.rows) {
      await client.query(
        `
        UPDATE products
        SET
          stock = stock - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          item.quantity,
          item.product_id,
        ]
      );
    }

    /*
      Mark payment as paid.
    */
    const updatedPayment = await client.query(
      `
      UPDATE payments
      SET
        status = 'paid',
        paid_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [payment.id]
    );

    /*
      Mark order as paid.
    */
    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET
        status = 'paid',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [order.id]
    );

    /*
      Everything succeeded.

      Commit:
      - stock deduction
      - payment status
      - order status

      as one atomic transaction.
    */
    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Payment verified and order completed",
      payment: updatedPayment.rows[0],
      order: updatedOrder.rows[0],
    });
  } catch (error) {
    /*
      Safely roll back the transaction.
    */
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Payment rollback error:",
        rollbackError.message
      );
    }

    console.error(
      "Payment verification error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  } finally {
    client.release();
  }
}


/*
  Admin payment list.
*/
async function getAllPaymentsController(req, res) {
  try {
    const payments = await getAllPayments();

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error(
      "Get all payments error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load payments",
    });
  }
}


module.exports = {
  createPayment,
  verifyPayment,
  getAllPaymentsController,
};