import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api"
});

/**
 * Attach JWT token to every request
 */
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

/**
 * Optional: global 401 handling
 */
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      console.warn("Unauthorized – token missing or expired");
    }
    return Promise.reject(err);
  }
);

export default api;
