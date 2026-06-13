// simple API wrapper with auth token injection and error handling
export const api = {
  async get(url: string) {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return { success: false, error: data?.error || `HTTP error! status: ${res.status}` };
      }
      return data || { success: true };
    } catch (e: any) {
      console.error("API GET failed:", e);
      return { success: false, error: "Network error: Connection to server failed." };
    }
  },

  async post(url: string, data: any) {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      const dataJson = await res.json().catch(() => null);
      if (!res.ok) {
        return { success: false, error: dataJson?.error || `HTTP error! status: ${res.status}` };
      }
      return dataJson || { success: true };
    } catch (e: any) {
      console.error("API POST failed:", e);
      return { success: false, error: "Network error: Connection to server failed." };
    }
  },

  async put(url: string, data?: any) {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      const dataJson = await res.json().catch(() => null);
      if (!res.ok) {
        return { success: false, error: dataJson?.error || `HTTP error! status: ${res.status}` };
      }
      return dataJson || { success: true };
    } catch (e: any) {
      console.error("API PUT failed:", e);
      return { success: false, error: "Network error: Connection to server failed." };
    }
  },

  async delete(url: string) {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return { success: false, error: data?.error || `HTTP error! status: ${res.status}` };
      }
      return data || { success: true };
    } catch (e: any) {
      console.error("API DELETE failed:", e);
      return { success: false, error: "Network error: Connection to server failed." };
    }
  },
};
