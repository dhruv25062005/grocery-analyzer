import { apiRequest } from "./api";

export async function createPayment(orderId, method) {
  return apiRequest("/payments", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      method,
    }),
  });
}

export async function verifyPayment(paymentId) {
  return apiRequest("/payments/verify", {
    method: "POST",
    body: JSON.stringify({
      paymentId,
    }),
  });
}

export async function getAllPayments() {
  return apiRequest("/payments");
}