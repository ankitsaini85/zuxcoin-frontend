import axios from "axios";

const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const localApiBase = "http://localhost:5000/api";
const productionApiBase = "https://zuxbackend.onrender.com/api";

// Force local API while running on localhost to avoid accidental prod CORS issues.
const resolvedApiBase = productionApiBase;

const API = axios.create({
  baseURL: resolvedApiBase,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.authorization = token;
  return req;
});

export default API;
