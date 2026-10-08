const pool = require("../connection");

async function getProductByBarcode(barcode) {
  const result = await pool.query(
    `
    SELECT
      id,
      barcode,
      name,
      category,
      brand,
      price,
      mrp,
      quantity,
      stock,
      manufacturer,
      supplier,
      expiry_date,
      manufacture_date
    FROM products
    WHERE barcode = $1
      AND is_active = TRUE
    `,
    [barcode]
  );

  return result.rows[0];
}

async function getAllProducts() {
  const result = await pool.query(
    `
    SELECT
      id,
      barcode,
      name,
      category,
      brand,
      price,
      mrp,
      quantity,
      stock,
      manufacturer,
      supplier,
      expiry_date,
      manufacture_date
    FROM products
    WHERE is_active = TRUE
    ORDER BY id ASC
    `
  );

  return result.rows;
}

async function getInventoryProducts() {
  const result = await pool.query(
    `
    SELECT
      id,
      barcode,
      name,
      category,
      brand,
      price,
      stock,
      quantity,
      is_active
    FROM products
    WHERE is_active = TRUE
    ORDER BY stock ASC, name ASC
    `
  );

  return result.rows;
}

async function updateProductStock(productId, stock) {
  const result = await pool.query(
    `
    UPDATE products
    SET
      stock = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND is_active = TRUE
    RETURNING
      id,
      barcode,
      name,
      category,
      brand,
      price,
      stock,
      quantity,
      is_active
    `,
    [stock, productId]
  );

  return result.rows[0];
}

async function createProduct(product) {
  const result = await pool.query(
    `
    INSERT INTO products (
      barcode,
      name,
      category,
      brand,
      price,
      mrp,
      quantity,
      stock,
      manufacturer,
      supplier,
      expiry_date,
      manufacture_date
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12
    )
    RETURNING
      id,
      barcode,
      name,
      category,
      brand,
      price,
      mrp,
      quantity,
      stock,
      manufacturer,
      supplier,
      expiry_date,
      manufacture_date
    `,
    [
      product.barcode,
      product.name,
      product.category,
      product.brand,
      product.price,
      product.mrp,
      product.quantity,
      product.stock,
      product.manufacturer,
      product.supplier,
      product.expiryDate || null,
      product.manufactureDate || null,
    ]
  );

  return result.rows[0];
}

async function updateProduct(productId, product) {
  const result = await pool.query(
    `
    UPDATE products
    SET
      barcode = $1,
      name = $2,
      category = $3,
      brand = $4,
      price = $5,
      mrp = $6,
      quantity = $7,
      stock = $8,
      manufacturer = $9,
      supplier = $10,
      expiry_date = $11,
      manufacture_date = $12,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $13
    RETURNING
      id,
      barcode,
      name,
      category,
      brand,
      price,
      mrp,
      quantity,
      stock,
      manufacturer,
      supplier,
      expiry_date,
      manufacture_date
    `,
    [
      product.barcode,
      product.name,
      product.category,
      product.brand,
      product.price,
      product.mrp,
      product.quantity,
      product.stock,
      product.manufacturer,
      product.supplier,
      product.expiryDate || null,
      product.manufactureDate || null,
      productId,
    ]
  );

  return result.rows[0];
}

async function deleteProduct(productId) {
  const result = await pool.query(
    `
    UPDATE products
    SET
      is_active = FALSE,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND is_active = TRUE
    RETURNING id
    `,
    [productId]
  );

  return result.rows[0];
}

module.exports = {
  getProductByBarcode,
  getAllProducts,
  getInventoryProducts,
  updateProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
};