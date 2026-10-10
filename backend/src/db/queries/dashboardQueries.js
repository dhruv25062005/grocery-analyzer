const pool = require("../connection");

async function getDashboardStats() {
  const result = await pool.query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM products
        WHERE is_active = TRUE
      ) AS total_products,

      (
        SELECT COUNT(*)
        FROM orders
        WHERE created_at >= CURRENT_DATE
      ) AS today_orders,

      (
        SELECT COALESCE(SUM(total), 0)
        FROM orders
        WHERE status = 'paid'
          AND created_at >= CURRENT_DATE
      ) AS today_revenue,

      (
        SELECT COUNT(*)
        FROM products
        WHERE is_active = TRUE
          AND stock <= 10
      ) AS low_stock
  `);

  return result.rows[0];
}

module.exports = {
  getDashboardStats,
};