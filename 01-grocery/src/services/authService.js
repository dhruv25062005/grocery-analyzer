import { apiRequest } from "./api";

export async function adminLogin(email, password) {
  return apiRequest("/admin/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function adminLogout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
}