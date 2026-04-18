const API_BASE = "/api/v1";

class ApiError extends Error {
  constructor(message, status, fieldErrors = null) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { fieldname: "error message", ... }
  }
}

// Parse FastAPI validation error detail array into field-specific errors
function parseValidationError(detail) {
  if (!Array.isArray(detail)) return null;
  const errors = {};
  for (const error of detail) {
    if (error.loc && error.loc.length >= 2 && error.msg) {
      const field = error.loc[1]; // e.g., ["body", "username"] → "username"
      errors[field] = error.msg;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

async function request(method, endpoint, body = null, token = null, _retry = true) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  });

  // Auto-refresh on 401: swap the token and retry once
  if (res.status === 401 && _retry) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh?refresh_token=${refreshToken}`, { method: "POST" });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem("access_token",  refreshData.access_token);
          localStorage.setItem("refresh_token", refreshData.refresh_token);
          return request(method, endpoint, body, refreshData.access_token, false);
        }
      } catch {}
    }
    // Refresh failed — clear tokens so the app re-routes to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({ detail: "Unknown error" }));
  if (!res.ok) {
    let message = data.detail ?? "Request failed";
    let fieldErrors = null;

    // Parse validation errors (422) into field-specific errors
    if (res.status === 422) {
      fieldErrors = parseValidationError(data.detail);
      if (fieldErrors) {
        // Use first field error as main message
        const firstField = Object.keys(fieldErrors)[0];
        message = fieldErrors[firstField];
      } else if (Array.isArray(data.detail)) {
        message = "Please check your input";
      }
    }

    throw new ApiError(message, res.status, fieldErrors);
  }
  return data;
}

const getToken = () => localStorage.getItem("access_token");

export const api = {
  // Auth
  register: (body)        => request("POST", "/auth/register", body),
  login:    (email, pass) => {
    const form = new URLSearchParams({ username: email, password: pass });
    return fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw new ApiError(d.detail, r.status);
      return d;
    });
  },
  refresh: (refreshToken) =>
    request("POST", `/auth/refresh?refresh_token=${refreshToken}`),

  // Users
  getMe:          ()       => request("GET",  "/users/me",           null, getToken()),
  updateMe:       (body)   => request("PUT",  "/users/me",           body, getToken()),
  getUser:        (name)   => request("GET",  `/users/${name}`),
  getUserBoards:  (name)   => request("GET",  `/users/${name}/boards`),

  // Boards
  getBoards:  (params = {}) => {
    const q = new URLSearchParams();
    if (params.page)  q.set("page", params.page);
    if (params.size)  q.set("size", params.size);
    if (params.q)     q.set("q", params.q);
    if (params.tags)  params.tags.forEach(t => q.append("tags", t));
    return request("GET", `/boards/?${q}`);
  },
  getMyBoards: (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", params.page);
    if (params.size) q.set("size", params.size);
    if (params.q)    q.set("q", params.q);
    return request("GET", `/boards/my?${q}`, null, getToken());
  },
  getTags:      ()       => request("GET", "/boards/tags"),
  getBoard:     (id)     => request("GET", `/boards/${id}`, null, getToken()),
  createBoard:  (body)   => request("POST",   "/boards/",   body, getToken()),
  updateBoard:  (id, b)  => request("PUT",    `/boards/${id}`, b, getToken()),
  deleteBoard:  (id)     => request("DELETE", `/boards/${id}`, null, getToken()),

  // Sounds
  uploadSound: (formData) => request("POST", "/sounds/upload", formData, getToken()),
  getSound:    (id)       => request("GET",  `/sounds/${id}`),
  updateSound: (id, body) => request("PUT",  `/sounds/${id}`, body, getToken()),
  deleteSound: (id)       => request("DELETE", `/sounds/${id}`, null, getToken()),
  streamUrl:   (id)       => `${API_BASE}/sounds/${id}/stream`,
};

export { ApiError };
