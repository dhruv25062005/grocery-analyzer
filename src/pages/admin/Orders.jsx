import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { getAllOrders } from "../../services/orderService";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAllOrders();

        setOrders(data.orders || []);
      } catch (err) {
        console.error("Orders error:", err);

        setError(
          err.message || "Failed to load orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const orderStats = useMemo(() => {
    const totalOrders = orders.length;

    const paidOrders = orders.filter(
      (order) => order.status === "paid"
    ).length;

    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;

    const totalRevenue = orders
      .filter((order) => order.status === "paid")
      .reduce(
        (total, order) =>
          total + Number(order.total || 0),
        0
      );

    return {
      totalOrders,
      paidOrders,
      pendingOrders,
      totalRevenue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const searchTerm = search
      .toLowerCase()
      .trim();

    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.order_number
          ?.toLowerCase()
          .includes(searchTerm) ||
        String(order.id)
          .includes(searchTerm) ||
        order.status
          ?.toLowerCase()
          .includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [orders, search, statusFilter]);

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-orange-100 text-orange-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-58px)] bg-slate-50">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:p-8">
        <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Orders
          </h1>

          <p className="mt-2 text-slate-500">
            View and monitor all SmartCart customer orders.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">
              ⏳
            </div>

            <p className="mt-3 font-medium text-slate-700">
              Loading orders...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Failed to load orders
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
                  Total Orders
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {orderStats.totalOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-green-700">
                  Paid Orders
                </p>

                <p className="mt-2 text-3xl font-bold text-green-800">
                  {orderStats.paidOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-orange-700">
                  Pending Orders
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-800">
                  {orderStats.pendingOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-blue-700">
                  Paid Revenue
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-800">
                  ₹
                  {orderStats.totalRevenue.toFixed(
                    2
                  )}
                </p>
              </div>

            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Toolbar */}
              <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-bold text-slate-900">
                    Order History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Showing{" "}
                    {filteredOrders.length}{" "}
                    of{" "}
                    {orders.length} orders
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
                      placeholder="Search order..."
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    <option value="all">
                      All Status
                    </option>

                    <option value="paid">
                      Paid
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>

                </div>
              </div>

              {/* Empty */}
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center">

                  <div className="text-4xl">
                    🧾
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-800">
                    No orders found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or status
                    filter.
                  </p>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1000px] text-left">

                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4">
                          Order
                        </th>

                        <th className="px-6 py-4">
                          Date
                        </th>

                        <th className="px-6 py-4">
                          Items
                        </th>

                        <th className="px-6 py-4">
                          Subtotal
                        </th>

                        <th className="px-6 py-4">
                          Total
                        </th>

                        <th className="px-6 py-4">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">

                      {filteredOrders.map(
                        (order) => (
                          <tr
                            key={order.id}
                            onClick={() =>
                              navigate(`/admin/orders/${order.id}`)
                            }
                            className="cursor-pointer transition hover:bg-slate-50"
                          >

                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {order.order_number}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Order ID:{" "}
                                  {order.id}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {formatDate(
                                order.created_at
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm font-medium text-slate-700">
                              {order.total_items}
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-600">
                              ₹
                              {Number(
                                order.subtotal
                              ).toFixed(2)}
                            </td>

                            <td className="px-6 py-4 font-semibold text-slate-900">
                              ₹
                              {Number(
                                order.total
                              ).toFixed(2)}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </td>

                          </tr>
                        )
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
    </div>
  );
};

export default Orders;