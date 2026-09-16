import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../customer/Navbar/Navbar";
import Footer from "../customer/Footer/Footer";
import { MobileBottomNav } from "../customer/Navbar/MobileBottomNav";
import PageLoader from "../common/PageLoader";

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CustomerLayout;
