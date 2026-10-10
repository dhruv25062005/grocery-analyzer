import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  ArrowRight,
  Printer,
  Receipt
} from "lucide-react";

import { getOrderById } from "../services/orderService";

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [payment, setPayment] = useState(location.state?.payment || null);

  const customerName = sessionStorage.getItem("smartcart_customer_name") || "Amit Gupta";
  const customerPhone = sessionStorage.getItem("smartcart_customer_phone") || "+91 98765 43210";

  // Recover complete order with items
  useEffect(() => {
    const recoverOrder = async () => {
      const orderId =
        location.state?.order?.id || sessionStorage.getItem("smartcart_order_id");

      if (orderId) {
        try {
          const res = await getOrderById(orderId);
          if (res?.order) {
            setOrder(res.order);
          }
        } catch (err) {
          console.error("Success order recovery error:", err);
        }
      }

      const savedPayment = sessionStorage.getItem("smartcart_payment");
      if (savedPayment) {
        try {
          setPayment((curr) => curr || JSON.parse(savedPayment));
        } catch {
          // ignore
        }
      }
    };

    recoverOrder();
  }, [location.state]);

  const handlePrint = () => {
    window.print();
  };

  const handleDone = () => {
    sessionStorage.removeItem("smartcart_order_id");
    sessionStorage.removeItem("smartcart_payment");
    navigate("/");
  };

  const orderNumber = order?.order_number || order?.orderNumber || "SC-2026";
  const totalAmount = Number(order?.total || payment?.amount || 0);

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-slate-50 px-4 py-6 pb-24 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Success Header Badge */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Payment Verified!
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Thank you for using SmartCart Self-Checkout. Your exit pass is active.
          </p>

          {/* Store Exit Gate Pass QR */}
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Store Exit Gate Sensor Pass
            </p>
            <div className="mx-auto inline-block rounded-xl bg-white p-3 shadow-xs border border-slate-200">
              <QRCodeSVG
                value={`EXIT-GATE-PASS|${orderNumber}|TOTAL=${totalAmount}|PAID`}
                size={140}
                level="M"
              />
            </div>
            <p className="mt-2 text-xs font-mono font-bold text-slate-800">
              {orderNumber}
            </p>
            <p className="text-[10px] text-slate-400">
              Scan this QR at the supermarket exit turnstile gate
            </p>
          </div>
        </div>

        {/* Itemized Digital Receipt Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Digital Tax Receipt</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Customer Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 border-b border-slate-100 pb-3">
            <div>
              <p className="text-[10px] text-slate-400">Customer</p>
              <p className="font-semibold text-slate-800">{customerName}</p>
              <p className="text-[10px] text-slate-400">{customerPhone}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Payment Method</p>
              <p className="font-semibold text-slate-800 uppercase">
                {payment?.method || "UPI Verified"}
              </p>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2 text-xs">
            {order?.items && order.items.length > 0 ? (
              order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-slate-800 truncate">{it.name}</p>
                    <p className="text-[10px] text-slate-400">
                      ₹{Number(it.unit_price || it.unitPrice || 0).toFixed(2)} × {it.quantity}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums text-slate-900">
                    ₹{Number(it.subtotal).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-2 text-slate-400 text-center">
                Express grocery scan basket ({orderNumber})
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">Amount Paid</span>
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handlePrint}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={handleDone}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
            >
              <span>Scan Next Cart</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SuccessPage;