import { BrowserRouter } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AdminRoutes } from "./routes/AdminRoutes";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AdminAuthProvider>
          <AdminRoutes />
        </AdminAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
