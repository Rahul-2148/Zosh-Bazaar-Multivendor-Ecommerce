import { Navigate, Outlet } from "react-router-dom";

const useAuth = () => {
  const user = localStorage.getItem("token");
  return !!user;
};

function PublicRoute() {
  const isAuth = useAuth();
  return !isAuth ? <Outlet /> : <Navigate to="/" replace />;
}

export default PublicRoute;
