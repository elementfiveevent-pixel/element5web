const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:4000";
    }
  }
  return "https://element5website.onrender.com";
};

const BASE_URL = getBaseUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

async function request(path: string, options: RequestOptions = {}) {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  const url = new URL(`${cleanBase}/${cleanPath}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("e5_auth_token") : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url.toString(), config);

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: "GET" }),
  post: (path: string, body?: any, options?: RequestOptions) =>
    request(path, { ...options, method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path: string, body?: any, options?: RequestOptions) =>
    request(path, { ...options, method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: (path: string, body?: any, options?: RequestOptions) =>
    request(path, { ...options, method: "PATCH", body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: (path: string, options?: RequestOptions) => request(path, { ...options, method: "DELETE" }),
  baseUrl: BASE_URL,
};
