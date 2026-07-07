import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach Authorization header dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      // Optionally trigger reload or redirect if required
    }
    return Promise.reject(error);
  }
);

export const authService = {
  registerPatient: async (email, password, fullName) => {
    const response = await api.post("/auth/register/patient", {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  registerCaregiver: async (email, password, fullName) => {
    const response = await api.post("/auth/register/caregiver", {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { access_token, role, email: userEmail } = response.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("role", role);
    localStorage.setItem("email", userEmail);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  },
};

export const adminService = {
  getDashboardStats: async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
  },

  getUsersList: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },
};

export default api;
