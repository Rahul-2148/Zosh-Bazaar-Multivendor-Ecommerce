import { Outlet } from "react-router-dom";
import Navbar from "../../Navbar/Navbar";
import Footer from "../../Footer/Footer";

function Layout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Outlet /> {/* Yaha nested pages load honge */}
      </main>
      <Footer />
    </>
  );
}

export default Layout;
