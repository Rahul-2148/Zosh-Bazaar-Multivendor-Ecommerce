import { Navigate, Outlet } from "react-router-dom";

// Dummy auth check (isko baad me real auth state se connect karna hai)
const useAuth = () => {
  const user = localStorage.getItem("token"); // JWT ya auth state
  return !!user;
};

function ProtectedRoute() {
  const isAuth = useAuth();
  return isAuth === false ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
