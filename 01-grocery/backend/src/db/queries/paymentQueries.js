const pool = require("../connection");

async function getAllPayments() {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.order_id,
      o.order_number,
      p.payment_reference,
      p.amount,
      p.method,
      p.status,
      p.paid_at,
      p.created_at
    FROM payments p
    LEFT JOIN orders o
      ON o.id = p.order_id
    ORDER BY p.created_at DESC
    `
  );

  return result.rows;
}

module.exports = {
  getAllPayments,
};