import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const Icon = ({ name, className = "h-5 w-5" }) => {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    search: <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>,
    plus: <path d="M12 5v14m-7-7h14" />,
    box: <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
    </>,
    stock: <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h4m-4 4h10" />
    </>,
    alert: <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v4m0 4h.01" />
    </>,
    check: <path d="m5 12 4 4L19 6" />,
    edit: <>
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L9 19l-5 1 1-5 11.5-11.5Z" />
    </>,
    trash: <>
      <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
    </>,
    refresh: <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M5.5 9a7 7 0 0 1 11.9-2L20 12M4 12l2.6 5a7 7 0 0 0 11.9-2" />
    </>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    scan: <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3M4 12h16" />
    </>,
    tag: <>
      <path d="M20 13 13 20 3 10V3h7l10 10Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </>,
    filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
  };

  return <svg {...common}>{paths[name] || paths.box}</svg>;
};

const StatCard = ({ label, value, hint, icon, tone }) => {
  const tones = {
    green: "bg-[#EAF3ED] text-[#205541]",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    neutral: "bg-[#F1F5F2] text-[#526259]",
  };

  return (
    <article className="rounded-2xl border border-[#E2E9E4] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#748078]">{label}</p>
          <p className="mt-2 break-words text-2xl font-extrabold tracking-tight text-[#17231F] sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#8A958E]">{hint}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon name={icon} />
        </span>
      </div>
    </article>
  );
};

