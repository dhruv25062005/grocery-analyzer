import { apiRequest } from "./api";

export async function getProductByBarcode(barcode) {
  return apiRequest(
    `/products/barcode/${encodeURIComponent(barcode)}`
  );
}

export async function getAllProducts() {
  return apiRequest("/products");
}

export async function createProduct(product) {
  return apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(productId, product) {
  return apiRequest(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(productId) {
  return apiRequest(`/products/${productId}`, {
    method: "DELETE",
  });
}

export async function getInventoryProducts() {
  return apiRequest("/products/inventory");
}
export async function updateProductStock(productId, stock) {
  return apiRequest(`/products/${productId}/stock`, {
    method: "PATCH",
    body: JSON.stringify({
      stock,
    }),
  });
}