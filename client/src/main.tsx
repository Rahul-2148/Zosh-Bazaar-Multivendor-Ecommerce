import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import store from "./Redux Toolkit/Store.ts";
import { registerDynamicImportRecovery } from "./utils/lazyWithRetry";

// Intercept any transient dynamic chunk failures and auto-recover
registerDynamicImportRecovery();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
