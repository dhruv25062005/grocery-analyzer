import { useEffect, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { apiRequest } from "../../services/api";

import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

const emptyForm = {
  name: "",
  barcode: "",
  category: "",
  brand: "",
  quantity: "",
  price: "",
  mrp: "",
  stock: "",
  manufacturer: "",
  supplier: "",
  manufactureDate: "",
  expiryDate: "",
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);

  const [formData, setFormData] = useState({
    ...emptyForm,
  });

  const [editingProductId, setEditingProductId] = useState(null);

  const [addingProduct, setAddingProduct] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  const [formError, setFormError] = useState("");

  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/products");

        setProducts(data.products || []);
      } catch (err) {
        console.error("Products error:", err);

        setError(
          err.message ||
            "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredProducts = products.filter((product) => {
    const searchTerm = search
      .toLowerCase()
      .trim();

    if (!searchTerm) {
      return true;
    }

    return (
      product.name
        ?.toLowerCase()
        .includes(searchTerm) ||
      product.barcode
        ?.toLowerCase()
        .includes(searchTerm) ||
      product.brand
        ?.toLowerCase()
        .includes(searchTerm) ||
      product.category
        ?.toLowerCase()
        .includes(searchTerm)
    );
  });

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setFormData({
      ...emptyForm,
    });

    setFormError("");
    setEditingProductId(null);
  };

  // =========================================================
  // ADD PRODUCT
  // =========================================================

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      setAddingProduct(true);
      setFormError("");

      const data = await createProduct(formData);

      setProducts((current) => [
        data.product,
        ...current,
      ]);

      resetForm();
      setShowAddProduct(false);
    } catch (err) {
      console.error(
        "Add product error:",
        err
      );

      setFormError(
        err.message ||
          "Failed to add product."
      );
    } finally {
      setAddingProduct(false);
    }
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const handleEditClick = (product) => {
    setEditingProductId(product.id);

    setFormData({
      name: product.name || "",
      barcode: product.barcode || "",
      category: product.category || "",
      brand: product.brand || "",
      quantity: product.quantity || "",
      price: product.price ?? "",
      mrp: product.mrp ?? "",
      stock: product.stock ?? "",
      manufacturer:
        product.manufacturer || "",
      supplier: product.supplier || "",
      manufactureDate:
        product.manufacture_date
          ? String(
              product.manufacture_date
            ).slice(0, 10)
          : "",
      expiryDate:
        product.expiry_date
          ? String(
              product.expiry_date
            ).slice(0, 10)
          : "",
    });

    setFormError("");
    setShowEditProduct(true);
  };

  // =========================================================
  // UPDATE PRODUCT
  // =========================================================

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!editingProductId) {
      return;
    }

    try {
      setUpdatingProduct(true);
      setFormError("");

      const data = await updateProduct(
        editingProductId,
        formData
      );

      setProducts((current) =>
        current.map((product) =>
          product.id === editingProductId
            ? data.product
            : product
        )
      );

      resetForm();
      setShowEditProduct(false);
    } catch (err) {
      console.error(
        "Update product error:",
        err
      );

      setFormError(
        err.message ||
          "Failed to update product."
      );
    } finally {
      setUpdatingProduct(false);
    }
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDeleteProduct = async (
    product
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(product.id);

      setProducts((current) =>
        current.filter(
          (item) => item.id !== product.id
        )
      );
    } catch (err) {
      console.error(
        "Delete product error:",
        err
      );

      alert(
        err.message ||
          "Failed to delete product."
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-58px)] bg-slate-50">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:p-8">
        <div className="mx-auto max-w-7xl">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Products
          </h1>

          <p className="mt-2 text-slate-500">
            View and manage products available
            in SmartCart.
          </p>
        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">
              ⏳
            </div>

            <p className="mt-3 font-medium text-slate-700">
              Loading products...
            </p>
          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Failed to load products
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        )}

        {/* =====================================================
            PRODUCTS
        ===================================================== */}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Toolbar */}

            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="font-bold text-slate-900">
                  Product Inventory
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Showing{" "}
                  {filteredProducts.length}{" "}
                  of {products.length} products
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">

                {/* Search */}

                <div className="relative w-full sm:w-80">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search products..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </div>

                {/* Add Product */}

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddProduct(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <span className="text-lg">
                    +
                  </span>

                  Add Product
                </button>
              </div>
            </div>

            {/* TABLE */}

            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl">
                  🔎
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  No products found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try searching with a different
                  name, barcode, brand or
                  category.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full  text-left">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Product
                      </th>

                      <th className="px-6 py-4">
                        Barcode
                      </th>

                      <th className="px-6 py-4">
                        Category
                      </th>

                      <th className="px-6 py-4">
                        Price
                      </th>

                      <th className="px-6 py-4">
                        MRP
                      </th>

                      <th className="px-6 py-4">
                        Stock
                      </th>

                      <th className="px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredProducts.map(
                      (product) => (
                        <tr
                          key={product.id}
                          className="transition hover:bg-slate-50"
                        >

                          {/* Product */}

                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {product.brand ||
                                  "No brand"}
                              </p>
                            </div>
                          </td>

                          {/* Barcode */}

                          <td className="px-6 py-4 font-mono text-sm text-slate-600">
                            {product.barcode}
                          </td>

                          {/* Category */}

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {product.category ||
                              "N/A"}
                          </td>

                          {/* Price */}

                          <td className="px-6 py-4 font-semibold text-slate-900">
                            ₹
                            {Number(
                              product.price
                            ).toFixed(2)}
                          </td>

                          {/* MRP */}

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {product.mrp
                              ? `₹${Number(
                                  product.mrp
                                ).toFixed(2)}`
                              : "N/A"}
                          </td>

                          {/* Stock */}

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                product.stock >
                                10
                                  ? "bg-green-100 text-green-700"
                                  : product.stock >
                                    0
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.stock}
                            </span>
                          </td>

                          {/* Actions */}

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditClick(
                                    product
                                  )
                                }
                                className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteProduct(
                                    product
                                  )
                                }
                                className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Delete
                              </button>

                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                </table>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            ADD PRODUCT MODAL
        ===================================================== */}

        {showAddProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* Header */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Add New Product
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Scan the barcode or enter it
                    manually, then add the
                    product details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    resetForm();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>

              <ProductForm
                formData={formData}
                handleFormChange={
                  handleFormChange
                }
                formError={formError}
                onSubmit={handleAddProduct}
                onCancel={() => {
                  setShowAddProduct(false);
                  resetForm();
                }}
                submitting={addingProduct}
                submitText={
                  addingProduct
                    ? "Adding Product..."
                    : "Add Product"
                }
                enableBarcodeScanner={true}
              />

            </div>
          </div>
        )}

        {/* =====================================================
            EDIT PRODUCT MODAL
        ===================================================== */}

        {showEditProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* Header */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Edit Product
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update product information
                    and inventory.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEditProduct(false);
                    resetForm();
                  }}
                  disabled={updatingProduct}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <ProductForm
                formData={formData}
                handleFormChange={
                  handleFormChange
                }
                formError={formError}
                onSubmit={handleUpdateProduct}
                onCancel={() => {
                  setShowEditProduct(false);
                  resetForm();
                }}
                submitting={updatingProduct}
                submitText={
                  updatingProduct
                    ? "Saving Changes..."
                    : "Save Changes"
                }
                enableBarcodeScanner={false}
              />

            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

