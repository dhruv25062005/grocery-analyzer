const pool = require("../connection");

async function getDailySales() {
  const result = await pool.query(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS orders,
      COALESCE(SUM(total), 0) AS revenue
    FROM orders
    WHERE status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `);

  return result.rows;
}

module.exports = {
  getDailySales,
};