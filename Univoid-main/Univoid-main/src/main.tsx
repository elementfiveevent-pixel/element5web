import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSecurityLockdown } from "./security/lockdown";

// Initialize security lockdown before React renders to block external badge injection
initSecurityLockdown();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);