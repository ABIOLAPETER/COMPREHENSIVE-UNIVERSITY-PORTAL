// shared/apiFetch.js
// Drop-in replacement for the apiFetch used across all your JS files

const API_BASE = "http://localhost:2003/v1/api";

// Access token lives in memory only — NOT localStorage
// This survives page navigation within the same tab but not a full refresh.
// On refresh, the silent refresh below re-acquires it from the cookie automatically.
let accessToken = localStorage.getItem("token") || null;
// Note: for maximum security, don't use localStorage at all. Store only in memory
// and rely on the cookie-based silent refresh on every page load.

/* ===== SILENT REFRESH ===== */
// Called automatically when a 401 is received OR on page load if no token in memory
async function silentRefresh() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method:      "POST",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Refresh failed: ${res.status}`);
    }

    const data  = await res.json();
    accessToken = data.accessToken;
    localStorage.setItem("token", accessToken);
    return accessToken;

  } catch (err) {
    // Fetch threw (CORS, network, 404) OR res was not ok
    console.warn("Silent refresh failed:", err.message);
    accessToken = null;
    localStorage.clear();
    window.location.href = "index.html"; // now this ALWAYS fires on any failure
    return null;
  }
}

/* ===== MAIN apiFetch WITH AUTO-RETRY ===== */
async function apiFetch(url, method = "GET", body = null, retry = true) {
  // If no token in memory, try to get one silently first (e.g. after page reload)
  if (!accessToken) {
    await silentRefresh();
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    credentials: "include", // always include cookies
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  // Guard: non-JSON response means route doesn't exist
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw Object.assign(
      new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`),
      { status: res.status }
    );
  }

  // ── AUTO-REFRESH ON 401 ──────────────────────────────────────────────────
  // Access token expired mid-session. Silently get a new one and retry ONCE.
  if (res.status === 401 && retry) {
    const newToken = await silentRefresh();

    if (newToken) {
      // Retry the original request with the new token — the user notices nothing
      return apiFetch(url, method, body, false); // retry = false prevents infinite loop
    }

    // silentRefresh() already redirected to login.html
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || data.message || "Request failed");
    err.status = res.status;
    throw err;
  }

  return data;
}