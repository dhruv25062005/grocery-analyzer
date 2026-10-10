const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "smartcart_jwt_secret_key_2026";
}

// In-memory data store for AI Studio environment
const state = {
  products: [],
  orders: [],
  order_items: [],
  payments: [],
  admins: [],
  nextProductId: 1,
  nextOrderId: 1,
  nextOrderItemId: 1,
  nextPaymentId: 1,
  nextAdminId: 1,
};

// Seed admin
const defaultPasswordHash = bcrypt.hashSync("Admin@123", 10);
state.admins.push({
  id: state.nextAdminId++,
  name: "SmartCart Admin",
  email: "admin@smartcart.com",
  password_hash: defaultPasswordHash,
});

// Load products from CSV
try {
  const csvPath = path.resolve(__dirname, "../../../dataset/grocery_products_dataset.csv");
  if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const headers = lines[0].split(",").map((h) => h.trim());

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = [];
      let current = "";
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      const id = state.nextProductId++;
      state.products.push({
        id,
        barcode: String(row.Barcode_EAN13 || `8900000000${String(id).padStart(3, "0")}`).trim(),
        name: row.Product_Name?.trim() || `Product ${id}`,
        category: row.Category?.trim() || "General",
        brand: row.Brand?.trim() || "Generic",
        price: Number(row.Price_INR) || 99,
        mrp: Number(row.MRP) || Number(row.Price_INR) || 120,
        quantity: row.Quantity?.trim() || "1 unit",
        stock: Number(row.Stock_Quantity) || 50,
        manufacturer: row.Manufacturer?.trim() || "Manufacturer",
        supplier: row.Supplier?.trim() || "Supplier",
        expiry_date: row.Expiry_Date || null,
        manufacture_date: row.Manufacture_Date || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    console.log(`🛒 In-memory database seeded with ${state.products.length} products`);
  }
} catch (err) {
  console.warn("Could not load products CSV:", err.message);
}

// Fallback products if CSV was not loaded
if (state.products.length === 0) {
  state.products.push(
    {
      id: state.nextProductId++,
      barcode: "8900000000001",
      name: "Rusks - Hennessy 1L",
      category: "Soft Drinks",
      brand: "Bisleri",
      price: 259,
      mrp: 310,
      quantity: "2L",
      stock: 159,
      manufacturer: "Mfg_0",
      supplier: "Supplier_H",
      expiry_date: "2025-06-01",
      manufacture_date: "2024-01-01",
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: state.nextProductId++,
      barcode: "8900000000002",
      name: "Noodles - Sprite 2kg",
      category: "Hair Care",
      brand: "Mondelēz",
      price: 683,
      mrp: 819,
      quantity: "400g",
      stock: 168,
      manufacturer: "Mfg_1",
      supplier: "Supplier_C",
      expiry_date: "2025-06-02",
      manufacture_date: "2024-01-02",
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  );
}

async function handleQuery(sqlText, params = []) {
  const sql = sqlText.trim().replace(/\s+/g, " ");

  // Transactions
  if (/^BEGIN/i.test(sql) || /^COMMIT/i.test(sql) || /^ROLLBACK/i.test(sql)) {
    return { rows: [] };
  }

  // Ping
  if (/^SELECT\s+1/i.test(sql)) {
    return { rows: [{ "?column?": 1 }] };
  }

  // Dashboard stats query:
  if (/total_products/i.test(sql) && /today_orders/i.test(sql)) {
    const today = new Date().toISOString().split("T")[0];
    const total_products = state.products.filter((p) => p.is_active).length;
    const today_orders = state.orders.filter(
      (o) => new Date(o.created_at).toISOString().split("T")[0] === today
    ).length;
    const today_revenue = state.orders
      .filter(
        (o) =>
          o.status === "paid" &&
          new Date(o.created_at).toISOString().split("T")[0] === today
      )
      .reduce((s, o) => s + Number(o.total || 0), 0);
    const low_stock = state.products.filter((p) => p.is_active && p.stock <= 10).length;

    return {
      rows: [
        {
          total_products,
          today_orders,
          today_revenue,
          low_stock,
        },
      ],
    };
  }

  // Report summary query:
  if (/total_paid_payments/i.test(sql) && /pending_payments/i.test(sql)) {
    const total_orders = state.orders.length;
    const total_paid_payments = state.payments.filter((p) => p.status === "paid").length;
    const total_revenue = state.payments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const pending_payments = state.payments.filter((p) => p.status === "pending").length;
    const total_products = state.products.filter((p) => p.is_active).length;
    const low_stock_products = state.products.filter((p) => p.is_active && p.stock <= 10).length;

    return {
      rows: [
        {
          total_orders,
          total_paid_payments,
          total_revenue,
          pending_payments,
          total_products,
          low_stock_products,
        },
      ],
    };
  }

  // Daily sales query:
  if (/DATE\(created_at\)\s+AS\s+date/i.test(sql)) {
    const salesByDate = {};
    for (const o of state.orders) {
      if (o.status !== "paid") continue;
      const date = new Date(o.created_at).toISOString().split("T")[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, orders: 0, revenue: 0 };
      }
      salesByDate[date].orders += 1;
      salesByDate[date].revenue += Number(o.total || 0);
    }
    const rows = Object.values(salesByDate).sort((a, b) => a.date.localeCompare(b.date));
    return { rows };
  }

  // Top products query:
  if (/units_sold/i.test(sql) && /FROM\s+order_items\s+oi/i.test(sql)) {
    const prodMap = {};
    for (const oi of state.order_items) {
      const order = state.orders.find((o) => o.id === oi.order_id);
      if (!order || order.status !== "paid") continue;

      const pid = oi.product_id;
      if (!prodMap[pid]) {
        const p = state.products.find((prod) => prod.id === pid) || {};
        prodMap[pid] = {
          id: pid,
          name: p.name || "",
          category: p.category || "",
          brand: p.brand || "",
          units_sold: 0,
          revenue: 0,
        };
      }
      prodMap[pid].units_sold += Number(oi.quantity || 0);
      prodMap[pid].revenue += Number(oi.subtotal || 0);
    }
    const rows = Object.values(prodMap)
      .sort((a, b) => b.units_sold - a.units_sold || b.revenue - a.revenue)
      .slice(0, 10);
    return { rows };
  }

  // Admin login query: SELECT id, name, email, password_hash FROM admins WHERE email = $1
  if (/FROM\s+admins\s+WHERE\s+email\s*=/i.test(sql)) {
    const email = String(params[0] || "").toLowerCase().trim();
    const admin = state.admins.find((a) => a.email.toLowerCase() === email);
    return { rows: admin ? [admin] : [] };
  }

  // Products by barcode: SELECT ... FROM products WHERE barcode = $1 AND is_active = TRUE
  if (/FROM\s+products\s+WHERE\s+barcode\s*=/i.test(sql)) {
    const barcode = String(params[0] || "").trim();
    const product = state.products.find(
      (p) => String(p.barcode) === barcode && p.is_active === true
    );
    return { rows: product ? [{ ...product }] : [] };
  }

  // Inventory products: SELECT ... FROM products WHERE is_active = TRUE ORDER BY stock ASC, name ASC
  if (/FROM\s+products\s+WHERE\s+is_active\s*=\s*TRUE\s+ORDER\s+BY\s+stock/i.test(sql)) {
    const list = state.products
      .filter((p) => p.is_active === true)
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));
    return { rows: list.map((p) => ({ ...p })) };
  }

  // Products for order: SELECT ... FROM products WHERE id = ANY($1...
  if (/FROM\s+products\s+WHERE\s+id\s*=\s*ANY/i.test(sql)) {
    const ids = Array.isArray(params[0]) ? params[0].map(Number) : [];
    const list = state.products.filter(
      (p) => ids.includes(p.id) && p.is_active === true
    );
    return { rows: list.map((p) => ({ ...p })) };
  }

  // All products: SELECT ... FROM products WHERE is_active = TRUE ORDER BY id ASC
  if (/FROM\s+products\s+WHERE\s+is_active\s*=\s*TRUE/i.test(sql)) {
    const list = state.products
      .filter((p) => p.is_active === true)
      .sort((a, b) => a.id - b.id);
    return { rows: list.map((p) => ({ ...p })) };
  }

  // Update product stock: UPDATE products SET stock = $1, updated_at = ... WHERE id = $2
  if (/UPDATE\s+products\s+SET\s+stock\s*=\s*\$1/i.test(sql)) {
    const stock = Number(params[0]);
    const id = Number(params[1]);
    const p = state.products.find((prod) => prod.id === id && prod.is_active);
    if (p) {
      p.stock = stock;
      p.updated_at = new Date();
      return { rows: [{ ...p }] };
    }
    return { rows: [] };
  }

  // Deduct stock in verifyPayment: UPDATE products SET stock = stock - $1 ... WHERE id = $2
  if (/UPDATE\s+products\s+SET\s+stock\s*=\s*stock\s*-\s*\$1/i.test(sql)) {
    const qty = Number(params[0]);
    const id = Number(params[1]);
    const p = state.products.find((prod) => prod.id === id);
    if (p) {
      p.stock = Math.max(0, p.stock - qty);
      p.updated_at = new Date();
      return { rows: [{ ...p }] };
    }
    return { rows: [] };
  }

  // Delete product: UPDATE products SET is_active = FALSE ... WHERE id = $1
  if (/UPDATE\s+products\s+SET\s+is_active\s*=\s*FALSE/i.test(sql)) {
    const id = Number(params[0]);
    const p = state.products.find((prod) => prod.id === id);
    if (p) {
      p.is_active = false;
      p.updated_at = new Date();
      return { rows: [{ id: p.id }] };
    }
    return { rows: [] };
  }

  // Update full product: UPDATE products SET barcode = $1, name = $2 ... WHERE id = $13
  if (/UPDATE\s+products\s+SET\s+barcode\s*=/i.test(sql)) {
    const id = Number(params[12]);
    const p = state.products.find((prod) => prod.id === id);
    if (p) {
      p.barcode = String(params[0]);
      p.name = params[1];
      p.category = params[2];
      p.brand = params[3];
      p.price = Number(params[4]);
      p.mrp = Number(params[5]);
      p.quantity = params[6];
      p.stock = Number(params[7]);
      p.manufacturer = params[8];
      p.supplier = params[9];
      p.expiry_date = params[10] || null;
      p.manufacture_date = params[11] || null;
      p.updated_at = new Date();
      return { rows: [{ ...p }] };
    }
    return { rows: [] };
  }

  // Insert product: INSERT INTO products ...
  if (/INSERT\s+INTO\s+products/i.test(sql)) {
    const id = state.nextProductId++;
    const newProd = {
      id,
      barcode: String(params[0]),
      name: params[1],
      category: params[2],
      brand: params[3],
      price: Number(params[4]),
      mrp: Number(params[5]),
      quantity: params[6],
      stock: Number(params[7]),
      manufacturer: params[8],
      supplier: params[9],
      expiry_date: params[10] || null,
      manufacture_date: params[11] || null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    state.products.push(newProd);
    return { rows: [{ ...newProd }] };
  }

  // Insert order: INSERT INTO orders ...
  if (/INSERT\s+INTO\s+orders/i.test(sql)) {
    const id = state.nextOrderId++;
    const newOrder = {
      id,
      order_number: params[0],
      session_id: params[1] || null,
      subtotal: Number(params[2]),
      discount: Number(params[3]),
      tax: Number(params[4]),
      total: Number(params[5]),
      status: params[6] || "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };
    state.orders.push(newOrder);
    return { rows: [{ ...newOrder }] };
  }

  // Insert order_item: INSERT INTO order_items ...
  if (/INSERT\s+INTO\s+order_items/i.test(sql)) {
    const id = state.nextOrderItemId++;
    const newItem = {
      id,
      order_id: Number(params[0]),
      product_id: Number(params[1]),
      quantity: Number(params[2]),
      unit_price: Number(params[3]),
      subtotal: Number(params[4]),
    };
    state.order_items.push(newItem);
    return { rows: [{ ...newItem }] };
  }

  // Order details: SELECT ... FROM orders WHERE id = $1
  if (/FROM\s+orders\s+WHERE\s+(o\.)?id\s*=\s*\$1/i.test(sql)) {
    const id = Number(params[0]);
    const o = state.orders.find((ord) => ord.id === id);
    return { rows: o ? [{ ...o }] : [] };
  }

  // Order items query: SELECT oi.id ... FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1
  if (/FROM\s+order_items\s+oi\s+(JOIN|INNER JOIN)\s+products\s+p/i.test(sql)) {
    const orderId = Number(params[0]);
    const items = state.order_items
      .filter((oi) => oi.order_id === orderId)
      .map((oi) => {
        const prod = state.products.find((p) => p.id === oi.product_id) || {};
        return {
          id: oi.id,
          product_id: oi.product_id,
          quantity: oi.quantity,
          unit_price: oi.unit_price,
          subtotal: oi.subtotal,
          name: prod.name || "",
          barcode: prod.barcode || "",
          brand: prod.brand || "",
          stock: prod.stock || 0,
        };
      });
    return { rows: items };
  }

  // All orders: SELECT o.id ... FROM orders o LEFT JOIN order_items oi ...
  if (/FROM\s+orders\s+o\s+LEFT\s+JOIN\s+order_items\s+oi/i.test(sql)) {
    const list = state.orders.map((o) => {
      const total_items = state.order_items
        .filter((oi) => oi.order_id === o.id)
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      return {
        ...o,
        total_items,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { rows: list };
  }

  // Insert payment: INSERT INTO payments ...
  if (/INSERT\s+INTO\s+payments/i.test(sql)) {
    const id = state.nextPaymentId++;
    const newPayment = {
      id,
      order_id: Number(params[0]),
      payment_reference: params[1],
      amount: Number(params[2]),
      method: params[3],
      status: params[4] || "pending",
      paid_at: null,
      created_at: new Date(),
    };
    state.payments.push(newPayment);
    return { rows: [{ ...newPayment }] };
  }

  // Payment by id: SELECT ... FROM payments WHERE id = $1
  if (/FROM\s+payments\s+WHERE\s+id\s*=\s*\$1/i.test(sql)) {
    const id = Number(params[0]);
    const p = state.payments.find((pay) => pay.id === id);
    return { rows: p ? [{ ...p }] : [] };
  }

  // Existing pending payment for order: WHERE order_id = $1 AND status = 'pending'
  if (/FROM\s+payments\s+WHERE\s+order_id\s*=\s*\$1\s+AND\s+status\s*=\s*'pending'/i.test(sql)) {
    const orderId = Number(params[0]);
    const p = state.payments
      .filter((pay) => pay.order_id === orderId && pay.status === "pending")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return { rows: p ? [{ ...p }] : [] };
  }

  // Mark payment paid: UPDATE payments SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = $1
  if (/UPDATE\s+payments\s+SET\s+status\s*=\s*'paid'/i.test(sql)) {
    const id = Number(params[0]);
    const p = state.payments.find((pay) => pay.id === id);
    if (p) {
      p.status = "paid";
      p.paid_at = new Date();
      return { rows: [{ ...p }] };
    }
    return { rows: [] };
  }

  // Mark order paid: UPDATE orders SET status = 'paid' ... WHERE id = $1
  if (/UPDATE\s+orders\s+SET\s+status\s*=\s*'paid'/i.test(sql)) {
    const id = Number(params[0]);
    const o = state.orders.find((ord) => ord.id === id);
    if (o) {
      o.status = "paid";
      o.updated_at = new Date();
      return { rows: [{ ...o }] };
    }
    return { rows: [] };
  }

  // All payments list: SELECT p.id, p.order_id, o.order_number ... FROM payments p LEFT JOIN orders o ON o.id = p.order_id
  if (/FROM\s+payments\s+p\s+LEFT\s+JOIN\s+orders\s+o/i.test(sql)) {
    const list = state.payments.map((p) => {
      const o = state.orders.find((ord) => ord.id === p.order_id) || {};
      return {
        ...p,
        order_number: o.order_number || null,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { rows: list };
  }

  // Expired order cleanup:
  if (/UPDATE\s+payments\s+SET\s+status\s*=\s*'expired'/i.test(sql)) {
    return { rows: [] };
  }
  if (/UPDATE\s+orders\s+o\s+SET\s+status\s*=\s*'expired'/i.test(sql)) {
    return { rows: [] };
  }

  // Default fallback
  console.log("[DB Mock] Unhandled query:", sql);
  return { rows: [] };
}

// Client mock that mimics pg Client
class MockClient {
  async query(sql, params) {
    return handleQuery(sql, params);
  }
  release() {}
}

const mockPool = {
  async query(sql, params) {
    return handleQuery(sql, params);
  },
  async connect() {
    return new MockClient();
  },
  on(event, handler) {
    if (event === "connect") {
      setTimeout(() => handler(), 10);
    }
    return this;
  },
  async end() {
    return Promise.resolve();
  },
};

module.exports = mockPool;