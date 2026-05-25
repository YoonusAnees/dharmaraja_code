import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {  
    const original = error.config;

    if (
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      original.url.includes("/auth/login") ||
      original.url.includes("/auth/register") ||
      original.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await api.post("/auth/refresh");
      return api(original);
    } catch (refreshError) {
      if (!original.url.includes("/auth/me")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  }
);

export default api;