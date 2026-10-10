const pool = require("../connection");

async function getTopSellingProducts() {
  const result = await pool.query(`
    SELECT
      p.id,
      p.name,
      p.category,
      p.brand,
      SUM(oi.quantity) AS units_sold,
      SUM(oi.subtotal) AS revenue
    FROM order_items oi
    INNER JOIN orders o
      ON o.id = oi.order_id
    INNER JOIN products p
      ON p.id = oi.product_id
    WHERE o.status = 'paid'
    GROUP BY
      p.id,
      p.name,
      p.category,
      p.brand
    ORDER BY
      units_sold DESC,
      revenue DESC
    LIMIT 10
  `);

  return result.rows;
}

module.exports = {
  getTopSellingProducts,
};