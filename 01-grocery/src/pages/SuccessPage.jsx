import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getOrderById } from "../services/orderService";
import { useCart } from "../context/CartContext";

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { clearCart } = useCart();

  // --------------------------------------------------
  // INITIAL STATE
  // --------------------------------------------------

  const [order, setOrder] = useState(
    location.state?.order || null
  );

  const [payment, setPayment] = useState(
    location.state?.payment || null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // RECOVER COMPLETE ORDER
  // --------------------------------------------------

  useEffect(() => {
    const recoverOrder = async () => {
      setError("");

      /*
        First try to get the order ID from navigation state.
        If the page was refreshed, use sessionStorage instead.
      */
      const stateOrderId = location.state?.order?.id;

      const savedOrderId =
        sessionStorage.getItem("smartcart_order_id");

      const orderId =
        stateOrderId || savedOrderId;

      /*
        If we have an order ID, ALWAYS fetch the complete
        order from the backend.

        This is important because the order object coming
        from payment verification may not contain items.
      */
      if (orderId) {
        try {
          setLoading(true);

          const data = await getOrderById(orderId);

          if (!data?.order) {
            throw new Error(
              "Order could not be recovered."
            );
          }

          setOrder(data.order);

          // Keep the order ID available for refresh.
          sessionStorage.setItem(
            "smartcart_order_id",
            String(data.order.id)
          );
        } catch (err) {
          console.error(
            "Success page order recovery error:",
            err
          );

          /*
            If backend recovery fails but we already have
            an order from navigation state, keep that order
            instead of completely losing the receipt.
          */
          if (!location.state?.order) {
            setOrder(null);
          }

          setError(
            err.message ||
              "Unable to recover your order."
          );
        } finally {
          setLoading(false);
        }

        return;
      }

      /*
        No ID available.

        If navigation state contains an order, use it.
      */
      if (location.state?.order) {
        setOrder(location.state.order);
      } else {
        setOrder(null);
      }

      setLoading(false);
    };

    recoverOrder();
  }, [location.state]);

  // --------------------------------------------------
  // RECOVER PAYMENT AFTER REFRESH
  // --------------------------------------------------

  useEffect(() => {
    /*
      Payment is already available from navigation state.
    */
    if (location.state?.payment) {
      setPayment(location.state.payment);

      /*
        Save it so it remains available after refresh.
      */
      sessionStorage.setItem(
        "smartcart_payment",
        JSON.stringify(location.state.payment)
      );

      return;
    }

    /*
      Try recovering payment from sessionStorage.
    */
    const savedPayment =
      sessionStorage.getItem("smartcart_payment");

    if (!savedPayment) {
      return;
    }

    try {
      const parsedPayment = JSON.parse(savedPayment);

      if (parsedPayment?.id) {
        setPayment(parsedPayment);
      }
    } catch (err) {
      console.error(
        "Success page payment recovery error:",
        err
      );

      sessionStorage.removeItem(
        "smartcart_payment"
      );
    }
  }, [location.state]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            🔄
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Loading Your Receipt
          </h2>

          <p className="mt-2 text-slate-500">
            Please wait while we recover your complete order.
          </p>

        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // NO ORDER
  // --------------------------------------------------

  if (!order) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="text-5xl">
            ⚠️
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            Receipt Not Found
          </h2>

          <p className="mt-2 text-slate-500">
            We couldn't recover your order information.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={() => {
              clearCart();

              sessionStorage.removeItem(
                "smartcart_order_id"
              );

              sessionStorage.removeItem(
                "smartcart_payment"
              );

              navigate("/");
            }}
            className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Start New Shopping
          </button>

        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ORDER VALUES
  // --------------------------------------------------

  const orderNumber =
    order.orderNumber ||
    order.order_number ||
    "N/A";

  const orderTotal = Number(
    order.total || 0
  );

  const orderSubtotal = Number(
    order.subtotal || 0
  );

  const orderDiscount = Number(
    order.discount || 0
  );

  const orderTax = Number(
    order.tax || 0
  );

  const paymentReference =
    payment?.payment_reference ||
    payment?.paymentReference ||
    "N/A";

  const paymentMethod =
    payment?.method ||
    "UPI";

  const paymentStatus =
    payment?.status ||
    "paid";

  const paidAt =
    payment?.paid_at ||
    payment?.paidAt ||
    null;

  // --------------------------------------------------
  // DATE FORMATTER
  // --------------------------------------------------

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // --------------------------------------------------
  // PRINT
  // --------------------------------------------------

  const handlePrint = () => {
    window.print();
  };

  // --------------------------------------------------
  // NEW SHOPPING
  // --------------------------------------------------

  const handleNewShopping = () => {
    clearCart();

    sessionStorage.removeItem(
      "smartcart_order_id"
    );

    sessionStorage.removeItem(
      "smartcart_payment"
    );

    navigate("/");
  };

  // --------------------------------------------------
  // ITEMS
  // --------------------------------------------------

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-10">

      <div className="mx-auto max-w-3xl">

        {/* SUCCESS HEADER */}
        <div className="mb-8 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Payment Successful!
          </h1>

          <p className="mt-2 text-slate-500">
            Thank you for shopping with SmartCart.
          </p>

        </div>

        {/* RECEIPT */}
        <div
          id="receipt"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          {/* RECEIPT HEADER */}
          <div className="border-b border-slate-200 px-6 py-6 text-center">

            <div className="text-3xl font-bold text-green-600">
              SmartCart
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Self Checkout Receipt
            </p>

          </div>

          {/* ORDER INFORMATION */}
          <div className="border-b border-slate-200 px-6 py-6">

            <div className="grid gap-4 sm:grid-cols-2">

              {/* ORDER NUMBER */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Order Number
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  #{orderNumber}
                </p>
              </div>

              {/* ORDER DATE */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Order Date
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {formatDate(
                    order.created_at ||
                      order.createdAt
                  )}
                </p>
              </div>

              {/* PAYMENT REFERENCE */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Payment Reference
                </p>

                <p className="mt-1 break-all font-semibold text-slate-800">
                  {paymentReference}
                </p>
              </div>

              {/* PAYMENT METHOD */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Payment Method
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {paymentMethod}
                </p>
              </div>

            </div>

          </div>

          {/* PAYMENT STATUS */}
          <div className="border-b border-slate-200 px-6 py-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Payment Status
                </p>

                <p className="mt-1 font-semibold capitalize text-green-600">
                  {paymentStatus}
                </p>
              </div>

              {paidAt && (
                <div className="text-right">

                  <p className="text-sm font-medium text-slate-500">
                    Paid At
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(paidAt)}
                  </p>

                </div>
              )}

            </div>

          </div>

          {/* PURCHASED ITEMS */}
          <div className="px-6 py-6">

            <div className="flex items-center justify-between">

              <h2 className="text-lg font-bold text-slate-900">
                Purchased Items
              </h2>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {items.length}{" "}
                {items.length === 1
                  ? "product"
                  : "products"}
              </span>

            </div>

            {items.length > 0 ? (
              <div className="mt-5 divide-y divide-slate-200">

                {items.map((item) => {

                  const quantity = Number(
                    item.quantity || 0
                  );

                  const unitPrice = Number(
                    item.unit_price ||
                      item.unitPrice ||
                      0
                  );

                  const itemSubtotal =
                    item.subtotal !== undefined &&
                    item.subtotal !== null
                      ? Number(item.subtotal)
                      : unitPrice * quantity;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >

                      {/* PRODUCT INFO */}
                      <div className="min-w-0 flex-1">

                        <p className="font-semibold text-slate-900">
                          {item.name ||
                            "Product"}
                        </p>

                        {item.brand && (
                          <p className="mt-1 text-sm text-slate-500">
                            {item.brand}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-400">
                          ₹
                          {unitPrice.toFixed(2)}
                          {" × "}
                          {quantity}
                        </p>

                      </div>

                      {/* ITEM TOTAL */}
                      <div className="shrink-0 font-semibold text-slate-900">
                        ₹
                        {itemSubtotal.toFixed(2)}
                      </div>

                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                No item details available.
              </div>
            )}

          </div>

          {/* TOTALS */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-6">

            <div className="space-y-3">

              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>

                <span>
                  ₹{orderSubtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-slate-500">
                <span>Discount</span>

                <span>
                  ₹{orderDiscount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax</span>

                <span>
                  ₹{orderTax.toFixed(2)}
                </span>
              </div>

              <div className="my-4 border-t border-slate-200" />

              <div className="flex items-center justify-between">

                <span className="text-lg font-bold text-slate-900">
                  Total Paid
                </span>

                <span className="text-2xl font-bold text-green-600">
                  ₹{orderTotal.toFixed(2)}
                </span>

              </div>

            </div>

          </div>

          {/* RECEIPT FOOTER */}
          <div className="border-t border-slate-200 px-6 py-6 text-center">

            <p className="text-sm font-medium text-slate-700">
              Thank you for shopping with SmartCart!
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please keep this receipt for your records.
            </p>

          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">

          <button
            onClick={handlePrint}
            className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            🖨️ Print Receipt
          </button>

          <button
            onClick={handleNewShopping}
            className="rounded-xl bg-green-600 px-6 py-4 font-semibold text-white transition hover:bg-green-700"
          >
            🛒 Start New Shopping
          </button>

        </div>

      </div>

      {/* PRINT STYLES */}
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            nav,
            header,
            button {
              display: none !important;
            }

            #receipt {
              border: none !important;
              box-shadow: none !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            main {
              padding: 0 !important;
              min-height: auto !important;
              background: white !important;
            }
          }
        `}
      </style>

    </main>
  );
};

export default SuccessPage;