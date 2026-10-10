import { apiRequest } from "./api";

export async function createOrder(items) {
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    }),
  });
}

export async function getOrderById(orderId) {
  return apiRequest(`/orders/${orderId}`);
}

export async function getAllOrders() {
  return apiRequest("/orders");
}