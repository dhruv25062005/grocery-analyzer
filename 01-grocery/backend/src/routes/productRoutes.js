const express = require("express");
const adminAuth = require("../middleware/adminAuth");

const {
  findProductByBarcode,
  getAllProductsController,
  getInventoryProductsController,
  updateProductStockController,
  createNewProduct,
  updateExistingProduct,
  deleteExistingProduct,
  lookupProductDetailsByBarcode,
} = require("../controllers/productController");

const router = express.Router();

/*
  ========================================
  CUSTOMER + ADMIN
  ========================================
*/

/*
  Get all active products
*/
router.get("/", getAllProductsController);

/*
  Local database barcode lookup
  Used by customers while scanning products.
*/
router.get(
  "/barcode/:barcode",
  findProductByBarcode
);


/*
  ========================================
  ADMIN ONLY
  ========================================
*/

/*
  Get inventory
*/
router.get(
  "/inventory",
  adminAuth,
  getInventoryProductsController
);

/*
  Create a new product
*/
router.post(
  "/",
  adminAuth,
  createNewProduct
);

/*
  Update product
*/
router.put(
  "/:id",
  adminAuth,
  updateExistingProduct
);

/*
  Update product stock
*/
router.patch(
  "/:id/stock",
  adminAuth,
  updateProductStockController
);

/*
  Delete product
*/
router.delete(
  "/:id",
  adminAuth,
  deleteExistingProduct
);

/*
  External barcode product details lookup
  Used by admin when adding a product.
*/
router.get(
  "/barcode-info/:barcode",
  adminAuth,
  lookupProductDetailsByBarcode
);

module.exports = router;