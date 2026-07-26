import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Global error handler to catch React or JS failures and render them on screen
window.addEventListener("error", (e) => {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; borderRadius: 8px; margin: 2rem; font-family: monospace;">
        <h2 style="margin-top: 0;">Runtime Error Captured:</h2>
        <p><strong>Message:</strong> ${e.message}</p>
        <p><strong>Source:</strong> ${e.filename}:${e.lineno}:${e.colno}</p>
        <pre style="background: #fff; padding: 1rem; borderRadius: 4px; overflow: auto; border: 1px solid #fed7d7;">${e.error ? e.error.stack : 'No stack trace available'}</pre>
      </div>
    `;
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
