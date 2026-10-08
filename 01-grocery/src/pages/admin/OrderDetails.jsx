import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "../../services/orderService";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getOrderById(orderId);

        setOrder(data.order);
      } catch (err) {
        console.error("Order details error:", err);

        setError(
          err.message || "Failed to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-3xl">⏳</div>

          <p className="mt-3 font-medium text-slate-700">
            Loading order details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">

          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="mb-6 text-sm font-semibold text-green-600 hover:text-green-700"
          >
            ← Back to Orders
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Failed to load order
            </p>

            <p className="mt-1 text-sm">
              {error || "Order not found."}
            </p>
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="mb-6 text-sm font-semibold text-green-600 hover:text-green-700"
        >
          ← Back to Orders
        </button>

        {/* Header */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                Order Details
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {order.order_number}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Order ID: {order.id}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {formatDate(order.created_at)}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                order.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : order.status === "pending"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {order.status}
            </span>

          </div>

        </div>

        {/* Products */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-bold text-slate-900">
              Products
            </h2>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left">

              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Product
                  </th>

                  <th className="px-6 py-4">
                    Quantity
                  </th>

                  <th className="px-6 py-4">
                    Unit Price
                  </th>

                  <th className="px-6 py-4">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">

                {order.items?.map((item) => (
                  <tr key={item.id}>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.product_name}
                      </p>

                      {item.barcode && (
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {item.barcode}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.quantity}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      ₹{Number(item.unit_price).toFixed(2)}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ₹{Number(item.subtotal).toFixed(2)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* Bottom section */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Payment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-bold text-slate-900">
              Payment
            </h2>

            {order.payment ? (
              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Method
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {order.payment.method || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Status
                  </p>

                  <p className="mt-1 font-semibold capitalize text-slate-800">
                    {order.payment.status || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Reference
                  </p>

                  <p className="mt-1 break-all font-mono text-sm text-slate-700">
                    {order.payment.payment_reference ||
                      "N/A"}
                  </p>
                </div>

              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                No payment information available.
              </p>
            )}

          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-bold text-slate-900">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3">

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Subtotal
                </span>

                <span className="font-medium text-slate-800">
                  ₹{Number(order.subtotal).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Discount
                </span>

                <span className="font-medium text-slate-800">
                  ₹{Number(order.discount).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Tax
                </span>

                <span className="font-medium text-slate-800">
                  ₹{Number(order.tax).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between">

                  <span className="text-lg font-bold text-slate-900">
                    Total
                  </span>

                  <span className="text-lg font-bold text-green-600">
                    ₹{Number(order.total).toFixed(2)}
                  </span>

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
};

export default OrderDetails;