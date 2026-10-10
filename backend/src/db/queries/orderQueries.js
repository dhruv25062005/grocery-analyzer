const pool = require("../connection");

async function getProductsForOrder(client, productIds) {
  const result = await client.query(
    `
    SELECT
      id,
      barcode,
      name,
      price,
      stock
    FROM products
    WHERE id = ANY($1::int[])
    FOR UPDATE
    `,
    [productIds]
  );

  return result.rows;
}

async function createOrder(client, orderData) {
  const result = await client.query(
    `
    INSERT INTO orders (
      order_number,
      session_id,
      subtotal,
      discount,
      tax,
      total,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      orderData.orderNumber,
      orderData.sessionId,
      orderData.subtotal,
      orderData.discount,
      orderData.tax,
      orderData.total,
      orderData.status,
    ]
  );

  return result.rows[0];
}

async function createOrderItem(client, item) {
  const result = await client.query(
    `
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      subtotal
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      item.orderId,
      item.productId,
      item.quantity,
      item.unitPrice,
      item.subtotal,
    ]
  );

  return result.rows[0];
}

async function getOrderDetails(orderId) {
  const orderResult = await pool.query(
    `
    SELECT
      id,
      order_number,
      session_id,
      subtotal,
      discount,
      tax,
      total,
      status,
      created_at,
      updated_at
    FROM orders
    WHERE id = $1
    `,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    return null;
  }

  const order = orderResult.rows[0];

  const itemsResult = await pool.query(
    `
    SELECT
      oi.id,
      oi.product_id,
      oi.quantity,
      oi.unit_price,
      oi.subtotal,
      p.name,
      p.barcode,
      p.brand
    FROM order_items oi
    JOIN products p
      ON p.id = oi.product_id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
    `,
    [orderId]
  );

  return {
    ...order,
    items: itemsResult.rows,
  };
}

async function getAllOrders() {
  const result = await pool.query(
    `
    SELECT
      o.id,
      o.order_number,
      o.session_id,
      o.subtotal,
      o.discount,
      o.tax,
      o.total,
      o.status,
      o.created_at,
      o.updated_at,

      COALESCE(
        SUM(oi.quantity),
        0
      ) AS total_items

    FROM orders o

    LEFT JOIN order_items oi
      ON oi.order_id = o.id

    GROUP BY
      o.id,
      o.order_number,
      o.session_id,
      o.subtotal,
      o.discount,
      o.tax,
      o.total,
      o.status,
      o.created_at,
      o.updated_at

    ORDER BY o.created_at DESC
    `
  );

  return result.rows;
}

module.exports = {
  getProductsForOrder,
  createOrder,
  createOrderItem,
  getOrderDetails,
  getAllOrders,
};