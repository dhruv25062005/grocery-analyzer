import { useEffect, useMemo, useState } from "react";
import {
  getInventoryProducts,
  updateProductStock,
} from "../../services/productService";


const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStockId, setUpdatingStockId] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getInventoryProducts();

        setProducts(data.products || []);
      } catch (err) {
        console.error("Inventory error:", err);

        setError(
          err.message || "Failed to load inventory."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;

    const totalStock = products.reduce(
      (total, product) =>
        total + Number(product.stock || 0),
      0
    );

    const lowStock = products.filter(
      (product) =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= 10
    ).length;

    const outOfStock = products.filter(
      (product) =>
        Number(product.stock) === 0
    ).length;

    return {
      totalProducts,
      totalStock,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
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
          .includes(searchTerm);

      const stock = Number(product.stock || 0);

      const matchesFilter =
        filter === "all" ||
        (filter === "low" &&
          stock > 0 &&
          stock <= 10) ||
        (filter === "out" && stock === 0) ||
        (filter === "healthy" && stock > 10);

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const handleStockUpdate = async (product, change) => {
    const currentStock = Number(product.stock || 0);
    const newStock = currentStock + change;

    if (newStock < 0) {
      return;
    }

    try {
      setUpdatingStockId(product.id);

      const data = await updateProductStock(
        product.id,
        newStock
      );

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                stock: data.product.stock,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Stock update error:", err);

      alert(
        err.message || "Failed to update stock."
      );
    } finally {
      setUpdatingStockId(null);
    }
  };

  const getStockStatus = (stock) => {
    const value = Number(stock || 0);

    if (value === 0) {
      return {
        label: "Out of Stock",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (value <= 10) {
      return {
        label: "Low Stock",
        className:
          "bg-orange-100 text-orange-700",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-green-100 text-green-700",
    };
  };

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Inventory
          </h1>

          <p className="mt-2 text-slate-500">
            Monitor product stock and identify inventory
            that needs attention.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">⏳</div>

            <p className="mt-3 font-medium text-slate-700">
              Loading inventory...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Failed to load inventory
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Statistics */}
            <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Total Products
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {inventoryStats.totalProducts}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Total Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {inventoryStats.totalStock}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Total units available
                </p>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-orange-700">
                  Low Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-800">
                  {inventoryStats.lowStock}
                </p>

                <p className="mt-1 text-xs text-orange-600">
                  10 units or less
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-red-700">
                  Out of Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-red-800">
                  {inventoryStats.outOfStock}
                </p>

                <p className="mt-1 text-xs text-red-600">
                  Requires restocking
                </p>
              </div>

            </div>

            {/* Inventory Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Toolbar */}
              <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-bold text-slate-900">
                    Stock Overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Showing {filteredProducts.length} of{" "}
                    {products.length} products
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">

                  {/* Search */}
                  <div className="relative w-full md:w-80">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      🔍
                    </span>

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      placeholder="Search inventory..."
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(e.target.value)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    <option value="all">
                      All Products
                    </option>

                    <option value="healthy">
                      In Stock
                    </option>

                    <option value="low">
                      Low Stock
                    </option>

                    <option value="out">
                      Out of Stock
                    </option>
                  </select>

                </div>
              </div>

              {/* Empty */}
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center">

                  <div className="text-4xl">
                    📦
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-800">
                    No inventory found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or filter.
                  </p>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[950px] text-left">

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
                          Stock
                        </th>

                        <th className="px-6 py-4">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">

                      {filteredProducts.map(
                        (product) => {
                          const status =
                            getStockStatus(
                              product.stock
                            );

                          return (
                            <tr
                              key={product.id}
                              className="transition hover:bg-slate-50"
                            >

                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {product.name}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {product.brand ||
                                      "No brand"}
                                    {product.quantity
                                      ? ` • ${product.quantity}`
                                      : ""}
                                  </p>
                                </div>
                              </td>

                              <td className="px-6 py-4 font-mono text-sm text-slate-600">
                                {product.barcode}
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600">
                                {product.category ||
                                  "N/A"}
                              </td>

                              <td className="px-6 py-4 font-semibold text-slate-900">
                                ₹
                                {Number(
                                  product.price
                                ).toFixed(2)}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStockUpdate(product, -1)
                                    }
                                    disabled={
                                      Number(product.stock) === 0 ||
                                      updatingStockId === product.id
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    −
                                  </button>

                                  <div className="min-w-[70px] text-center">
                                    <span className="text-lg font-bold text-slate-900">
                                      {product.stock}
                                    </span>

                                    <span className="ml-1 text-xs text-slate-400">
                                      units
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStockUpdate(product, 1)
                                    }
                                    disabled={
                                      updatingStockId === product.id
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    +
                                  </button>

                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>
          </>
        )}

      </div>
    </main>
  );
};

export default Inventory;