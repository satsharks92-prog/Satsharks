// simple API wrapper with auth token injection
export const api = {
  async get(url: string) {
    const token = localStorage.getItem("accessToken");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    return res.json();
  },

  async post(url: string, data: any) {
    const token = localStorage.getItem("accessToken");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
