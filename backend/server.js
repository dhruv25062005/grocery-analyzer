const app = require("./src/app");
const pool = require("./src/db/connection");

const PORT = process.env.PORT || 5000;

/*
  Pending orders/payments are automatically expired
  after this many minutes.
*/
const PAYMENT_EXPIRY_MINUTES = 15;

/*
  Expire abandoned pending payments and orders.

  This runs inside a database transaction so the cleanup
  does not partially update the payment/order state.
*/
async function cleanupExpiredOrders() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
      First expire pending payments that are older than
      the allowed payment window.
    */
    const expiredPaymentsResult = await client.query(
      `
      UPDATE payments
      SET
        status = 'expired'
      WHERE status = 'pending'
        AND created_at < CURRENT_TIMESTAMP
          - ($1 * INTERVAL '1 minute')
      RETURNING id, order_id
      `,
      [PAYMENT_EXPIRY_MINUTES]
    );

    /*
      Expire pending orders that are older than the
      payment window and do not have a successful payment.

      The NOT EXISTS condition protects already-paid orders.
    */
    const expiredOrdersResult = await client.query(
      `
      UPDATE orders o
      SET
        status = 'expired',
        updated_at = CURRENT_TIMESTAMP
      WHERE o.status = 'pending'
        AND o.created_at < CURRENT_TIMESTAMP
          - ($1 * INTERVAL '1 minute')
        AND NOT EXISTS (
          SELECT 1
          FROM payments p
          WHERE p.order_id = o.id
            AND p.status = 'paid'
        )
      RETURNING id, order_number
      `,
      [PAYMENT_EXPIRY_MINUTES]
    );

    await client.query("COMMIT");

    if (
      expiredPaymentsResult.rows.length > 0 ||
      expiredOrdersResult.rows.length > 0
    ) {
      console.log(
        `🧹 Cleanup: expired ${expiredPaymentsResult.rows.length} payment(s) and ${expiredOrdersResult.rows.length} order(s)`
      );
    }
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "❌ Cleanup rollback error:",
        rollbackError.message
      );
    }

    console.error(
      "❌ Expired order cleanup failed:",
      error.message
    );
  } finally {
    client.release();
  }
}

async function startServer() {
  try {
    /*
      Verify database connection before starting
      the application.
    */
    await pool.query("SELECT 1");

    console.log("✅ Database connection successful");

    /*
      Start the API server.
    */
    app.listen(PORT, () => {
      console.log(
        `🚀 SmartCart backend running on http://localhost:${PORT}`
      );

      console.log(
        `⏱️ Pending orders expire after ${PAYMENT_EXPIRY_MINUTES} minutes`
      );

      /*
        Run cleanup once when the server starts.
      */
      cleanupExpiredOrders();

      /*
        Run cleanup every minute.

        This means an abandoned order will normally be
        cleaned up within approximately 15–16 minutes.
      */
      setInterval(
        cleanupExpiredOrders,
        60 * 1000
      );
    });
  } catch (error) {
    console.error(
      "❌ Database connection failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();