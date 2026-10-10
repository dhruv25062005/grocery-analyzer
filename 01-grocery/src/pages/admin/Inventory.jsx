import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import {
  getInventoryProducts,
  updateProductStock,
} from "../../services/productService";

const LOW_STOCK_LIMIT = 10;

const INITIAL_FILTERS = [
  { value: "all", label: "All products" },
  { value: "healthy", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const getStockStatus = (stock) => {
  const value = Number(stock || 0);

  if (value <= 0) {
    return {
      label: "Out of stock",
      className: "bg-red-50 text-red-700 ring-red-200",
      dotClass: "bg-red-500",
    };
  }

  if (value <= LOW_STOCK_LIMIT) {
    return {
      label: "Low stock",
      className: "bg-amber-50 text-amber-800 ring-amber-200",
      dotClass: "bg-amber-500",
    };
  }

  return {
    label: "In stock",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dotClass: "bg-emerald-500",
  };
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
    <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const InventoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m12 3 9 5-9 5-9-5 9-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M3 8v8l9 5 9-5V8M12 13v8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

const StatCard = ({ title, value, description, icon, tone, loading }) => (
  <article className="group rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <span className="h-5 w-5 [&>svg]:h-full [&>svg]:w-full">
          {icon}
        </span>
      </span>
    </div>

    {loading ? (
      <div className="mt-5 h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
    ) : (
      <p className="mt-5 text-3xl font-bold tracking-tight text-[#17231F]">
        {value}
      </p>
    )}

    <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
  </article>
);

const StockBadge = ({ stock }) => {
  const status = getStockStatus(stock);

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
      {status.label}
    </span>
  );
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStockId, setUpdatingStockId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getInventoryProducts();

      if (!data || !Array.isArray(data.products)) {
        throw new Error("The server returned an invalid inventory response.");
      }

      setProducts(data.products);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Inventory error:", err);
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (!notice) return undefined;

    const timeoutId = window.setTimeout(() => setNotice(null), 3500);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const inventoryStats = useMemo(() => {
    const totalStock = products.reduce(
      (total, product) => total + Math.max(0, Number(product.stock) || 0),
      0
    );

    const lowStock = products.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= LOW_STOCK_LIMIT;
    }).length;

    const outOfStock = products.filter(
      (product) => Number(product.stock || 0) <= 0
    ).length;

    return {
      totalProducts: products.length,
      totalStock,
      lowStock,
      outOfStock,
      healthy: products.filter(
        (product) => Number(product.stock || 0) > LOW_STOCK_LIMIT
      ).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return products.filter((product) => {
      const searchableFields = [
        product.name,
        product.barcode,
        product.brand,
        product.category,
        product.quantity,
      ];

      const matchesSearch =
        !searchTerm ||
        searchableFields.some((field) =>
          String(field ?? "").toLowerCase().includes(searchTerm)
        );

      const stock = Number(product.stock || 0);

      const matchesFilter =
        filter === "all" ||
        (filter === "healthy" && stock > LOW_STOCK_LIMIT) ||
        (filter === "low" && stock > 0 && stock <= LOW_STOCK_LIMIT) ||
        (filter === "out" && stock <= 0);

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const filterCounts = useMemo(
    () => ({
      all: products.length,
      healthy: inventoryStats.healthy,
      low: inventoryStats.lowStock,
      out: inventoryStats.outOfStock,
    }),
    [products.length, inventoryStats]
  );

  const handleStockUpdate = async (product, change) => {
    if (updatingStockId !== null) return;

    const currentStock = Math.max(0, Number(product.stock) || 0);
    const newStock = currentStock + change;

    if (!Number.isInteger(newStock) || newStock < 0) return;

    if (newStock === currentStock) return;

    setUpdatingStockId(product.id);
    setNotice(null);

    try {
      const data = await updateProductStock(product.id, newStock);

      if (!data?.product || data.product.stock == null) {
        throw new Error("The server did not confirm the stock update.");
      }

      const confirmedStock = Number(data.product.stock);

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, stock: confirmedStock }
            : item
        )
      );

      setNotice({
        type: "success",
        message: `${product.name} stock updated to ${confirmedStock} units.`,
      });
    } catch (err) {
      console.error("Stock update error:", err);

      setNotice({
        type: "error",
        message: err.message || "Failed to update stock. Please try again.",
      });
    } finally {
      setUpdatingStockId(null);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setFilter("all");
  };

  const stats = [
    {
      title: "Total products",
      value: formatNumber(inventoryStats.totalProducts),
      description: "Products in your catalogue",
      icon: <InventoryIcon />,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Total stock",
      value: formatNumber(inventoryStats.totalStock),
      description: "Units across all products",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7h16v13H4zM8 7V4h8v3M8 12h8M8 16h5" />
        </svg>
      ),
      tone: "bg-blue-50 text-blue-700",
    },
    {
      title: "Low stock",
      value: formatNumber(inventoryStats.lowStock),
      description: `Between 1 and ${LOW_STOCK_LIMIT} units`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m12 3 9 17H3L12 3Z" />
          <path d="M12 9v4m0 3h.01" />
        </svg>
      ),
      tone: "bg-amber-50 text-amber-700",
    },
    {
      title: "Out of stock",
      value: formatNumber(inventoryStats.outOfStock),
      description: "Products with no available units",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6m0-6-6 6" />
        </svg>
      ),
      tone: "bg-red-50 text-red-700",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F8F6]">
      <AdminSidebar />

      <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mx-auto max-w-7xl">
          {/* Page heading */}
          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Administration / Operations
                </p>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#17231F] sm:text-4xl">
                Inventory
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Keep track of stock levels, identify shortages, and update
                product availability.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchInventory}
              disabled={loading || updatingStockId !== null}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#153D30] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#205541] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                <path d="M20 7v5h-5M4 17v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {loading ? "Refreshing..." : "Refresh inventory"}
            </button>
          </header>

          {/* Toast notification */}
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm shadow-sm ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <span className="font-bold" aria-hidden="true">
                {notice.type === "success" ? "✓" : "!"}
              </span>
              <p className="flex-1">{notice.message}</p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss notification"
                className="rounded-md px-2 font-bold opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          )}

          {/* API error */}
          {error && (
            <section
              role="alert"
              className="mb-7 rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-slate-900">
                    Unable to load inventory
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{error}</p>
                  <button
                    type="button"
                    onClick={fetchInventory}
                    disabled={loading}
                    className="mt-4 rounded-lg bg-[#153D30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#205541] disabled:opacity-50"
                  >
                    {loading ? "Trying again..." : "Try again"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Statistics */}
          {!error && (
            <section aria-labelledby="inventory-stats-heading" className="mb-8">
              <div className="mb-4">
                <h2 id="inventory-stats-heading" className="text-lg font-bold text-[#17231F]">
                  Stock overview
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  A snapshot of your current inventory
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <StatCard key={stat.title} {...stat} loading={loading} />
                ))}
              </div>
            </section>
          )}

          {/* Inventory workspace */}
          {!error && (
            <section className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
              {/* Table header and controls */}
              <div className="border-b border-[#E9EEEA] p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#17231F]">
                      Product stock
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {loading
                        ? "Loading your products..."
                        : `Showing ${formatNumber(filteredProducts.length)} of ${formatNumber(products.length)} products`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 sm:w-80">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400">
                        <SearchIcon />
                      </span>

                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name, barcode, brand..."
                        aria-label="Search inventory"
                        className="w-full rounded-xl border border-slate-200 bg-[#FAFCFA] py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                      />

                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          aria-label="Clear search"
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#FAFCFA] px-3.5">
                      <span className="text-xs font-semibold text-slate-500">
                        Filter
                      </span>
                      <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        aria-label="Filter products by stock status"
                        className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:flex-none"
                      >
                        {INITIAL_FILTERS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* Quick filter chips */}
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {INITIAL_FILTERS.map((option) => {
                    const active = filter === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFilter(option.value)}
                        aria-pressed={active}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                          active
                            ? "border-[#153D30] bg-[#153D30] text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-[#153D30]"
                        }`}
                      >
                        {option.label}
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            active
                              ? "bg-white/15 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {formatNumber(filterCounts[option.value])}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="space-y-4 p-6" aria-label="Loading inventory">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                      </div>
                      <div className="hidden h-7 w-20 animate-pulse rounded-full bg-slate-100 sm:block" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <span className="h-8 w-8">
                      <InventoryIcon />
                    </span>
                  </span>
                  <h3 className="mt-5 text-base font-bold text-slate-800">
                    {products.length === 0
                      ? "Your inventory is empty"
                      : "No matching products"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {products.length === 0
                      ? "Products will appear here when they are available in your inventory."
                      : "Try another search term or stock filter to find the products you need."}
                  </p>
                  {(search || filter !== "all") && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="mt-5 rounded-xl bg-[#153D30] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#205541]"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop/tablet table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-[#F8FAF8]">
                        <tr className="border-b border-[#E9EEEA] text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
                          <th scope="col" className="px-6 py-4">Product</th>
                          <th scope="col" className="px-4 py-4">Barcode</th>
                          <th scope="col" className="px-4 py-4">Price</th>
                          <th scope="col" className="px-4 py-4">Available stock</th>
                          <th scope="col" className="px-4 py-4">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#EEF2EF]">
                        {filteredProducts.map((product) => {
                          const stock = Math.max(0, Number(product.stock) || 0);
                          const isUpdating = updatingStockId === product.id;

                          return (
                            <tr
                              key={product.id}
                              className="transition-colors hover:bg-[#FAFCFA]"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E2E9E4] bg-[#F5F8F6] text-[#153D30]">
                                    <span className="h-5 w-5">
                                      <InventoryIcon />
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="max-w-[230px] truncate text-sm font-bold text-slate-800">
                                      {product.name || "Unnamed product"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {product.brand || "No brand"}
                                      {product.quantity ? ` · ${product.quantity}` : ""}
                                    </p>
                                    {product.category && (
                                      <p className="mt-1 text-[10px] text-slate-400">
                                        {product.category}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-5">
                                <span className="font-mono text-xs text-slate-500">
                                  {product.barcode || "—"}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-4 py-5 text-sm font-bold text-slate-800">
                                {formatCurrency(product.price)}
                              </td>

                              <td className="px-4 py-5">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStockUpdate(product, -1)}
                                    disabled={stock === 0 || updatingStockId !== null}
                                    aria-label={`Decrease ${product.name} stock`}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    −
                                  </button>

                                  <div className="min-w-[84px] text-center">
                                    <span className={`text-base font-bold ${stock === 0 ? "text-red-600" : stock <= LOW_STOCK_LIMIT ? "text-amber-700" : "text-slate-800"}`}>
                                      {formatNumber(stock)}
                                    </span>
                                    <span className="ml-1 text-[10px] text-slate-400">
                                      units
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleStockUpdate(product, 1)}
                                    disabled={updatingStockId !== null}
                                    aria-label={`Increase ${product.name} stock`}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {isUpdating ? (
                                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-700" />
                                    ) : "+"}
                                  </button>
                                </div>
                              </td>

                              <td className="px-4 py-5">
                                <StockBadge stock={stock} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile inventory cards */}
                  <div className="divide-y divide-[#E9EEEA] md:hidden">
                    {filteredProducts.map((product) => {
                      const stock = Math.max(0, Number(product.stock) || 0);
                      const isUpdating = updatingStockId === product.id;

                      return (
                        <article key={product.id} className="p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E2E9E4] bg-[#F5F8F6] text-[#153D30]">
                              <span className="h-5 w-5">
                                <InventoryIcon />
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="break-words text-sm font-bold text-slate-800">
                                {product.name || "Unnamed product"}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {product.brand || "No brand"}
                                {product.quantity ? ` · ${product.quantity}` : ""}
                              </p>
                              <p className="mt-1 break-all font-mono text-[10px] text-slate-400">
                                Barcode: {product.barcode || "—"}
                              </p>
                            </div>

                            <StockBadge stock={stock} />
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F8FAF8] p-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Unit price
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {formatCurrency(product.price)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Available units
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {formatNumber(stock)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStockUpdate(product, -1)}
                                disabled={stock === 0 || updatingStockId !== null}
                                aria-label={`Decrease ${product.name} stock`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                              >
                                −
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStockUpdate(product, 1)}
                                disabled={updatingStockId !== null}
                                aria-label={`Increase ${product.name} stock`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                              >
                                {isUpdating ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-700" />
                                ) : "+"}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Footer */}
              {!loading && !error && products.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-[#E9EEEA] bg-[#FAFCFA] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p>
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {formatNumber(filteredProducts.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {formatNumber(products.length)}
                    </span>{" "}
                    products
                  </p>

                  <p>
                    {lastUpdated
                      ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Inventory status"}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Inventory reminder */}
          {!loading && !error && inventoryStats.outOfStock > 0 && (
            <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <h2 className="font-bold text-red-900">
                    Restocking may be needed
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-red-800">
                    {formatNumber(inventoryStats.outOfStock)}{" "}
                    {inventoryStats.outOfStock === 1 ? "product is" : "products are"}{" "}
                    currently out of stock.
                  </p>
                </div>
              </div>

              <NavLink
                to="/admin/products"
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#153D30] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#205541] sm:self-center"
              >
                Manage products
                <span aria-hidden="true">→</span>
              </NavLink>
            </section>
          )}

          <footer className="mt-8 border-t border-[#E2E9E4] pt-5 text-xs text-slate-400">
            SmartCart · Inventory management
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Inventory;