const StockBadge = ({ stock }) => {
  const value = Number(stock) || 0;

  const style =
    value <= 0
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : value <= 10
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const label = value <= 0 ? "Out of stock" : value <= 10 ? "Low stock" : "In stock";

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-bold ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value} · {label}
    </span>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [editingProductId, setEditingProductId] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortBy, setSortBy] = useState("name");

  const noticeTimer = useRef(null);

  const notify = useCallback((message, type = "success") => {
    setNotice({ message, type });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(noticeTimer.current);
  }, []);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const data = await apiRequest("/products");
      setProducts(Array.isArray(data?.products) ? data.products : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Products error:", err);
      setError(err?.message || "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const stats = useMemo(() => {
    const total = products.length;
    const stockUnits = products.reduce(
      (sum, product) => sum + Math.max(0, Number(product.stock) || 0),
      0
    );
    const lowStock = products.filter((product) => {
      const stock = Number(product.stock) || 0;
      return stock > 0 && stock <= 10;
    }).length;
    const outOfStock = products.filter(
      (product) => (Number(product.stock) || 0) <= 0
    ).length;
    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        Math.max(0, Number(product.stock) || 0) *
          Math.max(0, Number(product.price) || 0),
      0
    );

    return { total, stockUnits, lowStock, outOfStock, inventoryValue };
  }, [products]);

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category?.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch = [
          product.name,
          product.barcode,
          product.brand,
          product.category,
          product.manufacturer,
          product.supplier,
        ].some((value) => String(value || "").toLowerCase().includes(term));

        const matchesCategory =
          categoryFilter === "all" || product.category === categoryFilter;

        const stock = Number(product.stock) || 0;
        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "healthy" && stock > 10) ||
          (stockFilter === "low" && stock > 0 && stock <= 10) ||
          (stockFilter === "out" && stock <= 0);

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return Number(a.price) - Number(b.price);
        if (sortBy === "price-high") return Number(b.price) - Number(a.price);
        if (sortBy === "stock-low") return Number(a.stock) - Number(b.stock);
        if (sortBy === "stock-high") return Number(b.stock) - Number(a.stock);
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [products, search, categoryFilter, stockFilter, sortBy]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setFormError("");
    setEditingProductId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowEditProduct(false);
    setShowAddProduct(true);
  };

  const closeModal = () => {
    if (addingProduct || updatingProduct) return;
    setShowAddProduct(false);
    setShowEditProduct(false);
    resetForm();
  };

  useEffect(() => {
    const isOpen = showAddProduct || showEditProduct;
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleAddProduct = async (event) => {
    event.preventDefault();

    try {
      setAddingProduct(true);
      setFormError("");

      const data = await createProduct(formData);

      if (!data?.product) {
        throw new Error("The server did not return the created product.");
      }

      setProducts((current) => [data.product, ...current]);
      setShowAddProduct(false);
      resetForm();
      notify("Product added successfully.");
    } catch (err) {
      console.error("Add product error:", err);
      setFormError(err?.message || "Failed to add product.");
    } finally {
      setAddingProduct(false);
    }
  };

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
      manufacturer: product.manufacturer || "",
      supplier: product.supplier || "",
      manufactureDate: formatDate(product.manufacture_date),
      expiryDate: formatDate(product.expiry_date),
    });
    setFormError("");
    setShowAddProduct(false);
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();
    if (editingProductId == null) return;

    try {
      setUpdatingProduct(true);
      setFormError("");

      const data = await updateProduct(editingProductId, formData);

      if (!data?.product) {
        throw new Error("The server did not return the updated product.");
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === editingProductId ? data.product : product
        )
      );

      setShowEditProduct(false);
      resetForm();
      notify("Product changes saved.");
    } catch (err) {
      console.error("Update product error:", err);
      setFormError(err?.message || "Failed to update product.");
    } finally {
      setUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;

    const product = deleteTarget;

    try {
      setDeletingId(product.id);
      await deleteProduct(product.id);

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      setDeleteTarget(null);
      notify(`${product.name} was deleted.`);
    } catch (err) {
      console.error("Delete product error:", err);
      setDeleteTarget(null);
      notify(err?.message || "Failed to delete product.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("name");
  };

  const hasFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    stockFilter !== "all";

  return (
    <main className="min-h-screen bg-[#F5F8F6] px-4 py-6 text-[#17231F] sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#15803D]">
              <span className="h-2 w-2 rounded-full bg-[#15803D]" />
              SmartCart Administration
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Products
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748078] sm:text-base">
              Manage your product catalogue, pricing, barcodes, and stock from
              one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchProducts(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] bg-white px-4 py-3 text-sm font-semibold text-[#34453B] shadow-sm transition hover:bg-[#F8FBF9] disabled:opacity-60"
            >
              <Icon
                name="refresh"
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#153D30] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#205541] focus:outline-none focus:ring-4 focus:ring-[#D9F99D]/70"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add product
            </button>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total products"
            value={stats.total.toLocaleString("en-IN")}
            hint="Products in your catalogue"
            icon="box"
            tone="green"
          />
          <StatCard
            label="Units in stock"
            value={stats.stockUnits.toLocaleString("en-IN")}
            hint="Combined available quantity"
            icon="stock"
            tone="neutral"
          />
          <StatCard
            label="Low stock"
            value={stats.lowStock.toLocaleString("en-IN")}
            hint="Products with 1–10 units"
            icon="alert"
            tone="amber"
          />
          <StatCard
            label="Out of stock"
            value={stats.outOfStock.toLocaleString("en-IN")}
            hint="Products needing replenishment"
            icon="alert"
            tone="red"
          />
        </section>

        {/* Inventory value and alerts */}
        <section className="mb-7 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-[#153D30] p-6 text-white sm:p-7">
            <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-1 -top-3 h-32 w-32 rounded-full border border-white/10" />

            <p className="text-sm font-medium text-white/70">
              Estimated inventory value
            </p>

            <p className="mt-3 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
              {currency(stats.inventoryValue)}
            </p>

            <p className="mt-3 max-w-md text-xs leading-5 text-white/65">
              Calculated using current stock multiplied by selling price. This
              is an estimate, not an accounting valuation.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#D9F99D]">
              <Icon name="check" className="h-4 w-4" />
              Based on current catalogue data
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E9E4] bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Icon name="alert" />
              </span>
              <div>
                <h2 className="font-bold text-[#24352B]">Stock attention</h2>
                <p className="mt-1 text-xs text-[#8A958E]">
                  Products that may need restocking
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setStockFilter("low");
                  setSearch("");
                }}
                className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-left transition hover:bg-amber-100"
              >
                <p className="text-2xl font-extrabold text-amber-800">
                  {stats.lowStock}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-800">
                  Low stock
                </p>
                <p className="mt-1 text-xs text-amber-700">1–10 units</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStockFilter("out");
                  setSearch("");
                }}
                className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-left transition hover:bg-rose-100"
              >
                <p className="text-2xl font-extrabold text-rose-800">
                  {stats.outOfStock}
                </p>
                <p className="mt-1 text-xs font-semibold text-rose-800">
                  Out of stock
                </p>
                <p className="mt-1 text-xs text-rose-700">0 units</p>
              </button>
            </div>
          </div>
        </section>

        {/* Product catalogue */}
        <section className="overflow-hidden rounded-2xl border border-[#E2E9E4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E2E9E4] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#17231F]">
                Product catalogue
              </h2>
              <p className="mt-1 text-sm text-[#748078]">
                {loading
                  ? "Loading products..."
                  : `${filteredProducts.length} of ${products.length} products shown`}
              </p>
            </div>

            <label className="relative w-full lg:max-w-sm">
              <span className="sr-only">Search products</span>
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A958E]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, barcode, brand..."
                className="w-full rounded-xl border border-[#DCE5DF] bg-[#FCFDFC] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#9AA59E] focus:border-[#6B9C7A] focus:ring-4 focus:ring-[#EAF3ED]"
              />
            </label>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-[#EDF1EE] bg-[#FAFCFA] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#748078]">
                <Icon name="filter" className="h-4 w-4" />
                Filters
              </span>

              {[
                { value: "all", label: "All stock" },
                { value: "healthy", label: "In stock" },
                { value: "low", label: "Low stock" },
                { value: "out", label: "Out of stock" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStockFilter(option.value)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    stockFilter === option.value
                      ? "border-[#153D30] bg-[#153D30] text-white"
                      : "border-[#E2E9E4] bg-white text-[#526259] hover:bg-[#F1F5F2]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#748078]">
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="min-w-0 rounded-lg border border-[#DCE5DF] bg-white px-3 py-2.5 text-xs font-semibold text-[#34453B] outline-none focus:border-[#6B9C7A]"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#748078]">
                Sort
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="min-w-0 rounded-lg border border-[#DCE5DF] bg-white px-3 py-2.5 text-xs font-semibold text-[#34453B] outline-none focus:border-[#6B9C7A]"
                >
                  <option value="name">Name A–Z</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="stock-low">Stock: low to high</option>
                  <option value="stock-high">Stock: high to low</option>
                </select>
              </label>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-[#205541] hover:bg-[#EAF3ED]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="m-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-5 sm:m-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-rose-800">Unable to load products</p>
                <p className="mt-1 text-sm text-rose-700">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => fetchProducts()}
                className="rounded-lg bg-[#153D30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#205541]"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && products.length === 0 ? (
            <div className="space-y-3 p-5 sm:p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex animate-pulse items-center gap-4 rounded-xl border border-[#EDF1EE] p-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-36 rounded bg-slate-200" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                  <div className="hidden h-5 w-20 rounded-full bg-slate-100 sm:block" />
                </div>
              ))}
            </div>
          ) : !error && filteredProducts.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3ED] text-[#205541]">
                <Icon name={hasFilters ? "search" : "box"} className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-bold text-[#24352B]">
                {products.length === 0 ? "Your catalogue is empty" : "No matching products"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#748078]">
                {products.length === 0
                  ? "Add your first product to start managing your SmartCart inventory."
                  : "Try another search, category, or stock filter."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="rounded-xl border border-[#DCE5DF] px-4 py-2.5 text-sm font-semibold text-[#34453B] hover:bg-[#F5F8F6]">
                    Clear filters
                  </button>
                )}
                {products.length === 0 && (
                  <button type="button" onClick={openAddModal} className="rounded-xl bg-[#153D30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#205541]">
                    Add first product
                  </button>
                )}
              </div>
            </div>
          ) : !error ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-[#F8FAF8] text-[11px] font-bold uppercase tracking-wider text-[#748078]">
                    <tr>
                      <th className="px-5 py-4">Product</th>
                      <th className="px-5 py-4">Barcode</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">MRP</th>
                      <th className="px-5 py-4">Stock status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF1EE]">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="transition hover:bg-[#F8FBF9]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                              <Icon name="box" />
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-[230px] truncate text-sm font-bold text-[#24352B]" title={product.name}>
                                {product.name || "Unnamed product"}
                              </p>
                              <p className="mt-1 text-xs text-[#8A958E]">
                                {product.brand || "No brand"}
                                {product.quantity ? ` · ${product.quantity}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="break-all font-mono text-xs text-[#627167]">
                            {product.barcode || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#526259]">
                          {product.category || "Uncategorized"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-[#24352B]">
                          {currency(product.price)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-[#8A958E]">
                          {product.mrp != null && product.mrp !== "" ? currency(product.mrp) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <StockBadge stock={product.stock} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditClick(product)}
                              aria-label={`Edit ${product.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5DF] px-3 py-2 text-xs font-bold text-[#34453B] transition hover:border-[#B8D2C0] hover:bg-[#EAF3ED]"
                            >
                              <Icon name="edit" className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(product)}
                              disabled={deletingId === product.id}
                              aria-label={`Delete ${product.name}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              <Icon name="trash" className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[#EDF1EE] md:hidden">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#205541]">
                        <Icon name="box" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-bold text-[#24352B]">
                          {product.name || "Unnamed product"}
                        </h3>
                        <p className="mt-1 text-xs text-[#8A958E]">
                          {product.brand || "No brand"}
                          {product.category ? ` · ${product.category}` : ""}
                        </p>
                        <div className="mt-3">
                          <StockBadge stock={product.stock} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F5F8F6] p-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">Selling price</p>
                        <p className="mt-1 font-extrabold text-[#153D30]">{currency(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">MRP</p>
                        <p className="mt-1 font-semibold text-[#526259]">
                          {product.mrp != null && product.mrp !== "" ? currency(product.mrp) : "—"}
                        </p>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A958E]">Barcode</p>
                        <p className="mt-1 break-all font-mono text-xs text-[#526259]">{product.barcode || "—"}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(product)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE5DF] px-3 py-2.5 text-sm font-semibold text-[#34453B] hover:bg-[#F5F8F6]"
                      >
                        <Icon name="edit" className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-[#E2E9E4] bg-[#FAFCFA] px-5 py-4 text-xs text-[#748078] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span>
                  Showing {filteredProducts.length} of {products.length} products
                </span>
                <span>
                  {lastUpdated
                    ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Inventory"}
                </span>
              </div>
            </>
          ) : null}
        </section>

        <footer className="mt-7 pb-4 text-center text-xs text-[#8A958E]">
          SmartCart Admin · Product Management
        </footer>
      </div>

      {/* Toast */}
      {notice && (
        <div
          role="status"
          className={`fixed bottom-5 right-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-xl sm:right-6 ${
            notice.type === "error" ? "bg-rose-700" : "bg-[#153D30]"
          }`}
        >
          <Icon
            name={notice.type === "error" ? "alert" : "check"}
            className="h-5 w-5 shrink-0"
          />
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            className="ml-2 rounded-md p-1 hover:bg-white/10"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add / Edit modal */}
      {(showAddProduct || showEditProduct) && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#10231A]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#E2E9E4] px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#15803D]">
                  Product catalogue
                </p>
                <h2 id="product-modal-title" className="mt-1 text-xl font-extrabold text-[#17231F]">
                  {showAddProduct ? "Add new product" : "Edit product"}
                </h2>
                <p className="mt-1 text-xs text-[#748078]">
                  {showAddProduct
                    ? "Enter product details and verify the barcode."
                    : "Update product details and inventory information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={addingProduct || updatingProduct}
                aria-label="Close dialog"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E2E9E4] text-[#526259] transition hover:bg-[#F5F8F6] disabled:opacity-50"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <ProductForm
                key={showEditProduct ? `edit-${editingProductId}` : "add"}
                formData={formData}
                handleFormChange={handleFormChange}
                formError={formError}
                onSubmit={showAddProduct ? handleAddProduct : handleUpdateProduct}
                onCancel={closeModal}
                submitting={addingProduct || updatingProduct}
                submitText={
                  addingProduct
                    ? "Adding product..."
                    : updatingProduct
                    ? "Saving changes..."
                    : showAddProduct
                    ? "Add product"
                    : "Save changes"
                }
                enableBarcodeScanner={showAddProduct}
              />
            </div>
          </section>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#10231A]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId == null) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl border border-[#E2E9E4] bg-white p-6 shadow-2xl sm:p-7"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Icon name="trash" className="h-6 w-6" />
            </span>

            <h2 id="delete-title" className="mt-5 text-xl font-extrabold text-[#17231F]">
              Delete product?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#748078]">
              You are about to delete{" "}
              <strong className="text-[#24352B]">{deleteTarget.name}</strong>.
              This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingId != null}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#DCE5DF] px-4 py-3 text-sm font-semibold text-[#34453B] hover:bg-[#F5F8F6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId != null}
                onClick={handleDeleteProduct}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId != null ? "Deleting..." : "Delete product"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

/* Barcode camera scanner */

const ProductBarcodeScanner = ({ onBarcodeDetected, disabled = false }) => {
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const scannerIdRef = useRef(
    `admin-barcode-reader-${Math.random().toString(36).slice(2)}`
  );
  const scannerId = scannerIdRef.current;

  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [detectedBarcode, setDetectedBarcode] = useState("");

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setActive(false);
      return;
    }

    try {
      if (scanner.isScanning) await scanner.stop();
    } catch (err) {
      console.error("Scanner stop error:", err);
    }

    try {
      await scanner.clear();
    } catch (err) {
      console.error("Scanner clear error:", err);
    }

    scannerRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        const cleanup = async () => {
          try {
            if (scanner.isScanning) await scanner.stop();
          } catch (err) {
            console.error("Scanner cleanup error:", err);
          }
          try {
            await scanner.clear();
          } catch (err) {
            console.error("Scanner clear error:", err);
          }
        };
        cleanup();
      }
    };
  }, []);

  const startScanner = async () => {
    if (disabled || active) return;

    let scanner;

    try {
      setError("");
      setDetectedBarcode("");
      processingRef.current = false;

      scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;
      setActive(true);

      await new Promise((resolve) => window.setTimeout(resolve, 120));

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 140 },
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
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;

          const barcode = decodedText.trim();
          setDetectedBarcode(barcode);
          await stopScanner();

          try {
            await onBarcodeDetected(barcode);
          } finally {
            processingRef.current = false;
          }
        },
        () => {}
      );
    } catch (err) {
      console.error("Barcode scanner error:", err);

      try {
        if (scanner?.isScanning) await scanner.stop();
        if (scanner) await scanner.clear();
      } catch (cleanupError) {
        console.error("Scanner cleanup error:", cleanupError);
      }

      scannerRef.current = null;
      setActive(false);
      setError(
        err?.message ||
          "Unable to access the camera. Check browser camera permissions."
      );
    }
  };

  return (
    <div className="mt-3">
      {!active && (
        <button
          type="button"
          onClick={startScanner}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl border border-[#B8D2C0] bg-[#F5FAF6] px-4 py-2.5 text-sm font-bold text-[#205541] transition hover:bg-[#EAF3ED] disabled:opacity-50"
        >
          <Icon name="scan" className="h-4 w-4" />
          Scan barcode with camera
        </button>
      )}

      <div className={active ? "mt-4 overflow-hidden rounded-xl border border-[#2B493A] bg-[#10231A]" : "hidden"}>
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
          <div>
            <p className="text-sm font-bold">Barcode scanner</p>
            <p className="mt-1 text-xs text-white/65">
              Point your camera at the product barcode.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#D9F99D]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#D9F99D]" />
            Scanning
          </span>
        </div>

        <div id={scannerId} className="w-full overflow-hidden" />

        <button
          type="button"
          onClick={stopScanner}
          className="m-3 w-[calc(100%-1.5rem)] rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#17231F] hover:bg-[#EAF3ED]"
        >
          Stop camera
        </button>
      </div>

      {detectedBarcode && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-bold text-emerald-800">Barcode detected</p>
          <p className="mt-1 break-all font-mono text-sm text-emerald-900">
            {detectedBarcode}
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
};

/* Reusable add/edit form */

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
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupError, setLookupError] = useState("");

  const fetchBarcodeDetails = async (barcodeValue = formData.barcode) => {
    const barcode = String(barcodeValue || "").trim();

    if (!barcode) {
      setLookupMessage("");
      setLookupError("Enter or scan a barcode first.");
      return;
    }

    try {
      setLookupLoading(true);
      setLookupMessage("");
      setLookupError("");

      const data = await apiRequest(
        `/products/barcode-info/${encodeURIComponent(barcode)}`
      );

      if (!data?.product) {
        throw new Error("No product details were returned.");
      }

      const product = data.product;
      const fields = {
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        quantity: product.quantity || "",
        manufacturer: product.manufacturer || "",
      };

      Object.entries(fields).forEach(([name, value]) => {
        handleFormChange({ target: { name, value } });
      });

      setLookupMessage(
        "Details fetched. Verify all fields before saving the product."
      );
    } catch (err) {
      console.error("Barcode lookup error:", err);
      setLookupError(
        err?.message ||
          "Product details were not found. You can enter them manually."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    handleFormChange({ target: { name: "barcode", value: barcode } });
    await fetchBarcodeDetails(barcode);
  };

  const fields = [
    { name: "name", label: "Product name", placeholder: "e.g. Basmati Rice", required: true, wide: true },
    { name: "barcode", label: "Barcode", placeholder: "Scan or enter barcode", required: true, wide: true },
    { name: "category", label: "Category", placeholder: "e.g. Grocery" },
    { name: "brand", label: "Brand", placeholder: "Brand name" },
    { name: "quantity", label: "Quantity / size", placeholder: "e.g. 500g" },
    { name: "price", label: "Selling price (₹)", type: "number", min: "0", step: "0.01", required: true, placeholder: "0.00" },
    { name: "mrp", label: "MRP (₹)", type: "number", min: "0", step: "0.01", placeholder: "0.00" },
    { name: "stock", label: "Available stock", type: "number", min: "0", step: "1", required: true, placeholder: "0" },
    { name: "manufacturer", label: "Manufacturer", placeholder: "Manufacturer name" },
    { name: "supplier", label: "Supplier", placeholder: "Supplier name" },
    { name: "manufactureDate", label: "Manufacture date", type: "date" },
    { name: "expiryDate", label: "Expiry date", type: "date" },
  ];

  const onFieldChange = (event) => {
    handleFormChange(event);
    if (event.target.name === "barcode") {
      setLookupMessage("");
      setLookupError("");
    }
  };

  const onFormSubmit = (event) => {
    const price = Number(formData.price);
    const mrp = formData.mrp === "" ? null : Number(formData.mrp);
    const stock = Number(formData.stock);

    if (!Number.isFinite(price) || price < 0) {
      event.preventDefault();
      return;
    }

    if (mrp !== null && (!Number.isFinite(mrp) || mrp < 0)) {
      event.preventDefault();
      return;
    }

    if (mrp !== null && mrp < price) {
      event.preventDefault();
      return;
    }

    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      event.preventDefault();
      return;
    }

    if (
      formData.manufactureDate &&
      formData.expiryDate &&
      formData.expiryDate < formData.manufactureDate
    ) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  };

  const fieldClass =
    "w-full rounded-xl border border-[#DCE5DF] bg-white px-4 py-3 text-sm text-[#17231F] outline-none transition placeholder:text-[#9AA59E] focus:border-[#6B9C7A] focus:ring-4 focus:ring-[#EAF3ED] disabled:bg-[#F5F8F6]";

  return (
    <form onSubmit={onFormSubmit} className="p-5 sm:p-7">
      <div className="mb-6 rounded-xl border border-[#E2E9E4] bg-[#F8FAF8] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3ED] text-[#205541]">
            <Icon name="tag" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#24352B]">Product information</p>
            <p className="mt-1 text-xs leading-5 text-[#748078]">
              Fields marked with * are required. Barcode lookup can fill basic
              product details, but you should verify them before saving.
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-bold">Unable to save product</p>
          <p className="mt-1">{formError}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.wide ? "sm:col-span-2" : ""}>
            <label htmlFor={`product-${field.name}`} className="mb-2 block text-xs font-bold text-[#526259]">
              {field.label}
              {field.required && <span className="ml-1 text-rose-600">*</span>}
            </label>

            {field.name === "barcode" ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id={`product-${field.name}`}
                    name={field.name}
                    type="text"
                    value={formData[field.name]}
                    onChange={onFieldChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={submitting}
                    autoComplete="off"
                    className={`${fieldClass} min-w-0 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => fetchBarcodeDetails()}
                    disabled={submitting || lookupLoading || !formData.barcode.trim()}
                    className="shrink-0 rounded-xl border border-[#B8D2C0] bg-[#F5FAF6] px-4 py-3 text-xs font-bold text-[#205541] hover:bg-[#EAF3ED] disabled:opacity-50"
                  >
                    {lookupLoading ? "Fetching..." : "Fetch details"}
                  </button>
                </div>

                {enableBarcodeScanner && (
                  <ProductBarcodeScanner
                    onBarcodeDetected={handleBarcodeDetected}
                    disabled={submitting || lookupLoading}
                  />
                )}

                {lookupLoading && (
                  <p className="mt-2 text-xs text-[#526259]">
                    Looking up barcode details...
                  </p>
                )}
                {lookupMessage && (
                  <p role="status" className="mt-2 text-xs leading-5 text-emerald-700">
                    {lookupMessage}
                  </p>
                )}
                {lookupError && (
                  <p role="alert" className="mt-2 text-xs leading-5 text-amber-800">
                    {lookupError}
                  </p>
                )}
              </>
            ) : (
              <input
                id={`product-${field.name}`}
                name={field.name}
                type={field.type || "text"}
                value={formData[field.name]}
                onChange={handleFormChange}
                placeholder={field.placeholder || ""}
                required={field.required}
                min={field.min}
                step={field.step}
                disabled={submitting}
                autoComplete="off"
                className={fieldClass}
              />
            )}
          </div>
        ))}
      </div>

      {formData.price !== "" && formData.mrp !== "" && Number(formData.mrp) >= Number(formData.price) && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold text-emerald-800">Pricing preview</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="text-emerald-800">
              Selling price: <strong>{currency(formData.price)}</strong>
            </span>
            <span className="text-emerald-800">
              MRP: <strong>{currency(formData.mrp)}</strong>
            </span>
            <span className="font-bold text-emerald-700">
              Savings: {currency(Number(formData.mrp) - Number(formData.price))}
            </span>
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#E2E9E4] pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-[#DCE5DF] px-5 py-3 text-sm font-bold text-[#34453B] transition hover:bg-[#F5F8F6] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || lookupLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#153D30] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#205541] focus:outline-none focus:ring-4 focus:ring-[#D9F99D]/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default Products;
