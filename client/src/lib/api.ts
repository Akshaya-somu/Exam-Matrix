export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accessToken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        // Retry original request
        return fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${data.accessToken}`,
          },
        });
      }
    }

    // Refresh failed, redirect to login
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message);
  }

  return response.json();
}