// =========================================================
// BARCODE CAMERA SCANNER
// =========================================================

const ProductBarcodeScanner = ({
  onBarcodeDetected,
  disabled = false,
}) => {
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const [scannerId] = useState(
    () => `admin-barcode-reader-${Math.random().toString(36).slice(2)}`
  );

  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [detectedBarcode, setDetectedBarcode] =
    useState("");

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }

            await scanner.clear();
          } catch (err) {
            console.error(
              "Admin scanner cleanup error:",
              err
            );
          }
        };

        cleanup();
      }
    };
  }, []);

  // =========================================================
  // STOP SCANNER
  // =========================================================

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setActive(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      await scanner.clear();
    } catch (err) {
      console.error(
        "Admin scanner stop error:",
        err
      );
    } finally {
      scannerRef.current = null;
      setActive(false);
    }
  };

  // =========================================================
  // START SCANNER
  // =========================================================

  const startScanner = async () => {
    if (disabled || active) {
      return;
    }

    try {
      setError("");
      setDetectedBarcode("");

      const scanner = new Html5Qrcode(
        scannerId
      );

      scannerRef.current = scanner;

      // Let React render the scanner container.
      setActive(true);

      // Wait for DOM element.
      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,

          qrbox: {
            width: 300,
            height: 150,
          },

          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
          ],
        },

        // Barcode detected
        async (decodedText) => {
          if (processingRef.current) {
            return;
          }

          processingRef.current = true;

          const scannedBarcode =
            decodedText.trim();

          console.log(
            "📷 Admin barcode detected:",
            scannedBarcode
          );

          setDetectedBarcode(
            scannedBarcode
          );

          /*
            IMPORTANT:
            Stop scanner BEFORE updating
            React state.
          */

          await stopScanner();

          /*
            Now safely update form.
          */

          await onBarcodeDetected(
            scannedBarcode
          );

          setTimeout(() => {
            processingRef.current = false;
          }, 500);
        },

        // Ignore normal scanning failures.
        () => {}
      );

      console.log(
        "📷 Admin camera scanner started"
      );
    } catch (err) {
      console.error(
        "Admin camera scanner error:",
        err
      );

      const scanner =
        scannerRef.current;

      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }

          await scanner.clear();
        } catch (cleanupError) {
          console.error(
            "Admin scanner cleanup error:",
            cleanupError
          );
        }
      }

      scannerRef.current = null;
      setActive(false);

      setError(
        err?.message ||
          "Unable to access the camera."
      );
    }
  };

  return (
    <div className="mt-2">

      {/* Camera Button */}

      {!active && (
        <button
          type="button"
          onClick={startScanner}
          disabled={disabled}
          className="flex items-center gap-2 rounded-xl border border-green-600 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📷 Scan Barcode
        </button>
      )}

      {/* Camera */}

      <div
        className={
          active
            ? "mt-4 overflow-hidden rounded-xl border border-green-200 bg-slate-950"
            : "hidden"
        }
      >

        <div className="flex items-center justify-between px-4 py-3 text-white">

          <div>
            <p className="font-semibold">
              Scan Product Barcode
            </p>

            <p className="text-xs text-slate-300">
              Point the camera at the barcode
            </p>
          </div>

          <span className="flex items-center gap-2 text-xs text-green-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            Scanning
          </span>
        </div>

        {/* Dedicated html5-qrcode container */}

        <div
          id={scannerId}
          className="w-full overflow-hidden"
        />

        <button
          type="button"
          onClick={stopScanner}
          className="m-4 w-[calc(100%-2rem)] rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Stop Camera
        </button>

      </div>

      {/* Detected Barcode */}

      {detectedBarcode && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">

          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Barcode Detected
          </p>

          <p className="mt-1 font-mono text-sm font-bold text-blue-900">
            {detectedBarcode}
          </p>

        </div>
      )}

      {/* Camera Error */}

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <p className="font-semibold">
            Camera Error
          </p>

          <p className="mt-1">
            {error}
          </p>

        </div>
      )}

    </div>
  );
};

