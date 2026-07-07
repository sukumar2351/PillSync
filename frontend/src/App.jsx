import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Route guarding helper
const ProtectedRoute = ({ auth, allowedRoles, children }) => {
  if (!auth.token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    // Redirect to their default dashboard if role doesn't match
    if (auth.role === "patient") return <Navigate to="/patient-dashboard" replace />;
    if (auth.role === "caregiver") return <Navigate to="/caregiver-dashboard" replace />;
    if (auth.role === "admin") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token") || null,
    role: localStorage.getItem("role") || null,
    email: localStorage.getItem("email") || null,
  });

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            auth.token ? (
              auth.role === "admin" ? <Navigate to="/admin-dashboard" /> :
              auth.role === "patient" ? <Navigate to="/patient-dashboard" /> :
              <Navigate to="/caregiver-dashboard" />
            ) : (
              <Landing />
            )
          } 
        />
        
        <Route 
          path="/login" 
          element={
            auth.token ? (
              auth.role === "admin" ? <Navigate to="/admin-dashboard" replace /> :
              auth.role === "patient" ? <Navigate to="/patient-dashboard" replace /> :
              <Navigate to="/caregiver-dashboard" replace />
            ) : (
              <Login setAuth={setAuth} />
            )
          } 
        />
        
        <Route 
          path="/register" 
          element={
            auth.token ? (
              auth.role === "admin" ? <Navigate to="/admin-dashboard" replace /> :
              auth.role === "patient" ? <Navigate to="/patient-dashboard" replace /> :
              <Navigate to="/caregiver-dashboard" replace />
            ) : (
              <Register />
            )
          } 
        />

        {/* Protected Patient Routes */}
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute auth={auth} allowedRoles={["patient"]}>
              <PatientDashboard auth={auth} />
            </ProtectedRoute>
          }
        />

        {/* Protected Caregiver Routes */}
        <Route
          path="/caregiver-dashboard"
          element={
            <ProtectedRoute auth={auth} allowedRoles={["caregiver"]}>
              <CaregiverDashboard auth={auth} />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
              <AdminDashboard auth={auth} />
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Profile Page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute auth={auth}>
              <Profile auth={auth} />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
