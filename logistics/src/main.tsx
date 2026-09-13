import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { LogisticsAuthProvider } from "./context/LogisticsAuthContext";
import { LogisticsSocketProvider } from "./context/LogisticsSocketContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <LogisticsAuthProvider>
        <LogisticsSocketProvider>
          <App />
        </LogisticsSocketProvider>
      </LogisticsAuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
