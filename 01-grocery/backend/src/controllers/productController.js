const { lookupBarcode } = require("../services/barcodeLookupService");

const {
  getProductByBarcode,
  getAllProducts,
  getInventoryProducts,
  updateProductStock,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../db/queries/productQueries");


async function findProductByBarcode(req, res) {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: "Barcode is required",
      });
    }

    const product = await getProductByBarcode(barcode);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Product lookup error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to find product",
    });
  }
}

async function getAllProductsController(req, res) {
  try {
    const products = await getAllProducts();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get all products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}

async function getInventoryProductsController(req, res) {
  try {
    const products = await getInventoryProducts();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Inventory products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load inventory",
    });
  }
}

async function updateProductStockController(req, res) {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (!id || !Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (stock === undefined || stock === "") {
      return res.status(400).json({
        success: false,
        message: "Stock is required",
      });
    }

    if (
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative integer",
      });
    }

    const product = await updateProductStock(
      Number(id),
      Number(stock)
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    res.json({
      success: true,
      message: "Stock updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update stock error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update stock",
    });
  }
}

async function createNewProduct(req, res) {
  try {
    const {
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
      expiryDate,
      manufactureDate,
    } = req.body;

    if (!barcode || !name || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Barcode, name, price and stock are required",
      });
    }

    if (Number(price) < 0 || Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price and stock cannot be negative",
      });
    }

    if (mrp !== undefined && mrp !== "" && Number(mrp) < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    const product = await createProduct({
      barcode: barcode.trim(),
      name: name.trim(),
      category: category?.trim() || null,
      brand: brand?.trim() || null,
      price: Number(price),
      mrp: mrp === "" || mrp === undefined ? null : Number(mrp),
      quantity: quantity?.trim() || null,
      stock: Number(stock),
      manufacturer: manufacturer?.trim() || null,
      supplier: supplier?.trim() || null,
      expiryDate: expiryDate || null,
      manufactureDate: manufactureDate || null,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A product with this barcode already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
}

async function updateExistingProduct(req, res) {
  try {
    const { id } = req.params;

    const {
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
      expiryDate,
      manufactureDate,
    } = req.body;

    if (!id || !Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!barcode || !name || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Barcode, name, price and stock are required",
      });
    }

    if (Number(price) < 0 || Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price and stock cannot be negative",
      });
    }

    if (mrp !== undefined && mrp !== "" && Number(mrp) < 0) {
      return res.status(400).json({
        success: false,
        message: "MRP cannot be negative",
      });
    }

    const product = await updateProduct(Number(id), {
      barcode: barcode.trim(),
      name: name.trim(),
      category: category?.trim() || null,
      brand: brand?.trim() || null,
      price: Number(price),
      mrp:
        mrp === "" || mrp === undefined
          ? null
          : Number(mrp),
      quantity: quantity?.trim() || null,
      stock: Number(stock),
      manufacturer: manufacturer?.trim() || null,
      supplier: supplier?.trim() || null,
      expiryDate: expiryDate || null,
      manufactureDate: manufactureDate || null,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A product with this barcode already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
}

async function deleteExistingProduct(req, res) {
  try {
    const { id } = req.params;

    if (!id || !Number.isInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await deleteProduct(Number(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
}

async function lookupProductDetailsByBarcode(req, res) {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: "Barcode is required",
      });
    }

    const result = await lookupBarcode(barcode);

    if (!result.found) {
      return res.status(404).json({
        success: false,
        message: "Product details not found for this barcode",
        barcode: result.barcode,
      });
    }

    res.json({
      success: true,
      message: "Product details fetched successfully",
      product: result.product,
    });
  } catch (error) {
    console.error("Barcode lookup error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
    });
  }
}

module.exports = {
  findProductByBarcode,
  getAllProductsController,
  getInventoryProductsController,
  updateProductStockController,
  createNewProduct,
  updateExistingProduct,
  deleteExistingProduct,
  lookupProductDetailsByBarcode,
};