// =========================================================
// REUSABLE PRODUCT FORM
// =========================================================

const ProductForm = ({
  formData,
  handleFormChange,
  formError,
  onSubmit,
  onCancel,
  submitting,
  submitText,
  enableBarcodeScanner = false,
}) => {
  const [lookupLoading, setLookupLoading] =
    useState(false);

  const [lookupMessage, setLookupMessage] =
    useState("");

  const [lookupError, setLookupError] =
    useState("");

  // =========================================================
  // FETCH BARCODE DETAILS
  // =========================================================

  const fetchBarcodeDetails = async (
    barcodeValue = formData.barcode
  ) => {
    const cleanBarcode = String(
      barcodeValue || ""
    ).trim();

    if (!cleanBarcode) {
      setLookupMessage("");
      setLookupError(
        "Enter or scan a barcode first."
      );
      return;
    }

    try {
      setLookupLoading(true);
      setLookupMessage("");
      setLookupError("");

      const data = await apiRequest(
        `/products/barcode-info/${encodeURIComponent(
          cleanBarcode
        )}`
      );

      const product = data.product;

      if (!product) {
        throw new Error(
          "No product details were returned."
        );
      }

      /*
        Only automatically fill general
        product information.

        Price, MRP, stock, supplier and
        dates remain controlled by admin.
      */

      const fieldsToFill = {
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        quantity: product.quantity || "",
        manufacturer:
          product.manufacturer || "",
      };

      Object.entries(fieldsToFill).forEach(
        ([name, value]) => {
          handleFormChange({
            target: {
              name,
              value,
            },
          });
        }
      );

      setLookupMessage(
        "Product details fetched successfully. Please verify them before saving."
      );
    } catch (err) {
      console.error(
        "Barcode product lookup error:",
        err
      );

      setLookupError(
        err.message ||
          "Product details were not found. You can enter the details manually."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  // =========================================================
  // BARCODE DETECTED
  // =========================================================

  const handleBarcodeDetected = async (
    scannedBarcode
  ) => {
    handleFormChange({
      target: {
        name: "barcode",
        value: scannedBarcode,
      },
    });

    /*
      Automatically fetch product information
      immediately after camera scan.
    */

    await fetchBarcodeDetails(
      scannedBarcode
    );
  };

  return (
    <form
      onSubmit={onSubmit}
      className="p-6"
    >

      {/* Form Error */}

      {formError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <p className="font-semibold">
            Unable to save product
          </p>

          <p className="mt-1">
            {formError}
          </p>

        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">

        {/* =================================================
            PRODUCT NAME
        ================================================= */}

        <div className="sm:col-span-2">

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Product Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            placeholder="Enter product name"
            required
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            BARCODE
        ================================================= */}

        <div className="sm:col-span-2">

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Barcode
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={(e) => {
                handleFormChange(e);
                setLookupMessage("");
                setLookupError("");
              }}
              placeholder="Scan or enter barcode"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
            />

            {/* Manual Fetch Button */}

            <button
              type="button"
              onClick={() =>
                fetchBarcodeDetails()
              }
              disabled={
                submitting ||
                lookupLoading ||
                !formData.barcode.trim()
              }
              className="shrink-0 rounded-xl border border-blue-600 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lookupLoading
                ? "Fetching..."
                : "Fetch Details"}
            </button>

          </div>

          {/* Camera Scanner */}

          {enableBarcodeScanner && (
            <ProductBarcodeScanner
              onBarcodeDetected={
                handleBarcodeDetected
              }
              disabled={
                submitting ||
                lookupLoading
              }
            />
          )}

          {/* Lookup Loading */}

          {lookupLoading && (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">

              <div className="flex items-center gap-2">
                <span className="animate-pulse">
                  🔎
                </span>

                <span className="font-medium">
                  Fetching product details from
                  barcode database...
                </span>
              </div>

            </div>
          )}

          {/* Lookup Success */}

          {lookupMessage &&
            !lookupLoading && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                <p className="font-semibold">
                  ✓ Details fetched
                </p>

                <p className="mt-1">
                  {lookupMessage}
                </p>

              </div>
            )}

          {/* Lookup Error / Not Found */}

          {lookupError &&
            !lookupLoading && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">

                <p className="font-semibold">
                  ⚠ Product details not found
                </p>

                <p className="mt-1">
                  {lookupError}
                </p>

                <p className="mt-2 text-xs">
                  You can continue by entering
                  the product information manually.
                </p>

              </div>
            )}

        </div>

        {/* =================================================
            CATEGORY
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Category
          </label>

          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleFormChange}
            placeholder="e.g. Grocery"
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            BRAND
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Brand
          </label>

          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleFormChange}
            placeholder="Enter brand"
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            QUANTITY
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Quantity / Size
          </label>

          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleFormChange}
            placeholder="e.g. 500g"
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            PRICE
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Selling Price
          </label>

          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleFormChange}
            min="0"
            step="0.01"
            placeholder="₹0.00"
            required
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            MRP
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            MRP
          </label>

          <input
            type="number"
            name="mrp"
            value={formData.mrp}
            onChange={handleFormChange}
            min="0"
            step="0.01"
            placeholder="₹0.00"
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            STOCK
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Stock
          </label>

          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleFormChange}
            min="0"
            placeholder="0"
            required
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            MANUFACTURER
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Manufacturer
          </label>

          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleFormChange}
            placeholder="Manufacturer name"
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            SUPPLIER
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Supplier
          </label>

          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleFormChange}
            placeholder="Supplier name"
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            MANUFACTURE DATE
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Manufacture Date
          </label>

          <input
            type="date"
            name="manufactureDate"
            value={formData.manufactureDate}
            onChange={handleFormChange}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

        {/* =================================================
            EXPIRY DATE
        ================================================= */}

        <div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Expiry Date
          </label>

          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleFormChange}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
          />

        </div>

      </div>

      {/* =================================================
          BUTTONS
      ================================================= */}

      <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5">

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitText}
        </button>

      </div>

    </form>
  );
};

export default Products;