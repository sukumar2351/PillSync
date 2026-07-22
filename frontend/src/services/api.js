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

export const medicineService = {
  getMedicines: async () => {
    const response = await api.get("/medicines/");
    return response.data;
  },

  addMedicine: async (medData) => {
    const response = await api.post("/medicines/", medData);
    return response.data;
  },

  updateMedicine: async (id, medData) => {
    const response = await api.put(`/medicines/${id}`, medData);
    return response.data;
  },

  deleteMedicine: async (id) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
  },

  getRemindersToday: async () => {
    const response = await api.get("/medicines/reminders/today");
    return response.data;
  },

  logReminder: async (id, logData) => {
    const response = await api.post(`/medicines/${id}/reminders/log`, logData);
    return response.data;
  },

  getAdherenceHistory: async () => {
    const response = await api.get("/medicines/history");
    return response.data;
  },

  getPatientHistoryForCaregiver: async (patientId) => {
    const response = await api.get(`/medicines/history/patient/${patientId}`);
    return response.data;
  },

  getPatientHistoryByEmail: async (email) => {
    const response = await api.get(`/medicines/history/patient/email/${email}`);
    return response.data;
  },

  getNotificationSettings: async () => {
    const response = await api.get("/users/profile/notifications");
    return response.data;
  },

  updateNotificationSettings: async (settingsData) => {
    const response = await api.put("/users/profile/notifications", settingsData);
    return response.data;
  },

  sendTestEmail: async () => {
    const response = await api.post("/users/profile/notifications/test-email");
    return response.data;
  },
};

export default api;

