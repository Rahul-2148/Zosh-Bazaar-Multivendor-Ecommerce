import { useEffect } from "react";
import Navbar from "../../common/Navbar";
import { useAppDispatch } from "../../Redux Toolkit/Store";
import SellerRoutes from "../../routes/SellerRoutes";
import SellerDrawerList from "../Sidebar/SellerDrawerList";
import { fetchSellerReport } from "../../Redux Toolkit/features/seller/SellerSlice";

const SellerDashboard = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSellerReport(localStorage.getItem("jwt") || ""));
  }, [dispatch]);

  return (
    <div className="min-h-screen">
      <Navbar DrawerList={SellerDrawerList} />

      <section className="lg:flex lg:h-[100vh]">
        <div className="hidden lg:block h-full">
          <SellerDrawerList />
        </div>
        <div className="p-10 w-full lg:w-[80%] overflow-y-auto">
          <SellerRoutes />
        </div>
      </section>
    </div>
  );
};

export default SellerDashboard;
