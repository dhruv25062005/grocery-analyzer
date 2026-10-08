const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const pool = require("../src/db/connection");

const csvFilePath = path.join(
  __dirname,
  "../../dataset/grocery_products_dataset.csv"
);

async function importProducts() {
  const products = [];

  console.log("📦 Reading grocery dataset...");

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {
      products.push(row);
    })
    .on("end", async () => {
      console.log(`📊 Found ${products.length} products`);

      try {
        for (const product of products) {
          await pool.query(
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
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12
            )
            ON CONFLICT (barcode) DO NOTHING
            `,
            [
              String(product.Barcode_EAN13).trim(),
              product.Product_Name?.trim(),
              product.Category?.trim() || null,
              product.Brand?.trim() || null,
              Number(product.Price_INR) || 0,
              Number(product.MRP) || 0,
              product.Quantity?.trim() || null,
              Number(product.Stock_Quantity) || 0,
              product.Manufacturer?.trim() || null,
              product.Supplier?.trim() || null,
              product.Expiry_Date || null,
              product.Manufacture_Date || null,
            ]
          );
        }

        console.log("✅ Products imported successfully!");

        const result = await pool.query(
          "SELECT COUNT(*) FROM products"
        );

        console.log(
          `🛒 Products currently in database: ${result.rows[0].count}`
        );

        await pool.end();
      } catch (error) {
        console.error("❌ Import failed:", error.message);
        await pool.end();
        process.exit(1);
      }
    })
    .on("error", async (error) => {
      console.error("❌ CSV reading failed:", error.message);
      await pool.end();
      process.exit(1);
    });
}

importProducts();