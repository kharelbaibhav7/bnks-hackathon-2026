const API = "/api";

export const getToken = () => localStorage.getItem("agriflow_token");

export async function request(path, { method = "GET", body, headers } = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body }),
  register: (body) => request("/auth/register", { method: "POST", body }),
  me: () => request("/auth/me"),
  updateMe: (body) => request("/auth/me", { method: "PATCH", body }),
  seed: () => request("/seed", { method: "POST" }),
  catalog: () => request("/catalog"),
  inventory: () => request("/inventory"),
  saveInventory: (body) => request("/inventory", { method: "POST", body }),
  patchInventory: (id, body) => request(`/inventory/${id}`, { method: "PATCH", body }),
  deleteInventory: (id) => request(`/inventory/${id}`, { method: "DELETE" }),
  lowStock: () => request("/inventory/low"),
  scan: (vision) => request("/scan", { method: "POST", body: { vision } }),
  stats: () => request("/stats"),
  createOrder: (body) => request("/orders", { method: "POST", body }),
  orders: () => request("/orders"),
  order: (id) => request(`/orders/${id}`),
  farmerRequests: () => request("/farmer/requests"),
  respond: (id, body) => request(`/allocations/${id}/respond`, { method: "POST", body }),
  retailerHistory: () => request("/history/retailer"),
  farmerHistory: () => request("/history/farmer"),
  rate: (body) => request("/ratings", { method: "POST", body }),
  openJobs: (query = "") => request(`/transport/open${query}`),
  myJobs: () => request("/transport/mine"),
  job: (id) => request(`/transport/${id}`),
  acceptJobs: (jobIds) => request("/transport/accept", { method: "POST", body: { jobIds } }),
  jobStatus: (id, body) => request(`/transport/${id}/status`, { method: "POST", body }),
  jobLocation: (id, body) => request(`/transport/${id}/location`, { method: "POST", body }),
  nearby: (id) => request(`/transport/${id}/nearby`),
  track: (orderId) => request(`/track/${orderId}`),
  wallet: () => request("/wallet"),
  topup: (amount) => request("/wallet/topup", { method: "POST", body: { amount } }),
  messages: () => request("/messages"),
  sendMessage: (body) => request("/messages", { method: "POST", body }),
};
