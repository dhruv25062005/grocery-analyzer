import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { getAllPayments } from "../../services/paymentService";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllPayments();

      setPayments(data.payments || []);
    } catch (err) {
      console.error("Failed to load payments:", err);
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        String(payment.id).includes(searchText) ||
        String(payment.order_number || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.payment_reference || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.method || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        String(payment.status).toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const stats = useMemo(() => {
    const total = payments.length;

    const paid = payments.filter(
      (payment) => payment.status === "paid"
    );

    const pending = payments.filter(
      (payment) => payment.status === "pending"
    );

    const failed = payments.filter(
      (payment) => payment.status === "failed"
    );

    const paidRevenue = paid.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    return {
      total,
      paid: paid.length,
      pending: pending.length,
      failed: failed.length,
      paidRevenue,
    };
  }, [payments]);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-58px)] bg-slate-50">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:p-8">
        <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payments
          </h1>

          <p className="mt-1 text-gray-500">
            Manage and monitor all SmartCart payments
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Payments
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {stats.total}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Paid
          </p>

          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {stats.paid}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <h2 className="mt-2 text-2xl font-bold text-yellow-600">
            {stats.pending}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Failed
          </p>

          <h2 className="mt-2 text-2xl font-bold text-red-600">
            {stats.failed}
          </h2>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Paid Revenue
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(stats.paidRevenue)}
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row">
        <input
          type="text"
          placeholder="Search payment, order or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-black md:flex-1"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-black"
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

          <option value="failed">
            Failed
          </option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">
            Loading payments...
          </p>
        </div>
      ) : (
        /* Table */
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Payment ID
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Order
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Reference
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Method
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Paid At
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-medium text-gray-900">
                        #{payment.id}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-900">
                          {payment.order_number || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono text-sm text-gray-600">
                        {payment.payment_reference || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-5 py-4 capitalize text-gray-600">
                        {payment.method || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(payment.paid_at)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(payment.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-5 py-3 text-sm text-gray-500">
            Showing {filteredPayments.length} of {payments.length} payments
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

export default Payments;