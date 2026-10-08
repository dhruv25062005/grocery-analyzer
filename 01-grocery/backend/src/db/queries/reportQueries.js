const pool = require("../connection");

async function getReportSummary() {
  const result = await pool.query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM orders
      ) AS total_orders,

      (
        SELECT COUNT(*)
        FROM payments
        WHERE status = 'paid'
      ) AS total_paid_payments,

      (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE status = 'paid'
      ) AS total_revenue,

      (
        SELECT COUNT(*)
        FROM payments
        WHERE status = 'pending'
      ) AS pending_payments,

      (
        SELECT COUNT(*)
        FROM products
        WHERE is_active = TRUE
      ) AS total_products,

      (
        SELECT COUNT(*)
        FROM products
        WHERE is_active = TRUE
          AND stock <= 10
      ) AS low_stock_products
  `);

  return result.rows[0];
}

module.exports = {
  getReportSummary,
};