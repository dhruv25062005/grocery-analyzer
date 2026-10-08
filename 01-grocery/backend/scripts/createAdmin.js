const bcrypt = require("bcryptjs");
const pool = require("../src/db/connection");

async function createAdmin() {
  const name = "SmartCart Admin";
  const email = "admin@smartcart.com";
  const password = "Admin@123";

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO admins (name, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash
      RETURNING id, name, email
      `,
      [name, email, passwordHash]
    );

    console.log("✅ Admin account created/updated:");
    console.log(result.rows[0]);
    console.log("");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
  } catch (error) {
    console.error("❌ Failed to create admin:", error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();