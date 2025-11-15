import { useEffect } from "react";
import Navbar from "../../common/Navbar";
import { useAppDispatch } from "../../Redux Toolkit/Store";
import AdminRoutes from "../../routes/AdminRoutes";
import AdminDrawerList from "../Sidebar/AdminDrawerList";
import { getAllHomeCategories } from "../../Redux Toolkit/features/admin/AdminHomeCategorySlice";

const AdminDashboard = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getAllHomeCategories());
  }, [dispatch]);
  
  return (
    <div className="min-h-screen">
      <Navbar DrawerList={AdminDrawerList} />

      <section className="lg:flex lg:h-[100vh]">
        <div className="hidden lg:block h-full">
          <AdminDrawerList />
        </div>
        <div className="p-10 w-full lg:w-[80%] overflow-y-auto">
          <AdminRoutes />
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
