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

  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await api.post("/auth/verify-otp", { email, otp });
    return response.data;
  },

  resetPassword: async (email, otp, password) => {
    const response = await api.post("/auth/reset-password", { email, otp, password });
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

  updateEmail: async (newEmail, password) => {
    const response = await api.put("/users/profile/email", {
      new_email: newEmail,
      password: password,
    });
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

export const caregiverService = {
  getAssignedPatients: async () => {
    const response = await api.get("/caregivers/patients");
    return response.data;
  },

  getPatientsHistory: async () => {
    const response = await api.get("/caregivers/patients/history");
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get("/caregivers/dashboard/summary");
    return response.data;
  },

  getDetailedPatientHistory: async (patientId) => {
    const response = await api.get(`/caregiver/patient/${patientId}/history`);
    return response.data;
  },

  updateCaregiverProfile: async (profileData) => {
    const response = await api.put("/caregiver/profile", profileData);
    return response.data;
  },

  patchCaregiverProfile: async (profileData) => {
    const response = await api.patch("/caregiver/profile", profileData);
    return response.data;
  },
};

export const medicineMasterService = {
  search: async (query) => {
    const response = await api.get(`/medicine-master/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  getApproved: async () => {
    const response = await api.get("/medicine-master/");
    return response.data;
  },
  getPending: async () => {
    const response = await api.get("/medicine-master/pending");
    return response.data;
  },
  requestMedicine: async (data) => {
    const response = await api.post("/medicine-master/request", data);
    return response.data;
  },
  approveMedicine: async (id) => {
    const response = await api.put(`/medicine-master/${id}/approve`);
    return response.data;
  },
  createDirect: async (data) => {
    const response = await api.post("/medicine-master/", data);
    return response.data;
  },
};

export const ocrService = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/ocr/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  extractPrescription: async (recordId = null, file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/ocr/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data;
    }
    const url = recordId ? `/ocr/extract?record_id=${recordId}` : "/ocr/extract";
    const response = await api.post(url);
    return response.data;
  },
  saveMedicines: async (medicinesList) => {
    const response = await api.post("/ocr/save-medicines", { medicines: medicinesList });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get("/ocr/history");
    return response.data;
  },
  getRecordDetail: async (id) => {
    const response = await api.get(`/ocr/history/${id}`);
    return response.data;
  },
};

export const drugInteractionService = {
  checkInteractions: async (medicineName) => {
    const response = await api.post("/drug-interactions/check", { medicine_name: medicineName });
    return response.data;
  },
};

export const reportsService = {
  getSummary: async (patientId = null) => {
    const url = patientId ? `/reports/summary?patient_id=${patientId}` : "/reports/summary";
    const response = await api.get(url);
    return response.data;
  },
  getDailyAdherence: async (days = 30, patientId = null) => {
    const url = patientId ? `/reports/adherence/daily?days=${days}&patient_id=${patientId}` : `/reports/adherence/daily?days=${days}`;
    const response = await api.get(url);
    return response.data;
  },
  getWeeklyAdherence: async (weeks = 12, patientId = null) => {
    const url = patientId ? `/reports/adherence/weekly?weeks=${weeks}&patient_id=${patientId}` : `/reports/adherence/weekly?weeks=${weeks}`;
    const response = await api.get(url);
    return response.data;
  },
};

export const emergencyCardService = {
  getCard: async (patientId = null) => {
    const url = patientId ? `/emergency-card/?patient_id=${patientId}` : "/emergency-card/";
    const response = await api.get(url);
    return response.data;
  },
  updateCard: async (data) => {
    const response = await api.post("/emergency-card/", data);
    return response.data;
  },
};

export const insightsService = {
  getInsights: async (patientId = null) => {
    const url = patientId ? `/insights/?patient_id=${patientId}` : "/insights/";
    const response = await api.get(url);
    return response.data;
  },
};

export default api;

