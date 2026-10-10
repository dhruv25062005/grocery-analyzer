const pool = require("../db/connection");

const {
  getProductsForOrder,
  createOrder,
  createOrderItem,
  getOrderDetails,
  getAllOrders,
} = require("../db/queries/orderQueries");

async function createNewOrder(req, res) {
  const { items, sessionId = null } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart cannot be empty",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
      Convert product IDs to numbers and validate them.
    */
    const productIds = items.map((item) => Number(item.productId));

    if (
      productIds.some(
        (id) => !Number.isInteger(id) || id <= 0
      )
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    /*
      Prevent duplicate products in one order.

      Example of invalid request:

      [
        { productId: 10, quantity: 2 },
        { productId: 10, quantity: 3 }
      ]

      The same product must appear only once.
    */
    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Duplicate products are not allowed in the order",
      });
    }

    /*
      Fetch products from the database.

      Prices and stock are always taken from the database.
      The frontend cannot control the final price.
    */
    const products = await getProductsForOrder(
      client,
      productIds
    );
    
    if (products.length !== productIds.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "One or more products were not found",
      });
    }

    let subtotal = 0;

    const orderItems = [];

    /*
      Validate every cart item.
    */
    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      /*
        Validate quantity.
      */
      if (!Number.isInteger(quantity) || quantity <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
        });
      }

      const product = products.find(
        (p) => p.id === productId
      );

      /*
        This should normally never happen because we already
        verified that all products exist.
      */
      if (!product) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      /*
        Check current stock.
      */
      if (Number(product.stock) < quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `${product.name} has only ${product.stock} item(s) in stock`,
        });
      }

      /*
        IMPORTANT:
        Price comes from PostgreSQL, not the frontend.
      */
      const unitPrice = Number(product.price);

      const itemSubtotal = unitPrice * quantity;

      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    /*
      Current pricing rules.

      These can later be replaced with proper
      discount and tax calculations.
    */
    const discount = 0;
    const tax = 0;
    const total = subtotal;

    /*
      Generate a unique SmartCart order number.
    */
    const orderNumber = `SC-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    /*
      Create the order.
    */
    const order = await createOrder(client, {
      orderNumber,
      sessionId,
      subtotal,
      discount,
      tax,
      total,
      status: "pending",
    });

    /*
      Create order items.
    */
    for (const item of orderItems) {
      await createOrderItem(client, {
        orderId: order.id,
        ...item,
      });
    }

    /*
      Commit the complete order transaction.
    */
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order created successfully",

      order: {
        id: order.id,
        orderNumber: order.order_number,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        status: order.status,
      },
    });
  } catch (error) {
    /*
      Roll back everything if any database operation fails.
    */
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Order rollback error:",
        rollbackError.message
      );
    }

    console.error("Order creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  } finally {
    client.release();
  }
}

async function getOrderById(req, res) {
  try {
    const { orderId } = req.params;

    if (!Number.isInteger(Number(orderId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await getOrderDetails(
      Number(orderId)
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve order",
    });
  }
}

async function getAllOrdersController(req, res) {
  try {
    const orders = await getAllOrders();

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load orders",
    });
  }
}

module.exports = {
  createNewOrder,
  getOrderById,
  getAllOrdersController,
};